import { useEffect, useMemo, useState } from "react";
import { Table, Switch, Card, Spin, Empty, Tag } from "antd";
import { getRolePermissions, saveRolePermission } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../services/notify";

export default function RoleManagementPage() {
  const { currentCompany } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({}); // { 'roleId-moduleId-perm': true }

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
  }, [currentCompany?.id]);

  const saveSwitch = async (record, perm, value) => {
    const key = `${record.role_id}-${record.module_id}-${perm}`;
    setSaving((s) => ({ ...s, [key]: true }));

    // Update UI instantly
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
        companyId: currentCompany.id,
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

      // ✅ success toast
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
      dataIndex: "module_name",
      key: "module_name",
      render: (text) => (
        <span className="font-medium text-gray-800">{text}</span>
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

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <Card title="Role Management" bordered={false}>
        <Empty description="No permission data" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByRole).map(([roleName, roleRows]) => (
        <Card
          key={roleName}
          title={
            <div className="flex items-center justify-center gap-2">
              <span className="text-[17px]">Permission for Role</span>
              <span className="font-semibold text-xl text-red-600">
                {roleName}
              </span>
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
  );
}
