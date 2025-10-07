import { Tabs } from "antd";
import InvoicePage from "./InvoicePage";
import InvoiceListPage from "./InvoiceListPage";

export default function InvoiceTabs() {
  return (
    <Tabs
      defaultActiveKey="list"
      items={[
        { key: "list", label: "Invoice List", children: <InvoiceListPage /> },
        { key: "sale", label: "Sale Screen", children: <InvoicePage /> },
      ]}
    />
  );
}
