import { useState } from "react";
import { Tabs } from "antd";
import MasterTable from "../components/Ui/MasterTable";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("category");

  const tabs = [
    { key: "category", label: "Category" },
    { key: "uom", label: "Unit of Measure" },
    { key: "brand", label: "Brand" },
  ];

  return (
    <div style={{ padding: 8 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs.map((t) => ({
          key: t.key,
          label: t.label,
          children: <MasterTable type={t.key} />,
        }))}
      />
    </div>
  );
}
