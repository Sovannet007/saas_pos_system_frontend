// src/components/Ui/ProductModel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  CopyOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";

// Permissions
import { usePagePerms } from "../../context/MenuContext";

// Inline modals
import CategoryModal from "./CategoryModel";
import UomModal from "./UomModel";

export default function ProductModal({
  open,
  onClose,
  onSave,
  initialValues,
  categories = [],
  uoms = [],
  /** optional: parent can pass this to refresh master lists after add */
  onReloadMaster,
}) {
  const [form] = Form.useForm();

  // 🔐 page/module permissions
  const perms = usePagePerms("Product");
  const can = (k) => perms?.full || !!perms?.[k];
  const canCost = can("cost");

  // Local copy (so we can render new items immediately after saving in mini-modal)
  const [localCats, setLocalCats] = useState(categories);
  const [localUoms, setLocalUoms] = useState(uoms);

  // Small modals
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [uomModalOpen, setUomModalOpen] = useState(false);

  useEffect(() => {
    setLocalCats(categories);
  }, [categories]);

  useEffect(() => {
    setLocalUoms(uoms);
  }, [uoms]);

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

  // Search filter for antd Select
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const categoryOptions = useMemo(
    () =>
      (localCats || []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [localCats]
  );

  const uomOptions = useMemo(
    () =>
      (localUoms || []).map((u) => ({
        value: u.id,
        label: u.name,
      })),
    [localUoms]
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave?.(values);
    } catch (err) {
      // keep your debug
      console.log(err);
    }
  };

  // After saving Category/UOM, we close the modal, refresh master if parent provided,
  // or at least leave the UI consistent.
  const afterSavedCategory = async () => {
    setCatModalOpen(false);
    if (onReloadMaster) {
      await onReloadMaster(); // parent should update categories/uoms via API
    }
  };
  const afterSavedUom = async () => {
    setUomModalOpen(false);
    if (onReloadMaster) {
      await onReloadMaster();
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={1100}
        centered
        title={
          <span className="font-semibold text-lg">
            {initialValues ? "កែប្រែទំនិញ" : "បញ្ចូលទំនិញថ្មី"}
          </span>
        }
        footer={[
          <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
            បិទ
          </Button>,
          initialValues && (
            <Button
              key="duplicate"
              icon={<CopyOutlined />}
              onClick={() => onSave?.({ ...initialValues, id: null })}
            >
              Duplicate
            </Button>
          ),
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
          >
            {initialValues ? "Update" : "Save"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {/* LEFT SIDE */}
            <Col span={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="លេខរាងផលិតផល" name="id">
                    <Input placeholder="Product ID" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="លេខកូដ *"
                    name="code"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Product Code" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="ឈ្មោះផលិតផល"
                name="name"
                rules={[{ required: true }]}
              >
                <Input placeholder="Product Name..." />
              </Form.Item>

              <Row gutter={16}>
                {/* Category (searchable + add new) */}
                <Col span={12}>
                  <Form.Item
                    label="ប្រភេទផលិតផល - Category"
                    name="categoryId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select Category"
                      options={categoryOptions}
                      filterOption={filterOption}
                      // Add a "Add new" action inside dropdown
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: "8px 0" }} />
                          <div style={{ padding: "0 8px 8px" }}>
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
                              block
                              onClick={() => setCatModalOpen(true)}
                            >
                              បន្ថែមប្រភេទ
                            </Button>
                          </div>
                        </>
                      )}
                    />
                  </Form.Item>
                </Col>

                {/* UOM (searchable + add new) */}
                <Col span={12}>
                  <Form.Item
                    label="រង្វាស់ខ្នាត​ - Unit of Measure"
                    name="uomId"
                  >
                    <Select
                      showSearch
                      placeholder="Select UOM"
                      options={uomOptions}
                      filterOption={filterOption}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: "8px 0" }} />
                          <div style={{ padding: "0 8px 8px" }}>
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
                              block
                              onClick={() => setUomModalOpen(true)}
                            >
                              បន្ថែម UOM
                            </Button>
                          </div>
                        </>
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="ចំនួន - Quantity"
                    name="qty"
                    initialValue={0}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                {/* 💸 Cost field visible only if user has cost permission */}
                {canCost && (
                  <Col span={6}>
                    <Form.Item
                      label="តម្លៃដើម - Cost Price"
                      name="costPrice"
                      initialValue={0}
                    >
                      <InputNumber
                        min={0}
                        step={0.01}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                )}

                {/* If cost hidden, salePrice expands to keep row balance */}
                <Col span={canCost ? 6 : 12}>
                  <Form.Item
                    label="តម្លៃលក់ - Sale Price"
                    name="salePrice"
                    initialValue={0}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="សម្គាល់ - Description" name="description">
                <Input.TextArea rows={3} placeholder="Product Description" />
              </Form.Item>
            </Col>

            {/* RIGHT SIDE: MEDIA */}
            <Col span={8}>
              <Form.Item label="Default Photo" name="defaultPhoto">
                <Upload listType="picture-card" maxCount={1}>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item label="រូបភាពទំនិញ / Public Photo" name="publicPhotos">
                <Upload listType="picture-card" multiple>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 🧩 Category mini modal */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSaved={afterSavedCategory}
        // initialData={...} // when you need editing
      />

      {/* 🧩 UOM mini modal */}
      <UomModal
        open={uomModalOpen}
        onClose={() => setUomModalOpen(false)}
        onSaved={afterSavedUom}
        // initialData={...}
      />
    </>
  );
}
