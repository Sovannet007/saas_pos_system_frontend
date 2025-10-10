import React, { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  Collapse,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Divider,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  LockOutlined,
  UserAddOutlined,
  ApartmentOutlined,
  SettingOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Panel } = Collapse;

import { useAuth } from "../context/AuthContext";
import { saveMaster, tanantCompanyList } from "../services/api";
import { notify } from "../services/notify";

/* -------------------------------------------
   MOCK DATA (nested Company → Roles → Users)
-------------------------------------------- */
const initialMock = [
  {
    company_id: 1,
    company_name: "OTOKHI Co., Ltd",
    company_code: "OT001",
    company_address: "Phnom Penh",
    is_active: true,
    allow_login: true,
    roles: [
      {
        role_id: 2,
        role_name: "Company Admin",
        role_description: "Manage company & users",
        users: [
          { user_id: 5, username: "kimvuthul", is_active: true },
          { user_id: 6, username: "sopheap", is_active: true },
        ],
      },
      {
        role_id: 3,
        role_name: "POS Operator",
        role_description: "POS & Invoice",
        users: [
          { user_id: 7, username: "dara", is_active: true },
          { user_id: 8, username: "lina", is_active: false },
        ],
      },
    ],
  },
  {
    company_id: 2,
    company_name: "Piisiit Co., Ltd",
    company_code: "PII001",
    company_address: "Siem Reap",
    is_active: true,
    allow_login: true,
    roles: [
      {
        role_id: 10,
        role_name: "Warehouse Staff",
        role_description: "Manage stock",
        users: [
          { user_id: 21, username: "chan", is_active: true },
          { user_id: 22, username: "sokha", is_active: true },
        ],
      },
    ],
  },
];

/* ------------------------------------------------
   Helper: create IDs in mock mode (simple counter)
------------------------------------------------- */
let companyIdCounter = 1000;
let roleIdCounter = 5000;
let userIdCounter = 9000;

