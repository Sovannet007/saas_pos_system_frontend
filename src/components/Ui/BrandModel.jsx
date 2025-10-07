import { useEffect } from "react";
import { Modal, Form, Input, Button, Row, Col } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { saveMaster } from "../../services/api"; // 🧩 use your API helper like Category/UOM
import { notify } from "../../services/notify";
import { useAuth } from "../../context/AuthContext";

export default function BrandModal({
  open,
  onClose,
  onSaved,
  brandDetail = null,
}) {
  const [form] = Form.useForm();
  const { currentCompany, currentUser } = useAuth();

  useEffect(() => {
    if (brandDetail) {
      form.setFieldsValue(brandDetail);
    } else {
      form.resetFields();
    }
  }, [brandDetail, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        Command: "brand",
        CompanyId: currentCompany?.id,
        Id: brandDetail?.id || 0,
        Name: values.name,
        Description: values.description || "",
        LogoPath: values.logoPath || "",
        Website: values.website || "",
        UserId: currentUser?.id,
      };

      const res = await saveMaster(payload);
      if (res.data?.code === 200) {
        notify.success("បានរក្សាទុកម៉ាកជោគជ័យ។");
        onSaved?.();
      } else {
        notify.error(res.data?.message || "រក្សាទុកបរាជ័យ");
      }
    } catch (err) {
      console.error(err);
      notify.error("មានបញ្ហាក្នុងការរក្សាទុក");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      closable={false}
      centered
      width={500}
      title={
        <div className="flex justify-between items-center w-full">
          <span className="font-semibold text-lg">
            {brandDetail ? "កែប្រែម៉ាក" : "បន្ថែមម៉ាកថ្មី"}
          </span>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      }
      footer={[
        <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
          បិទ
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSubmit}
        >
          រក្សាទុក
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label="ឈ្មោះម៉ាក"
              name="name"
              rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះម៉ាក" }]}
            >
              <Input placeholder="ឧទាហរណ៍៖ Coca-Cola, Samsung" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="គេហទំព័រ (Website)" name="website">
              <Input placeholder="https://example.com" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Logo Path" name="logoPath">
              <Input placeholder="/uploads/brands/logo.png" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="ពិពណ៌នា" name="description">
              <Input.TextArea rows={3} placeholder="បញ្ចូលពិពណ៌នារបស់ម៉ាក..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
