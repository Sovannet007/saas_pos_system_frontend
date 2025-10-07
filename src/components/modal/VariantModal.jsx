import { Modal, Form, Input, InputNumber, Button } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useEffect } from "react";

export default function VariantModal({ open, onClose, onSave, initialValues }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave?.(values);
    } catch (err) {
      console.log("Validation error:", err);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      title={initialValues ? "កែប្រែ Variant" : "បន្ថែម Variant"}
      footer={[
        <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
          បិទ
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSubmit}
          icon={<SaveOutlined />}
        >
          រក្សាទុក
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="ឈ្មោះ Variant"
          name="name"
          rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះ Variant" }]}
        >
          <Input placeholder="e.g. Red / Medium" />
        </Form.Item>
        <Form.Item label="តម្លៃដើម" name="costPrice" initialValue={0}>
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="តម្លៃលក់ដុំ" name="wholesalePrice" initialValue={0}>
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="តម្លៃលក់រាយ" name="salePrice" initialValue={0}>
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="ចំនួន" name="qty" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
