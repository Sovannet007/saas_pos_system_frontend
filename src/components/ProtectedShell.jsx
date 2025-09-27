import { Layout, Typography } from "antd";
import { useAuth } from "../context/AuthContext";
import CompanySwitcher from "./CompanySwitcher";

const { Header, Content } = Layout;
const { Text } = Typography;

export default function ProtectedShell({ children, onCompanySwitched }) {
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">POS SaaS</span>
          <CompanySwitcher onSwitched={onCompanySwitched} />
        </div>
        <div className="flex items-center gap-4">
          <Text type="secondary">
            {user?.username} • Role {user?.role_id}
          </Text>
          <button
            className="rounded-xl bg-gray-900 text-white px-3 py-1.5 hover:opacity-90"
            onClick={logout}
          >
            ចេញ
          </button>
        </div>
      </Header>
      <Content className="p-6 bg-gray-50">{children}</Content>
    </Layout>
  );
}
