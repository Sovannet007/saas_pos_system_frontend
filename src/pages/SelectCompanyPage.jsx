import { useState } from "react";
import { Modal, List, Typography } from "antd";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

export default function SelectCompanyPage() {
  const { companies, selectCompany, user } = useAuth();
  const [open, setOpen] = useState(true);
  const [loadingId, setLoadingId] = useState(0);
  const nav = useNavigate();

  const onPick = async (id) => {
    setLoadingId(id);
    try {
      await selectCompany(id);
      setOpen(false);
      nav("/dashboard");
    } finally {
      setLoadingId(0);
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      footer={null}
      title="ជ្រើសរើសក្រុមហ៊ុន"
      centered
    >
      {!companies || companies.length === 0 ? (
        <div className="py-6 text-center">
          <Text>គ្មានក្រុមហ៊ុនសម្រាប់អ្នកប្រើ {user?.username}</Text>
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={companies}
          renderItem={(c) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50 rounded-lg"
              onClick={() => onPick(c.company_id)}
              actions={[
                loadingId === c.company_id ? (
                  <Spinner label="សូមអត់ធ្មត់រង់ចាំ..." />
                ) : (
                  <Text type="secondary">ជ្រើស →</Text>
                ),
              ]}
            >
              <List.Item.Meta
                title={<span className="font-medium">{c.company_name}</span>}
                description={
                  <span className="text-gray-500">{c.company_code}</span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
