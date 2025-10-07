import { useEffect, useState } from "react";
import {
  Collapse,
  Card,
  Avatar,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Popconfirm,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { getUserList, saveUser, changePassword } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../services/notify";
import { usePagePerms } from "../context/MenuContext";

const { Title } = Typography;

const groupByRole = (users) =>
  users.reduce((groups, user) => {
    if (!groups[user.RoleName]) groups[user.RoleName] = [];
    groups[user.RoleName].push(user);
    return groups;
  }, {});

export default function UserManagementPage() {
  // manage permission by route click
  const perms = usePagePerms("User");
  const can = (k) => perms?.full || !!perms?.[k];

  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreate, setIsCreate] = useState(true); // 🔒 explicit flag
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const grouped = groupByRole(users);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUserList({ companyId: currentCompany.id });
      if (res?.data?.users?.length > 0 || res?.data?.roles?.length > 0) {
        setUsers(res.data.users);
        setRoles(res.data.roles || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      notify({ type: "error", message: "Failed to load users." });
      setUsers([]);
    }
    setLoading(false);
  };

  const handleDelete = (userId) => {
    // call delete API if you have one
    setUsers(users.filter((u) => u.UserId !== userId));
    notify({ type: "success", message: "User deleted successfully." });
  };

  const openCreateModal = (roleName = null, user = null) => {
    if (user) {
      // UPDATE
      setIsCreate(false);
      form.resetFields();
      form.setFieldsValue({
        Id: user.UserId, // 👈 store target Id in form
        Username: user.Username,
        RoleId: user.RoleId,
        Password: "", // will be hidden anyway
      });
    } else {
      // CREATE
      setIsCreate(true);
      form.resetFields();
      let roleId = null;
      if (roleName) {
        const role = roles.find((r) => r.RoleName === roleName);
        if (role) roleId = role.RoleId;
      }
      form.setFieldsValue({
        Id: 0,
        Username: "",
        RoleId: roleId,
        Password: "",
      });
    }
    setCreateModalVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        CompanyId: currentCompany.id,
        Id: values.Id ?? 0,
        Username: values.Username,
        RoleId: values.RoleId,
        Password: isCreate ? values.Password : null, // 👈 ONLY on create
      };
      const res = await saveUser(payload);
      if (res?.data?.code == 0) {
        notify({
          type: "success",
          message: res?.data?.message || "Saved successfully.",
        });
        setCreateModalVisible(false);
        loadData();
      } else {
        notify({
          type: "error",
          message: res?.data?.message || "Save failed.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      notify({ type: "error", message: "Save failed." });
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    pwdForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      const payload = {
        UserId: selectedUser.UserId,
        OldPassword: values.OldPassword,
        NewPassword: values.NewPassword,
      };
      const res = await changePassword(payload);
      if (res?.data?.code == "0") {
        notify({ type: "success", message: res.data.message });
        setPasswordModalVisible(false);
        return;
      }
      if (res?.data?.code == "-1") {
        notify({ type: "error", message: res.data.message });
        setPasswordModalVisible(true);
        return;
      } else {
        notify({
          type: "error",
          message: res?.data?.message || "Password change failed.",
        });
      }
    } catch (err) {
      console.error("Password change error:", err);
      notify({ type: "error", message: "Password change failed." });
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="!mb-0">
          👥 User Management
        </Title>
        {can("add") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreateModal()}
          >
            Create User
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        {users.length === 0 && !loading ? (
          <Empty description="No records found" />
        ) : (
          <Collapse
            accordion
            bordered={false}
            style={{ background: "transparent" }}
          >
            {Object.keys(grouped).map((role) => (
              <Collapse.Panel
                header={
                  <Space className="flex justify-between w-full">
                    <div className="font-medium">
                      {role}{" "}
                      <span className="text-gray-500">
                        ({grouped[role].length})
                      </span>
                    </div>
                    {/* if can add */}
                    {can("add") && (
                      <Button
                        size="small"
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCreateModal(role);
                        }}
                      >
                        Add
                      </Button>
                    )}
                  </Space>
                }
                key={role}
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Row gutter={[16, 16]}>
                  {grouped[role].map((user) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={user.UserId}>
                      <Card
                        hoverable
                        bordered
                        style={{ borderRadius: 12 }}
                        actions={[
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            key="edit"
                            onClick={() => openCreateModal(user.RoleName, user)}
                          />,
                          <Button
                            type="text"
                            icon={<KeyOutlined />}
                            key="password"
                            onClick={() => openPasswordModal(user)}
                          />,
                          <Popconfirm
                            title="Delete this user?"
                            onConfirm={() => handleDelete(user.UserId)}
                            key="delete-confirm"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              key="delete"
                            />
                          </Popconfirm>,
                        ]}
                      >
                        <Card.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={user.Username}
                          description={`Role: ${user.RoleName}`}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Collapse.Panel>
            ))}
          </Collapse>
        )}
      </Spin>

      {/* Create/Update User Modal */}
      <Modal
        title={isCreate ? "Create User" : "Update User"}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={handleSaveUser}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          {/* store target user id for SP as Id */}
          <Form.Item name="Id" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="Username"
            label="Username"
            rules={[{ required: true, message: "Please input username" }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            name="RoleId"
            label="Role"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select
              placeholder="Select role"
              options={roles.map((r) => ({
                value: r.RoleId,
                label: r.RoleName,
              }))}
            />
          </Form.Item>

          {/* keep the field but hide it when updating */}
          <Form.Item
            name="Password"
            label="Password"
            hidden={!isCreate} // 👈 hides on update
            rules={
              isCreate
                ? [{ required: true, message: "Password is required!" }]
                : []
            }
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={`Change Password for ${selectedUser?.Username || ""}`}
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onOk={handleChangePassword}
        okText="Change Password"
      >
        <Form form={pwdForm} layout="vertical">
          <Form.Item
            name="OldPassword"
            label="Old Password"
            rules={[{ required: true, message: "Please input old password" }]}
          >
            <Input.Password placeholder="Enter old password" />
          </Form.Item>
          <Form.Item
            name="NewPassword"
            label="New Password"
            rules={[{ required: true, message: "Please input new password" }]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["NewPassword"]}
            rules={[
              { required: true, message: "Please confirm new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("NewPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
