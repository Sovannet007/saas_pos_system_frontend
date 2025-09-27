import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center">
      <Result
        status="401"
        title="មិនបានអនុញ្ញាត (401)"
        subTitle="សូមចូលប្រើប្រាស់ម្តងទៀត"
        extra={
          <Button type="primary" onClick={() => nav("/login")}>
            ចូលប្រើប្រាស់
          </Button>
        }
      />
    </div>
  );
}
