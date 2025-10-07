import { useEffect, useState } from "react";
import { Modal, Input, Form, Button } from "antd";
import { saveMaster } from "../../services/api"; // implement in your API service
import { notify } from "../../services/notify";

export default function UomModal({ open, onClose, onSaved, initialData }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // call api service
      await saveMaster({ ...values, Command: "uom" }); // call api service

      notify({
        type: "success",
        message: "UOM saved.",
      });
      onSaved?.(); // refresh list in parent if provided
      onClose?.();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={initialData ? "Edit UOM" : "Add UOM"}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="Id" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="Name"
          label="UOM Name"
          rules={[{ required: true, message: "Please enter UOM name" }]}
        >
          <Input placeholder="e.g., Piece, Box, Kg" />
        </Form.Item>

        <Form.Item name="Description" label="Description">
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleSave}>
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
