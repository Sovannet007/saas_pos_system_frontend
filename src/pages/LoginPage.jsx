import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card as AntCard, Input, Button, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
// import { notify } from "../services/notify";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.username, form.password);
      nav(res.isSystemOwner ? "/select-company" : "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-white to-gray-100 px-4">
      <AntCard className="w-full max-w-md rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <Title level={2} className="!mb-1">
            POS System
          </Title>
          <Text type="secondary">សូមចូលគណនីរបស់អ្នក</Text>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <Input
            size="large"
            prefix={<UserOutlined />}
            placeholder="ឈ្មោះអ្នកប្រើ"
            value={form.username}
            onChange={(e) =>
              setForm((p) => ({ ...p, username: e.target.value }))
            }
          />
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="ពាក្យសម្ងាត់"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="!w-full !bg-black"
            disabled={loading}
          >
            {loading ? (
              <Spinner label="សូមអត់ធ្មត់រង់ចាំ..." />
            ) : (
              "ចូលប្រើប្រាស់"
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Text type="secondary">© {new Date().getFullYear()} POS SaaS</Text>
        </div>
      </AntCard>
    </div>
  );
}
