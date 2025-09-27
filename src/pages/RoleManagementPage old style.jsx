import { useEffect, useMemo, useState } from "react";
import { Table, Checkbox, Button, Card, Spin, Empty } from "antd";
import { getRolePermissions, saveRolePermission } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { notify } from "../services/notify";

export default function RoleManagementPage() {
  const { currentCompany } = useAuth();

  const [rows, setRows] = useState([]); // flat array from API
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({}); // { 'roleId-moduleId': true }

  const loadPermissions = async () => {
    if (!currentCompany?.id) return;
    setLoading(true);
    try {
      const res = await getRolePermissions({ companyId: currentCompany.id });
      const flat = Array.isArray(res?.data?.data) ? res.data.data : [];

      // normalize to booleans just in case API gives 0/1
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

  // ✅`recompute permissions on currentCompany change
  useEffect(
    () => {
      loadPermissions();
    },
    // watch current company
    // eslint-disable-next-line
    [currentCompany?.id]
  );

  const togglePermission = (record, perm) => {
    setRows((prev) =>
      prev.map((it) => {
        if (it.role_id !== record.role_id || it.module_id !== record.module_id)
          return it;

        // If toggling FULL → set all to the same value
        if (perm === "full") {
          const next = !it.full;
          return {
            ...it,
            full: next,
            list: next,
            add: next,
            edit: next,
            delete: next,
            print: next,
            cost: next,
          };
        }

        // Toggling any child perm. If FULL was true and child flips to false, drop FULL.
        const nextVal = !it[perm];
        const after = { ...it, [perm]: nextVal };
        if (it.full && !nextVal) {
          after.full = false;
        }
        return after;
      })
    );
  };

  const saveRow = async (record) => {
    const key = `${record.role_id}-${record.module_id}`;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await saveRolePermission({
        companyId: currentCompany.id,
        roleId: record.role_id,
        moduleId: record.module_id,
        full: record.full ? 1 : 0,
        list: record.list ? 1 : 0,
        add: record.add ? 1 : 0,
        edit: record.edit ? 1 : 0,
        delete: record.delete ? 1 : 0,
        print: record.print ? 1 : 0,
        cost: record.cost ? 1 : 0,
      });
      notify({
        type: "success",
        message: `Saved ${record.module_name} for ${record.role_name}`,
        description: "Success",
      });
    } catch (e) {
      notify({
        type: "error",
        message: `Failed to save ${record.module_name} for ${record.role_name}`,
        description: e.message,
      });
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  // Group by role_name safely
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
      title: "ម៉ូឌុល",
      dataIndex: "module_name",
      key: "module_name",
    },
    ...perms.map((perm) => ({
      title: perm.toUpperCase(),
      key: perm,
      align: "center",
      render: (_, record) => (
        <Checkbox
          checked={record[perm]}
          onChange={() => togglePermission(record, perm)}
        />
      ),
    })),
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => {
        const key = `${record.role_id}-${record.module_id}`;
        return (
          <Button
            type="primary"
            size="small"
            loading={!!saving[key]}
            onClick={() => saveRow(record)}
          >
            Save
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Spin />
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
          title={`${roleName} Role`}
          bordered={false}
          className="shadow"
        >
          <Table
            rowKey={(r) => `${r.role_id}-${r.module_id}`}
            dataSource={roleRows}
            columns={makeColumns()}
            pagination={false}
            bordered
          />
        </Card>
      ))}
    </div>
  );
}
