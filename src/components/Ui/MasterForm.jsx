import { Modal, Form, Input, Button, message } from "antd";
import { saveMaster } from "../../services/api";
import { notify } from "../../services/notify";

export default function MasterForm({
  open,
  onClose,
  type,
  initialValues,
  onSaved,
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const res = await saveMaster({
        ...values,
        Id: initialValues?.id || 0,
        Command: type,
      });
      if (res?.data.code == "0") {
        notify({ type: "success", message: res?.data?.message });
        onSaved();
        onClose();
      } else {
        notify({ type: "error", message: "Faild to save data." });
      }
    } catch (err) {
      notify({ type: "error", message: err.message });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={initialValues ? `Edit ${type}` : `Add ${type}`}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSubmit}>
          Save
        </Button>,
      ]}
    >
      <Form form={form} initialValues={initialValues || {}} layout="vertical">
        {console.log(initialValues)}
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Remark">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
