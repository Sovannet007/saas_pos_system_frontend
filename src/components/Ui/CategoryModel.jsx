import React, { useState, useEffect } from "react";
import { Modal, Input, Form, Button } from "antd";
import { saveCategory } from "../../services/api"; // assume your API service
import { notify } from "../../services/notify";

export default function CategoryModal({ open, onClose, onSaved, initialData }) {
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
      await saveCategory(values); // call api service
      notify({
        type: "success",
        message: "Category saved.",
      });
      onSaved(); // refresh dropdown or table
      form.setFieldsValue();
      onClose();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={initialData ? "Edit Category" : "Add Category"}
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
          label="Category Name"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="Description" label="Description">
          <Input.TextArea rows={3} />
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
