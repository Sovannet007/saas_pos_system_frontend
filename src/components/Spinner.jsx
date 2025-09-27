import { Spin } from "antd";

export default function Spinner({
  label = "កំពុងទាញទិន្ន័យ...",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 text-gray-700 ${className}`}>
      <Spin />
      <span className="text-sm">{label}</span>
    </div>
  );
}
