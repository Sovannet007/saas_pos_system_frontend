import { useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Space,
  Typography,
  message,
  Flex,
  Divider,
} from "antd";
import {
  SearchOutlined,
  PrinterOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import TemplateA4Standard from "./templates/TemplateA4Standard";
import TemplateSmallPaper from "./templates/TemplateSmallPaper";
import TemplateInventory from "./templates/TemplateInventory";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const templates = {
  A4Standard: TemplateA4Standard,
  SmallPaper: TemplateSmallPaper,
  Inventory: TemplateInventory,
};

// Mock invoice data
const mockInvoices = [
  {
    id: 1,
    invoiceNo: "INV-1001",
    customer: "John Doe",
    date: "2025-10-10",
    time: "09:20 AM",
    total: 125.5,
  },
  {
    id: 2,
    invoiceNo: "INV-1002",
    customer: "Alice Smith",
    date: "2025-10-10",
    time: "11:40 AM",
    total: 210.0,
  },
  {
    id: 3,
    invoiceNo: "INV-0999",
    customer: "Bob Chan",
    date: "2025-10-09",
    time: "18:50 PM",
    total: 142.0,
  },
  {
    id: 4,
    invoiceNo: "INV-0988",
    customer: "Dara Sok",
    date: "2025-10-08",
    time: "15:30 PM",
    total: 62.0,
  },
];

function groupByDate(invoices) {
  const groups = {};
  for (const inv of invoices) {
    if (!groups[inv.date]) groups[inv.date] = [];
    groups[inv.date].push(inv);
  }
  return Object.entries(groups)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, list]) => ({ date, list }));
}

export default function InvoiceMainPage() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [templateModal, setTemplateModal] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [globalTemplate, setGlobalTemplate] = useState(
    localStorage.getItem("invoiceTemplate") || "A4Standard"
  );

  const grouped = useMemo(() => {
    const s = search.toLowerCase().trim();
    const filtered = mockInvoices.filter((inv) => {
      const matchText =
        inv.invoiceNo.toLowerCase().includes(s) ||
        inv.customer.toLowerCase().includes(s);
      const matchDate =
        dateRange.length === 0 ||
        (inv.date >= dateRange[0]?.format("YYYY-MM-DD") &&
          inv.date <= dateRange[1]?.format("YYYY-MM-DD"));
      return matchText && matchDate;
    });
    return groupByDate(filtered);
  }, [search, dateRange]);

  const TemplateComponent = templates[globalTemplate] || TemplateA4Standard;

  return (
    <div
      style={{
        padding: 16,
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 🔹 Header Bar */}
      <Flex
        align="center"
        justify="space-between"
        style={{
          marginBottom: 12,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          📑 Invoice List
        </Title>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => window.open("/pos", "_blank")}
        >
          POS
        </Button>
      </Flex>

      {/* 🔹 Filters */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Flex align="center" gap={12} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 250 }}
          />
        </Flex>
      </Card>

      {/* 🔹 Invoice Groups */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        <style>{`
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        `}</style>

        {grouped.map((group) => (
          <Card
            key={group.date}
            size="small"
            style={{
              marginBottom: 16,
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "#fafafa",
                padding: "8px 16px",
                fontWeight: 600,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              📅 {group.date}
            </div>

            {group.list.map((inv) => (
              <Flex
                key={inv.id}
                align="center"
                justify="space-between"
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #f5f5f5",
                  transition: "background 0.2s ease",
                  background: "#fff",
                }}
                className="invoice-row"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <Flex vertical gap={2}>
                  <Text strong style={{ color: "#1677ff" }}>
                    {inv.invoiceNo}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {inv.customer}
                  </Text>
                </Flex>

                <Flex gap={32} align="center">
                  <Text type="secondary">
                    {inv.time} | <b>${inv.total.toFixed(2)}</b>
                  </Text>

                  <Space>
                    <Button
                      size="small"
                      icon={<PrinterOutlined />}
                      onClick={() => {
                        setPrintInvoice(inv);
                        setPrintModal(true);
                      }}
                    >
                      Print
                    </Button>
                    <Button
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={() => setTemplateModal(true)}
                    >
                      Template
                    </Button>
                  </Space>
                </Flex>
              </Flex>
            ))}
          </Card>
        ))}

        {grouped.length === 0 && (
          <Card
            size="small"
            style={{
              textAlign: "center",
              padding: 40,
              borderRadius: 10,
              color: "#999",
            }}
          >
            <Text type="secondary">No invoices found.</Text>
          </Card>
        )}
      </div>

      {/* 🔹 Template Selection Modal */}
      <Modal
        title="Select Global Invoice Template"
        open={templateModal}
        onCancel={() => setTemplateModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {[
            { code: "A4Standard", label: "🧾 A4 Standard Invoice" },
            { code: "SmallPaper", label: "🧾 Small Paper - POS Style" },
            { code: "Inventory", label: "📦 Inventory Format" },
          ].map((t) => (
            <Button
              key={t.code}
              block
              onClick={() => {
                setGlobalTemplate(t.code);
                localStorage.setItem("invoiceTemplate", t.code);
                setTemplateModal(false);
                message.success(`Template changed to ${t.label}`);
              }}
            >
              {t.label}
            </Button>
          ))}
        </Space>
      </Modal>

      {/* 🔹 Print Modal */}
      <Modal
        title={`Invoice Preview (${globalTemplate})`}
        open={printModal}
        onCancel={() => setPrintModal(false)}
        width={globalTemplate === "SmallPaper" ? 380 : 800}
        footer={[
          <Button key="close" onClick={() => setPrintModal(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print
          </Button>,
        ]}
      >
        {printInvoice ? (
          <div style={{ background: "#fff", padding: 10 }}>
            <TemplateComponent invoice={printInvoice} />
          </div>
        ) : (
          <p>No invoice selected.</p>
        )}
      </Modal>
    </div>
  );
}
