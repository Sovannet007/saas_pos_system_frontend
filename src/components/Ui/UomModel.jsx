import React, { useEffect, useState } from "react";
import { Modal, Input, Form, Button, message } from "antd";
import { saveUom } from "../../services/api"; // implement in your API service

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
      const res = saveUom(values);

      // follow your CategoryModal convention (res.code === 0 means success)
      if (res?.code === 0 || res?.data?.code === 0) {
        message.success("UOM saved successfully");
        onSaved?.(); // refresh list in parent if provided
        onClose?.();
      } else {
        message.error(res?.message || res?.data?.message || "Error saving UOM");
      }
    } catch (err) {
      // validation errors are handled by antd; only log unexpected errors
      if (!err?.errorFields) {
        // not a validation error
        // eslint-disable-next-line no-console
        console.error(err);
        message.error("Unexpected error");
      }
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
        {/* keep same casing/payload shape as your CategoryModal */}
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

        <Form.Item name="Code" label="UOM Code">
          <Input placeholder="e.g., PCS, BOX, KG" />
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
