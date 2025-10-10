import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import { getMaster, deleteMaster } from "../../services/api";
import MasterForm from "./MasterForm";
import { notify } from "../../services/notify";
import { useAuth } from "../../context/AuthContext";

export default function MasterTable({ type }) {
  const { currentCompany } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMaster({ companyId: currentCompany.id });
      if (type === "category") setData(res.data.category || []);
      if (type === "uom") setData(res.data.uom || []);
      if (type === "brand") setData(res.data.brand || []);
    } catch (err) {
      notify({ type: "error", message: err.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, currentCompany.id]);

  const handleDelete = async (id) => {
    try {
      await deleteMaster(type, id);
      message.success("Deleted successfully");
      fetchData();
    } catch {
      message.error("Delete failed");
    }
  };

  const columns = [
    { title: "No", render: (__, _, idx) => <p>{idx + 1}</p> },
    { title: "Name", dataIndex: "name" },
    { title: "Remark", dataIndex: "description" },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditData(record);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <Button
          type="primary"
          className="bg-green-500 text-white hover:bg-green-600"
          onClick={() => {
            setEditData(null);
            setFormOpen(true);
          }}
        >
          Add {type}
        </Button>
      </div>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
      />

      {formOpen && (
        <MasterForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          type={type}
          initialValues={editData}
          onSaved={fetchData}
        />
      )}
    </>
  );
}