export default function SystemSettings() {
  // user info from auth context
  const { currentCompany } = useAuth();

  // data
  const [data, setData] = useState(initialMock);

  // Company Modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyForm] = Form.useForm();
  const [currentCompanyId, setCurrentCompanyId] = useState(0);

  // Role Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleForm] = Form.useForm();
  const [currentRoleCompanyId, setCurrentRoleCompanyId] = useState(null);
  const [currentRoleId, setCurrentRoleId] = useState(0);

  // User Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm] = Form.useForm();
  const [currentUserRoleId, setCurrentUserRoleId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(0);

  // Change Password Modal
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [pwdUser, setPwdUser] = useState(null);

  // load data
  const loadData = async () => {
    const res = await tanantCompanyList();
    console.log(res);
    if (res?.data?.result?.code == 0) {
      setData(res?.data?.result?.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const companiesById = useMemo(() => {
    const map = new Map();
    data.forEach((c) => map.set(c.company_id, c));
    return map;
  }, [data]);

  const findRole = (roleId) => {
    for (const c of data) {
      for (const r of c.roles) {
        if (r.role_id === roleId) return { role: r, company: c };
      }
    }
    return null;
  };

  const findUser = (userId) => {
    for (const c of data) {
      for (const r of c.roles) {
        for (const u of r.users) {
          if (u.user_id === userId) return { user: u, role: r, company: c };
        }
      }
    }
    return null;
  };

  /* ===========================
        COMPANY MODAL
  ============================ */
  const openNewCompany = () => {
    setCurrentCompanyId(0);
    companyForm.resetFields();
    companyForm.setFieldsValue({
      company_name: "",
      company_code: "",
      company_address: "",
      is_active: true,
      allow_login: true,
    });
    setCompanyModalOpen(true);
  };

  const openEditCompany = (company_id) => {
    const c = companiesById.get(company_id);
    if (!c) return;
    setCurrentCompanyId(company_id);
    companyForm.setFieldsValue({
      company_name: c.company_name,
      company_code: c.company_code,
      company_address: c.company_address,
      is_active: c.is_active,
      allow_login: c.allow_login,
    });
    setCompanyModalOpen(true);
  };

  const saveCompany = async () => {
    try {
      const values = await companyForm.validateFields();
      const payload = {
        CompanyId: currentCompanyId || 0,
        CompanyName: values.company_name,
        CompanyCode: values.company_code,
        CompanyAddress: values.company_address,
        IsActive: values.is_active ? 1 : 0,
        AllowLogin: values.allow_login ? 1 : 0,
        UserId: 1,
      };

      console.log("Payload → SP_SYS_COMPANY_SAVE_V1", payload);
      // TODO: call your real API here

      if (payload.CompanyId === 0) {
        const newCompany = {
          company_id: ++companyIdCounter,
          company_name: payload.CompanyName,
          company_code: payload.CompanyCode,
          company_address: payload.CompanyAddress,
          is_active: payload.IsActive === 1,
          allow_login: payload.AllowLogin === 1,
          roles: [],
        };
        setData((prev) => [newCompany, ...prev]);
        message.success("Company created (mock).");
      } else {
        setData((prev) =>
          prev.map((c) =>
            c.company_id === payload.CompanyId
              ? {
                  ...c,
                  company_name: payload.CompanyName,
                  company_code: payload.CompanyCode,
                  company_address: payload.CompanyAddress,
                  is_active: payload.IsActive === 1,
                  allow_login: payload.AllowLogin === 1,
                }
              : c
          )
        );
        message.success("Company updated (mock).");
      }
      setCompanyModalOpen(false);
    } catch (err) {}
  };

  /* ===========================
        ROLE MODAL
  ============================ */
  const openAddRole = (company_id) => {
    setCurrentRoleId(0);
    setCurrentRoleCompanyId(company_id);
    roleForm.resetFields();
    setRoleModalOpen(true);
  };

  const openEditRole = (role_id) => {
    const found = findRole(role_id);
    if (!found) return;
    const { role, company } = found;
    setCurrentRoleId(role.role_id);
    setCurrentRoleCompanyId(company.company_id);
    roleForm.setFieldsValue({
      role_name: role.role_name,
      role_description: role.role_description,
    });
    setRoleModalOpen(true);
  };

  const saveRole = async () => {
    try {
      const values = await roleForm.validateFields();

      await saveMaster({
        companyId: currentCompany.id,
        Id: currentRoleId || 0,
        Name: values.name,
        Descriptions: values.description,
        Command: "role",
      });
      notify({
        type: "success",
        message: `Role ${currentRoleId ? "updated" : "created"} successfully`,
      });

      //   if (payload.RoleId === 0) {
      //     const newRole = {
      //       role_id: ++roleIdCounter,
      //       role_name: payload.RoleName,
      //       role_description: payload.RoleDescription,
      //       users: [],
      //     };
      //     setData((prev) =>
      //       prev.map((c) =>
      //         c.company_id === payload.CompanyId
      //           ? { ...c, roles: [...c.roles, newRole] }
      //           : c
      //       )
      //     );
      //     message.success("Role created (mock).");
      //   } else {
      //     setData((prev) =>
      //       prev.map((c) =>
      //         c.company_id === payload.CompanyId
      //           ? {
      //               ...c,
      //               roles: c.roles.map((r) =>
      //                 r.role_id === payload.RoleId
      //                   ? {
      //                       ...r,
      //                       role_name: payload.RoleName,
      //                       role_description: payload.RoleDescription,
      //                     }
      //                   : r
      //               ),
      //             }
      //           : c
      //       )
      //     );
      //     message.success("Role updated (mock).");
      //   }
      setRoleModalOpen(false);
    } catch (err) {}
  };

  /* ===========================
        USER MODAL
  ============================ */
  const openAddUser = (role_id) => {
    setCurrentUserId(0);
    setCurrentUserRoleId(role_id);
    userForm.resetFields();
    setUserModalOpen(true);
  };

  const openEditUser = (user_id) => {
    const found = findUser(user_id);
    if (!found) return;
    const { user, role } = found;
    setCurrentUserId(user.user_id);
    setCurrentUserRoleId(role.role_id);
    userForm.setFieldsValue({
      username: user.username,
      is_active: user.is_active,
    });
    setUserModalOpen(true);
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      const payload = {
        UserId: currentUserId || 0,
        Username: values.username,
        Password: values.password || "",
        RoleId: currentUserRoleId,
        IsActive: values.is_active ? 1 : 0,
        CreatedBy: 1,
      };

      console.log("Payload → SP_SYS_USER_SAVE_V1", payload);
      // TODO: call your real API here

      if (payload.UserId === 0) {
        const newUser = {
          user_id: ++userIdCounter,
          username: payload.Username,
          is_active: payload.IsActive === 1,
        };
        setData((prev) =>
          prev.map((c) => ({
            ...c,
            roles: c.roles.map((r) =>
              r.role_id === payload.RoleId
                ? { ...r, users: [...r.users, newUser] }
                : r
            ),
          }))
        );
        message.success("User created (mock).");
      } else {
        setData((prev) =>
          prev.map((c) => ({
            ...c,
            roles: c.roles.map((r) =>
              r.role_id === payload.RoleId
                ? {
                    ...r,
                    users: r.users.map((u) =>
                      u.user_id === payload.UserId
                        ? {
                            ...u,
                            username: payload.Username,
                            is_active: payload.IsActive === 1,
                          }
                        : u
                    ),
                  }
                : r
            ),
          }))
        );
        message.success("User updated (mock).");
      }
      setUserModalOpen(false);
    } catch (err) {}
  };

  /* ===========================
        PASSWORD MODAL
  ============================ */
  const openChangePassword = (user_id) => {
    const found = findUser(user_id);
    if (!found) return;
    const { user } = found;
    setPwdUser({ user_id: user.user_id, username: user.username });
    pwdForm.resetFields();
    setPwdModalOpen(true);
  };

  const savePassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      if (values.new_password !== values.confirm_password) {
        message.error("Passwords do not match.");
        return;
      }
      const payload = {
        UserId: pwdUser.user_id,
        NewPassword: values.new_password,
        UpdatedBy: 1,
      };
      console.log("Payload → SP_SYS_USER_CHANGE_PASSWORD_V1", payload);
      // TODO: call your real API here
      message.success("Password changed (mock).");
      setPwdModalOpen(false);
    } catch (err) {}
  };

  /* ===========================
        RENDER UI
  ============================ */
  const renderUsers = (users, role_id) =>
    users?.length ? (
      users.map((u) => (
        <div
          key={u.user_id}
          style={{
            borderBottom: "1px solid #f0f0f0",
            padding: "8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            👤 <Text strong>{u.username}</Text>{" "}
            <Text type={u.is_active ? "success" : "danger"}>
              {u.is_active ? "(Active)" : "(Inactive)"}
            </Text>
          </div>
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditUser(u.user_id)}
            >
              Edit
            </Button>
            <Button
              size="small"
              icon={<LockOutlined />}
              onClick={() => openChangePassword(u.user_id)}
            >
              Change Pwd
            </Button>
          </Space>
        </div>
      ))
    ) : (
      <Text type="secondary">No users in this role</Text>
    );

  const renderRoles = (roles, company_id) =>
    roles?.length ? (
      roles.map((r) => (
        <div
          key={r.role_id}
          style={{
            borderLeft: "3px solid #e6f4ff",
            paddingLeft: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div>
              🧭 <Text strong>{r.role_name}</Text>{" "}
              <Text type="secondary">{r.role_description}</Text>
            </div>
            <Space>
              <Button
                size="small"
                onClick={() => openAddUser(r.role_id)}
                icon={<UserAddOutlined />}
                type="dashed"
              >
                Add User
              </Button>
              <Button
                size="small"
                onClick={() => openEditRole(r.role_id)}
                icon={<EditOutlined />}
              >
                Edit Role
              </Button>
            </Space>
          </div>
          <div style={{ marginLeft: 8, marginTop: 8 }}>
            {renderUsers(r.users, r.role_id)}
          </div>
        </div>
      ))
    ) : (
      <Text type="secondary">No roles yet</Text>
    );

  const CompanyHeader = ({ c }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: 600 }}>
        🏢 {c.company_name} ({c.company_code})
      </div>
      <Space>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEditCompany(c.company_id)}
        >
          Edit
        </Button>
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => openAddRole(c.company_id)}
          type="dashed"
        >
          Add Role
        </Button>
      </Space>
    </div>
  );

  return (
    <div>
      {/* <div style={{ padding: 16 }}> */}
      <div
      // style={{
      //   background: "#fff",
      //   borderRadius: 12,
      //   border: "1px solid #f0f0f0",
      //   padding: 16,
      // }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <SettingOutlined /> System Settings
          </Title>
          <Button
            type="primary"
            className="bg-green-500 text-white hover:bg-green-600"
            icon={<PlusOutlined />}
            onClick={openNewCompany}
          >
            New Company
          </Button>
        </div>

        <Tabs
          defaultActiveKey="companies"
          items={[
            {
              key: "companies",
              label: (
                <span>
                  <ApartmentOutlined /> Company Management
                </span>
              ),
              children: (
                <Collapse accordion>
                  {data.map((c) => (
                    <Panel header={<CompanyHeader c={c} />} key={c.company_id}>
                      {renderRoles(c.roles, c.company_id)}
                    </Panel>
                  ))}
                </Collapse>
              ),
            },
            {
              key: "config",
              label: (
                <span>
                  <SettingOutlined /> System Config
                </span>
              ),
              children: (
                <Text type="secondary">
                  (Placeholder) Add global settings here later.
                </Text>
              ),
            },
            {
              key: "audit",
              label: (
                <span>
                  <HistoryOutlined /> Audit Log
                </span>
              ),
              children: (
                <Text type="secondary">
                  (Placeholder) Audit history will appear here later.
                </Text>
              ),
            },
          ]}
        />
      </div>

      {/* Company Modal */}
      <Modal
        title={
          <span>
            <ApartmentOutlined /> {currentCompanyId === 0 ? "New" : "Edit"}{" "}
            Company
          </span>
        }
        open={companyModalOpen}
        onCancel={() => setCompanyModalOpen(false)}
        onOk={saveCompany}
        okText="Save"
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={companyForm}
          initialValues={{ is_active: true, allow_login: true }}
        >
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Company Name" />
          </Form.Item>
          <Form.Item
            name="company_code"
            label="Company Code"
            rules={[{ required: true }]}
          >
            <Input placeholder="Company Code" />
          </Form.Item>
          <Form.Item name="company_address" label="Address">
            <Input.TextArea placeholder="Address" rows={3} />
          </Form.Item>
          <Divider />
          <Space size="large">
            <Form.Item name="is_active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="allow_login"
              label="Allow Login"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Role Modal */}
      <Modal
        title={
          <span>
            <UserAddOutlined /> {currentRoleId === 0 ? "New" : "Edit"} Role
          </span>
        }
        open={roleModalOpen}
        onCancel={() => setRoleModalOpen(false)}
        onOk={saveRole}
        okText="Save"
        destroyOnClose
      >
        <Form layout="vertical" form={roleForm}>
          <Form.Item label="Company ID">
            <Input value={currentRoleCompanyId ?? ""} disabled />
          </Form.Item>
          <Form.Item
            name="role_name"
            label="Role Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Role Name" />
          </Form.Item>
          <Form.Item name="role_description" label="Description">
            <Input.TextArea placeholder="Description" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* User Modal */}
      <Modal
        title={
          <span>
            <UserAddOutlined /> {currentUserId === 0 ? "New" : "Edit"} User
          </span>
        }
        open={userModalOpen}
        onCancel={() => setUserModalOpen(false)}
        onOk={saveUser}
        okText="Save"
        destroyOnClose
      >
        <Form layout="vertical" form={userForm}>
          <Form.Item label="Role ID">
            <Input value={currentUserRoleId ?? ""} disabled />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input placeholder="Username" />
          </Form.Item>
          {currentUserId === 0 && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          )}
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={
          <span>
            <LockOutlined /> Change Password
          </span>
        }
        open={pwdModalOpen}
        onCancel={() => setPwdModalOpen(false)}
        onOk={savePassword}
        okText="Update Password"
        destroyOnClose
      >
        <Form layout="vertical" form={pwdForm}>
          <Form.Item label="User">
            <Input
              value={pwdUser ? `${pwdUser.username} (#${pwdUser.user_id})` : ""}
              disabled
            />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="New Password"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="New Password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={["new_password"]}
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
