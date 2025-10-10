import { useEffect, useMemo, useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Tabs,
  Checkbox,
  InputNumber,
  Table,
} from "antd";
import {
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import { usePagePerms } from "../../context/MenuContext";
import VariantModal from "../modal/VariantModal";
import CategoryModal from "./CategoryModel";
import UomModal from "./UomModel";
import BrandModal from "./BrandModel";

export default function ProductModal({
  open,
  mode = "view",
  onClose,
  onSave,
  productDetail,
  categories = [],
  uoms = [],
  brands = [],
  onReloadMaster,
}) {
  const [form] = Form.useForm();
  const perms = usePagePerms("Product");
  const can = (k) => perms?.full || !!perms?.[k];
  const canCost = can("cost");
  const editorRef = useRef(null);

  const [isFull, setIsFull] = useState(true);
  const [variants, setVariants] = useState([]);
  const [media, setMedia] = useState([]);
  const [localCats, setLocalCats] = useState([]);
  const [localUoms, setLocalUoms] = useState([]);
  const [localBrands, setLocalBrands] = useState([]);
  const [hasVariant, setHasVariant] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [uomModalOpen, setUomModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // ✅ Sync master lists safely
  useEffect(() => {
    setLocalCats(Array.isArray(categories) ? categories : []);
    setLocalUoms(Array.isArray(uoms) ? uoms : []);
    setLocalBrands(Array.isArray(brands) ? brands : []);
  }, [categories, uoms, brands]);

  // ✅ Rehydrate form when modal opens
  useEffect(() => {
    if (!open) return;

    const p = productDetail?.product?.[0];
    if (p) {
      form.setFieldsValue({
        name: p.name,
        code: p.code,
        brandId: p.brandId,
        uomId: p.uomId,
        costPrice: p.costPrice,
        wholePrice: p.wholePrice,
        salePrice: p.salePrice,
        description: p.description,
        categories: productDetail?.category?.map((c) => String(c.id)) || [],
      });

      setVariants(productDetail?.variants || []);
      setMedia(productDetail?.media || []);
      setHasVariant(!!p.isVariant);
    } else {
      form.resetFields();
      form.setFieldValue("categories", []);
      setVariants([]);
      setMedia([]);
      setHasVariant(false);
    }
  }, [open, productDetail?.product?.[0]?.id]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  // ✅ Reload master data
  const reloadMasters = async () => {
    if (!onReloadMaster) return {};
    try {
      const updated = await onReloadMaster();
      if (updated?.categories) setLocalCats([...updated.categories]);
      if (updated?.uoms) setLocalUoms([...updated.uoms]);
      if (updated?.brands) setLocalBrands([...updated.brands]);
      return updated;
    } catch (e) {
      console.error("Failed reload masters:", e);
      return {};
    }
  };

  const afterSavedCategory = async () => {
    const updated = await reloadMasters();
    if (updated?.categories) setLocalCats([...updated.categories]);
    const current = form.getFieldValue("categories") || [];
    form.setFieldValue("categories", current);
    setCatModalOpen(false);
  };
  const afterSavedUom = async () => {
    await reloadMasters();
    setUomModalOpen(false);
  };
  const afterSavedBrand = async () => {
    await reloadMasters();
    setBrandModalOpen(false);
  };

  // ✅ Submit to parent (safe)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const descriptionHtml =
        typeof editorRef.current?.getContent === "function"
          ? editorRef.current.getContent()
          : values.description || "";

      const product = productDetail?.product?.[0];
      const payload = {
        ProductId: product?.id || 0,
        Name: values.name,
        BrandId: values.brandId || 0,
        UomId: values.uomId || 0,
        Categories: Array.isArray(values.categories)
          ? values.categories.map((x) => Number(x))
          : [],
        Code: values.code || "",
        Description: descriptionHtml,
        CostPrice: parseFloat(values.costPrice || 0),
        WholePrice: parseFloat(values.wholePrice || 0),
        RetailPrice: parseFloat(values.salePrice || 0),
        HasVariant: hasVariant,
        Variants: hasVariant
          ? variants.map((v) => ({
              VariantId: v.variantId || 0,
              Name: v.name,
              Sku: v.sku || "",
              Barcode: v.barcode || "",
              CostPrice: parseFloat(v.costPrice || 0),
              WholePrice: parseFloat(v.wholesalePrice || 0),
              RetailPrice: parseFloat(v.salePrice || 0),
              Qty: parseFloat(v.qty || 0),
              IsDefault: !!v.isDefault,
            }))
          : [],
      };

      console.log("✅ Save Payload:", {
        ...payload,
        Description: "[HTML omitted]",
      });
      onSave?.(payload);
    } catch (err) {
      console.error("❌ Validation error:", err);
    }
  };

  // ✅ Variant handling
  const handleAddVariant = () => {
    setSelectedVariant(null);
    setVariantModalOpen(true);
  };
  const handleEditVariant = (r) => {
    setSelectedVariant(r);
    setVariantModalOpen(true);
  };

  // ✅ Always new variantId = 0
  const handleSaveVariant = (v) => {
    if (selectedVariant) {
      setVariants((prev) =>
        prev.map((x) => (x.id === selectedVariant.id ? { ...x, ...v } : x))
      );
    } else {
      const tempId = `tmp-${Date.now()}`;
      setVariants((prev) => [...prev, { id: tempId, variantId: 0, ...v }]);
    }
    setVariantModalOpen(false);
  };

  const handleGenerateBarcode = (r) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === r.id ? { ...v, barcode: Date.now().toString().slice(-8) } : v
      )
    );
  };

  const categoryOptions = useMemo(
    () => localCats.map((c) => ({ label: c.name, value: String(c.id) })),
    [localCats]
  );
  const uomOptions = useMemo(
    () => localUoms.map((u) => ({ label: u.name, value: u.id })),
    [localUoms]
  );
  const brandOptions = useMemo(
    () => localBrands.map((b) => ({ label: b.name, value: b.id })),
    [localBrands]
  );

  const variantColumns = [
    { title: "ឈ្មោះ Variant", dataIndex: "name" },
    {
      title: "Barcode",
      dataIndex: "barcode",
      render: (val, record) => (
        <Space>
          <span>{val || "-"}</span>
          {(isAdd || isEdit) && (
            <Button
              size="small"
              icon={<BarcodeOutlined />}
              onClick={() => handleGenerateBarcode(record)}
            />
          )}
        </Space>
      ),
    },
    canCost && {
      title: "តម្លៃដើម",
      dataIndex: "costPrice",
      align: "right",
      render: (v) => (v || 0).toFixed(2),
    },
    {
      title: "លក់ដុំ",
      dataIndex: "wholesalePrice",
      align: "right",
      render: (v) => (v || 0).toFixed(2),
    },
    {
      title: "លក់រាយ",
      dataIndex: "salePrice",
      align: "right",
      render: (v) => (v || 0).toFixed(2),
    },
    { title: "ចំនួន", dataIndex: "qty", align: "center" },
    (isEdit || isAdd) && {
      title: "សកម្មភាព",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditVariant(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() =>
              setVariants((prev) => prev.filter((v) => v.id !== record.id))
            }
          />
        </Space>
      ),
    },
  ].filter(Boolean);

  const productId = productDetail?.product?.[0]?.id;
  const containerMaxHeight = isFull ? "calc(100vh - 160px)" : "70vh";

  return (
    <>
      <style>{`
        .product-modal .ant-modal-body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .product-modal .ant-modal-body::-webkit-scrollbar {
          display: none;
        }
        .product-modal .ant-modal-content {
          display: flex;
          flex-direction: column;
          max-height: 100vh;
        }
        .product-modal .ant-modal-body {
          flex: 1 1 auto;
        }
      `}</style>

      <Modal
        open={open}
        onCancel={onClose}
        closable={false}
        width={isFull ? "100%" : 950}
        centered
        rootClassName="product-modal"
        style={{ top: isFull ? 8 : undefined }}
        bodyStyle={{
          padding: 16,
          maxHeight: containerMaxHeight,
          overflowY: "auto",
        }}
        title={
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold text-lg">
              {isAdd
                ? "បញ្ចូលទំនិញថ្មី"
                : isEdit
                ? "កែប្រែទំនិញ"
                : "មើលព័ត៌មានទំនិញ"}
            </span>
            <div className="flex gap-2">
              <Button
                type="text"
                icon={isFull ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setIsFull(!isFull)}
              />
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            </div>
          </div>
        }
        footer={[
          <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
            បិទ
          </Button>,
          !isView && (
            <Button
              key="save"
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
            >
              {isAdd ? "រក្សាទុក" : "កែប្រែ"}
            </Button>
          ),
        ]}
      >
        {/* ✅ Product Info */}
        <Form form={form} layout="vertical" disabled={isView}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ឈ្មោះផលិតផល"
                name="name"
                rules={[{ required: true, message: "សូមបញ្ចូលឈ្មោះផលិតផល" }]}
              >
                <Input placeholder="Enter Product Name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="កូដផលិតផល" name="code">
                <Input placeholder="Product Code" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Brand */}
            <Col span={8}>
              <Form.Item label="ម៉ាក" required style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Form.Item name="brandId" noStyle>
                    <Select
                      allowClear
                      showSearch
                      placeholder="ជ្រើសម៉ាក"
                      options={brandOptions}
                      style={{ flex: 1 }}
                      optionFilterProp="label"
                      onDropdownVisibleChange={(o) => o && reloadMasters()}
                    />
                  </Form.Item>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setBrandModalOpen(true)}
                  />
                </Space.Compact>
              </Form.Item>
            </Col>

            {/* Categories */}
            <Col span={8}>
              <Form.Item label="ប្រភេទ" required style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Form.Item
                    name="categories"
                    noStyle
                    rules={[{ required: true, message: "សូមជ្រើសប្រភេទ" }]}
                  >
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      maxTagCount="responsive"
                      style={{ width: "100%" }}
                      placeholder="ជ្រើសប្រភេទ"
                      options={categoryOptions}
                      optionFilterProp="label"
                      onDropdownVisibleChange={(o) => o && reloadMasters()}
                    />
                  </Form.Item>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setCatModalOpen(true)}
                  />
                </Space.Compact>
              </Form.Item>
            </Col>

            {/* UOM */}
            <Col span={8}>
              <Form.Item label="ឯកតា" required style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: "100%" }}>
                  <Form.Item name="uomId" noStyle>
                    <Select
                      allowClear
                      showSearch
                      placeholder="ជ្រើសឯកតា"
                      options={uomOptions}
                      style={{ flex: 1 }}
                      optionFilterProp="label"
                      onDropdownVisibleChange={(o) => o && reloadMasters()}
                    />
                  </Form.Item>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setUomModalOpen(true)}
                  />
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="តម្លៃដើម" name="costPrice">
                <InputNumber
                  addonAfter="$"
                  style={{ width: "100%" }}
                  disabled={hasVariant}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="លក់ដុំ" name="wholePrice">
                <InputNumber
                  addonAfter="$"
                  style={{ width: "100%" }}
                  disabled={hasVariant}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="លក់រាយ" name="salePrice">
                <InputNumber
                  addonAfter="$"
                  style={{ width: "100%" }}
                  disabled={hasVariant}
                />
              </Form.Item>
            </Col>
          </Row>

          <Checkbox
            checked={hasVariant}
            onChange={(e) => setHasVariant(e.target.checked)}
          >
            មាន Variant
          </Checkbox>

          <Form.Item label="ពិពណ៌នា​ - Description" name="description">
            {open && (
              <Editor
                onInit={(evt, editor) => (editorRef.current = editor)}
                apiKey="5wiuf8cmrpbj12787t05xsgbl3xho76t6jh7ij2i6kpcsiv5"
                initialValue={form.getFieldValue("description") || ""}
                init={{
                  height: 250,
                  menubar: false,
                  plugins: ["advlist", "autolink", "lists", "link", "image"],
                  toolbar:
                    "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | removeformat",
                  branding: false,
                }}
              />
            )}
          </Form.Item>
        </Form>

        {/* ✅ Variants + Images */}
        {hasVariant && (
          <Tabs defaultActiveKey="1" className="mt-3">
            <Tabs.TabPane tab="Variants" key="1">
              <Table
                dataSource={variants}
                rowKey="id"
                size="small"
                bordered
                pagination={false}
                columns={variantColumns}
              />
              {(isAdd || isEdit) && (
                <Button
                  className="mt-2"
                  icon={<PlusOutlined />}
                  onClick={handleAddVariant}
                >
                  បន្ថែម Variant
                </Button>
              )}
            </Tabs.TabPane>

            {productId && (
              <Tabs.TabPane tab="Images" key="3">
                <div className="flex flex-wrap gap-3">
                  {media.length > 0 ? (
                    media.map((m) => (
                      <div
                        key={m.id}
                        className="w-28 h-28 border rounded flex items-center justify-center bg-gray-50"
                      >
                        <img
                          src={m.path}
                          alt="product"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 flex items-center gap-2">
                      <PictureOutlined /> មិនមានរូបភាព
                    </div>
                  )}
                </div>
              </Tabs.TabPane>
            )}
          </Tabs>
        )}
      </Modal>

      {/* Sub Modals */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        onSaved={afterSavedCategory}
      />
      <UomModal
        open={uomModalOpen}
        onClose={() => setUomModalOpen(false)}
        onSaved={afterSavedUom}
      />
      <BrandModal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSaved={afterSavedBrand}
      />
      <VariantModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        onSave={handleSaveVariant}
        initialValues={selectedVariant}
      />
    </>
  );
}
