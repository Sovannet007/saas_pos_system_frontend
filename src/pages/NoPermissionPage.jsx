import { Result } from "antd";

export default function NoPermissionPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Result
        status="403"
        title="គ្មានសិទ្ធិ (403)"
        subTitle="សូមទាក់ទងអ្នកគ្រប់គ្រងដើម្បីបន្ថែមសិទ្ធិ"
      />
    </div>
  );
}
