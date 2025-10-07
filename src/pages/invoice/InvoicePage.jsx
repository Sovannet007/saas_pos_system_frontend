// src/pages/InvoicePage.jsx
import { useState } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  DatePicker,
  Form,
  Space,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

export default function InvoicePage() {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);

  const addNewItem = () => {
    const newItem = {
      key: Date.now(),
      product: "",
      qty: 1,
      costPrice: 0,
      wholePrice: 0,
      salePrice: 0,
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (key, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDelete = (key) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.qty || 0) * (item.salePrice || 0),
    0
  );

  const handleSave = () => {
    const invoiceData = {
      ...form.getFieldsValue(),
      date: form.getFieldValue("date")?.format("YYYY-MM-DD"),
      items,
      totalAmount,
    };
    console.log("Invoice Saved:", invoiceData);
    message.success("Invoice saved successfully!");
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "product",
      render: (_, record) => (
        <Input
          value={record.product}
          onChange={(e) =>
            handleItemChange(record.key, "product", e.target.value)
          }
          placeholder="Enter product"
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "qty",
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.qty}
          onChange={(val) => handleItemChange(record.key, "qty", val)}
        />
      ),
    },
    {
      title: "Cost Price",
      dataIndex: "costPrice",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.costPrice}
          onChange={(val) => handleItemChange(record.key, "costPrice", val)}
        />
      ),
    },
    {
      title: "Whole Price",
      dataIndex: "wholePrice",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.wholePrice}
          onChange={(val) => handleItemChange(record.key, "wholePrice", val)}
        />
      ),
    },
    {
      title: "Sale Price",
      dataIndex: "salePrice",
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.salePrice}
          onChange={(val) => handleItemChange(record.key, "salePrice", val)}
        />
      ),
    },
    {
      title: "Amount",
      render: (_, record) => (
        <span>{((record.qty || 0) * (record.salePrice || 0)).toFixed(2)}</span>
      ),
    },
    {
      title: "Action",
      width: 100,
      render: (_, record) => (
        <Button danger onClick={() => handleDelete(record.key)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={3}>🧾 Invoice</Title>

      {/* Invoice Header */}
      <Form form={form} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item
          label="Invoice No"
          name="invoiceNo"
          rules={[{ required: true }]}
        >
          <Input placeholder="INV-001" />
        </Form.Item>
        <Form.Item label="Date" name="date" initialValue={dayjs()}>
          <DatePicker />
        </Form.Item>
        <Form.Item
          label="Customer"
          name="customer"
          rules={[{ required: true }]}
        >
          <Input placeholder="Enter customer name" />
        </Form.Item>
      </Form>

      {/* Invoice Items */}
      <Table
        dataSource={items}
        columns={columns}
        pagination={false}
        bordered
        rowKey="key"
      />

      <div style={{ marginTop: 10 }}>
        <Button type="dashed" onClick={addNewItem}>
          + Add Item
        </Button>
      </div>

      {/* Total */}
      <div style={{ marginTop: 20, textAlign: "right", fontSize: "16px" }}>
        <strong>Total: ${totalAmount.toFixed(2)}</strong>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 20, textAlign: "right" }}>
        <Space>
          <Button onClick={() => setItems([])}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save Invoice
          </Button>
        </Space>
      </div>
    </div>
  );
}
