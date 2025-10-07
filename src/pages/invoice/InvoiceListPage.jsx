// src/pages/InvoiceListPage.jsx
import { Table, Button, Space, Typography } from "antd";

const { Title } = Typography;

// mock invoices
const invoices = [
  {
    id: 1,
    invoiceNo: "INV-001",
    customer: "John Doe",
    date: "2025-10-01",
    total: 120.5,
  },
  {
    id: 2,
    invoiceNo: "INV-002",
    customer: "Alice Smith",
    date: "2025-10-02",
    total: 250.0,
  },
];

export default function InvoiceListPage() {
  const columns = [
    { title: "Invoice No", dataIndex: "invoiceNo" },
    { title: "Customer", dataIndex: "customer" },
    { title: "Date", dataIndex: "date" },
    { title: "Total ($)", dataIndex: "total" },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button type="link">View</Button>
          <Button type="link">Print</Button>
          <Button type="link" danger>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>📑 Invoice List</Title>
      <Table rowKey="id" dataSource={invoices} columns={columns} bordered />
    </div>
  );
}
