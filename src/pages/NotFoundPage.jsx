import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center">
      <Result
        status="404"
        title="រកមិនឃើញទំព័រ (404)"
        subTitle="ទំព័រដែលអ្នកស្វែងរកមិនមានទេ"
        extra={<Button onClick={() => nav("/login")}>Go Login</Button>}
      />
    </div>
  );
}
