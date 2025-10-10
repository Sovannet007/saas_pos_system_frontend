import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Switch,
  Card,
  Spin,
  Empty,
  Button,
  Modal,
  Form,
  Input,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  getRolePermissions,
  saveRolePermission,
  saveMaster,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../services/notify";
import { usePagePerms } from "../context/MenuContext";

export default function RoleManagementPage() {
  const permissions = usePagePerms("Role");
  const can = (k) => permissions?.full || !!permissions?.[k];
  const { currentCompany } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const loadPermissions = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const res = await getRolePermissions({ companyId: currentCompany.id });
      const flat = Array.isArray(res?.data?.data) ? res.data.data : [];

      const normalized = flat.map((r) => ({
        ...r,
        full: !!r.full,
        list: !!r.list,
        add: !!r.add,
        edit: !!r.edit,
        delete: !!r.delete,
        print: !!r.print,
        cost: !!r.cost,
      }));

      setRows(normalized);
    } catch (e) {
      notify({
        type: "error",
        message: "Failed to load permissions",
        description: e.message,
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany?.id]);

  const saveSwitch = async (record, perm, value) => {
    if (!can("edit")) {
      notify({ type: "warning", message: "No permission to edit" });
      return;
    }

    const key = `${record.role_id}-${record.module_id}-${perm}`;
    setSaving((s) => ({ ...s, [key]: true }));

    setRows((prev) =>
      prev.map((it) => {
        if (it.role_id !== record.role_id || it.module_id !== record.module_id)
          return it;

        if (perm === "full") {
          return {
            ...it,
            full: value,
            list: value,
            add: value,
            edit: value,
            delete: value,
            print: value,
            cost: value,
          };
        }

        const after = { ...it, [perm]: value };
        if (it.full && !value) after.full = false;
        return after;
      })
    );

    try {
      await saveRolePermission({
        roleId: record.role_id,
        moduleId: record.module_id,
        full: perm === "full" ? (value ? 1 : 0) : record.full ? 1 : 0,
        list: perm === "list" ? (value ? 1 : 0) : record.list ? 1 : 0,
        add: perm === "add" ? (value ? 1 : 0) : record.add ? 1 : 0,
        edit: perm === "edit" ? (value ? 1 : 0) : record.edit ? 1 : 0,
        delete: perm === "delete" ? (value ? 1 : 0) : record.delete ? 1 : 0,
        print: perm === "print" ? (value ? 1 : 0) : record.print ? 1 : 0,
        cost: perm === "cost" ? (value ? 1 : 0) : record.cost ? 1 : 0,
      });

      notify({
        type: "success",
        message: `${perm.toUpperCase()} ${value ? "enabled" : "disabled"}`,
        description: `Module ${record.module_name} for ${record.role_name}`,
      });
    } catch (e) {
      notify({
        type: "error",
        message: `Failed to save ${record.module_name} (${perm})`,
        description: e.message,
      });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const groupedByRole = useMemo(() => {
    if (!Array.isArray(rows)) return {};
    return rows.reduce((acc, item) => {
      const key = item.role_name || `Role #${item.role_id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [rows]);

  const perms = ["full", "list", "add", "edit", "delete", "print", "cost"];

  const makeColumns = () => [
    {
      title: "Module Name",
      dataIndex: "module_display",
      key: "module_display",
      render: (text) => (
        <span className="font-medium text-blue-600 cursor-pointer underline">
          {text}
        </span>
      ),
    },
    ...perms.map((perm) => ({
      title: perm.toUpperCase(),
      key: perm,
      align: "center",
      render: (_, record) => {
        const key = `${record.role_id}-${record.module_id}-${perm}`;
        return (
          <Switch
            checked={record[perm]}
            size="small"
            loading={!!saving[key]}
            disabled={!can("edit")}
            onChange={(val) => saveSwitch(record, perm, val)}
            style={{
              backgroundColor: record[perm] ? "#52c41a" : "#a6aebc",
              border: record[perm] ? "none" : "1px solid #ff4d4f",
            }}
          />
        );
      },
    })),
  ];

  const handleOpenModal = (role) => {
    setEditingRole(role || null);
    form.resetFields();
    if (role) {
      form.setFieldsValue({
        name: role.role_name,
        description: role.description || "",
      });
    }
    setModalOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields();
      await saveMaster({
        companyId: currentCompany.id,
        Id: editingRole?.role_id || 0,
        Name: values.name,
        Descriptions: values.description,
        Command: "role",
      });
      notify({
        type: "success",
        message: `Role ${editingRole ? "updated" : "created"} successfully`,
      });
      setModalOpen(false);
      loadPermissions();
    } catch (e) {
      notify({ type: "error", message: e.message });
    }
  };

  // 🟢 Always render the modal here, outside any return branch
  const RoleModal = (
    <Modal
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      onOk={handleSaveRole}
      title={editingRole ? "Edit Role" : "New Role"}
      okText="Save"
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label="Role Name"
          rules={[{ required: true, message: "Please enter role name" }]}
        >
          <Input placeholder="Enter role name" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea placeholder="Enter description" />
        </Form.Item>
      </Form>
    </Modal>
  );

  if (loading) {
    return (
      <>
        <div className="grid place-items-center py-10">
          <Spin size="large" />
        </div>
        {RoleModal}
      </>
    );
  }

  if (!rows.length) {
    return (
      <>
        <Card
          title={
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Role Management</span>
              {can("add") && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                >
                  New Role
                </Button>
              )}
            </div>
          }
          variant="simple"
        >
          <Empty description="No permission data" />
        </Card>
        {RoleModal}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <span className="text-xl font-semibold">Role Management</span>
          {can("add") && (
            <Button
              type="primary"
              className="bg-green-500 text-white hover:bg-green-600"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              New Role
            </Button>
          )}
        </div>
        {Object.entries(groupedByRole).map(([roleName, roleRows]) => (
          <Card
            key={roleName}
            title={
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-normal">
                    ការគ្រប់គ្រងសិទ្ទប្រើប្រាស់ចំពោះតួនាទី
                  </span>
                  <span className="font-semibold text-xl text-red-600">
                    {roleName}
                  </span>
                </div>
                {can("edit") && (
                  <Button
                    size="small"
                    type="default"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenModal(roleRows[0])}
                  >
                    Edit Role
                  </Button>
                )}
              </div>
            }
            bordered={false}
            className="shadow-md rounded-xl"
            headStyle={{ background: "#f9fafb", borderRadius: "8px 8px 0 0" }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              rowKey={(r) => `${r.role_id}-${r.module_id}`}
              dataSource={roleRows}
              columns={makeColumns()}
              pagination={false}
              size="middle"
              bordered={false}
              className="rounded-lg modern-table"
            />
          </Card>
        ))}
      </div>
      {RoleModal}
    </>
  );
}
