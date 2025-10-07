import { useEffect, useMemo, useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Divider,
  Table,
  Space,
  Tabs,
  Checkbox,
  InputNumber,
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
  const [localCats, setLocalCats] = useState(categories);
  const [localUoms, setLocalUoms] = useState(uoms);
  const [localBrands, setLocalBrands] = useState(brands);
  const [hasVariant, setHasVariant] = useState(false);
  const [hasUom, setHasUom] = useState(false);
  const [uomPrices, setUomPrices] = useState([]);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [uomModalOpen, setUomModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => setLocalCats(categories), [categories]);
  useEffect(() => setLocalUoms(uoms), [uoms]);
  useEffect(() => setLocalBrands(brands), [brands]);

  useEffect(() => {
    if (!open) return;
    if (productDetail?.product?.[0]) {
      const p = productDetail.product[0];
      form.setFieldsValue(p);
      setVariants(productDetail.variants || []);
      setMedia(productDetail.media || []);
      setUomPrices(productDetail.uoms || []);
      setHasVariant(p.isVariant || false);
      setHasUom((productDetail.uoms || []).length > 0);
    } else {
      form.resetFields();
      setVariants([]);
      setMedia([]);
      setUomPrices([]);
      setHasVariant(false);
      setHasUom(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const afterSavedCategory = async () => {
    setCatModalOpen(false);
    if (onReloadMaster) await onReloadMaster();
  };
  const afterSavedUom = async () => {
    setUomModalOpen(false);
    if (onReloadMaster) await onReloadMaster();
  };
  const afterSavedBrand = async () => {
    setBrandModalOpen(false);
    if (onReloadMaster) await onReloadMaster();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const descriptionHtml = editorRef.current
        ? editorRef.current.getContent() || ""
        : values.description || "";

      const product = productDetail?.product?.[0];
      const payload = {
        ProductId: product?.id || 0,
        Name: values.name,
        BrandId: values.brandId || 0,
        CategoryId: values.categoryId || 0,
        UomId: values.uomId || 0,
        Code: values.code || "",
        Barcode: values.barcode || "",
        Description: descriptionHtml,
        CostPrice: parseFloat(values.costPrice || 0),
        WholePrice: parseFloat(values.wholePrice || 0),
        SalePrice: parseFloat(values.salePrice || 0),
        HasVariant: hasVariant,
        HasUom: hasUom,
        Variants: hasVariant
          ? variants.map((v) => ({
              VariantId: v.variantId || v.id || 0,
              Name: v.name,
              Sku: v.sku || "",
              Barcode: v.barcode || "",
              CostPrice: parseFloat(v.costPrice || 0),
              WholesalePrice: parseFloat(v.wholesalePrice || 0),
              SalePrice: parseFloat(v.salePrice || 0),
              Qty: parseFloat(v.qty || 0),
              IsDefault: !!v.isDefault,
            }))
          : [],
        Uoms: hasUom
          ? uomPrices.map((u) => ({
              Id: u.id || 0,
              UomId: u.uomId,
              ConversionQty: parseFloat(u.conversionQty || 1),
              SalePrice: parseFloat(u.salePrice || 0),
              WholePrice: parseFloat(u.wholePrice || 0),
              PriceType: u.priceType || "SALE",
            }))
          : [],
      };

      console.log("Payload ready:", payload);
      onSave?.(payload);
    } catch (err) {
      console.error("Validation error:", err);
    }
  };

  const handleAddVariant = () => {
    setSelectedVariant(null);
    setVariantModalOpen(true);
  };
  const handleEditVariant = (record) => {
    setSelectedVariant(record);
    setVariantModalOpen(true);
  };
  const handleSaveVariant = (variant) => {
    if (selectedVariant) {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === selectedVariant.id ? { ...v, ...variant } : v
        )
      );
    } else {
      setVariants((prev) => [
        ...prev,
        { id: Math.floor(Math.random() * 100000), variantId: 0, ...variant },
      ]);
    }
    setVariantModalOpen(false);
  };

  const categoryOptions = useMemo(
    () => localCats.map((c) => ({ value: c.id, label: c.name })),
    [localCats]
  );
  const uomOptions = useMemo(
    () => localUoms.map((u) => ({ value: u.id, label: u.name })),
    [localUoms]
  );
  const brandOptions = useMemo(
    () => localBrands.map((b) => ({ value: b.id, label: b.name })),
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
              onClick={() =>
                setVariants((prev) =>
                  prev.map((v) =>
                    v.id === record.id
                      ? { ...v, barcode: Date.now().toString().slice(-8) }
                      : v
                  )
                )
              }
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

  const uomColumns = [
    {
      title: "ឯកតា",
      dataIndex: "uomId",
      render: (uomId, record, index) => (
        <Select
          style={{ width: "100%" }}
          options={uomOptions}
          value={uomId}
          onChange={(val) =>
            setUomPrices((prev) =>
              prev.map((u, i) => (i === index ? { ...u, uomId: val } : u))
            )
          }
        />
      ),
    },
    {
      title: "បម្លែងចំនួន",
      dataIndex: "conversionQty",
      render: (val, _, index) => (
        <Input
          type="number"
          value={val}
          onChange={(e) =>
            setUomPrices((prev) =>
              prev.map((u, i) =>
                i === index ? { ...u, conversionQty: e.target.value } : u
              )
            )
          }
        />
      ),
    },
    {
      title: "លក់រាយ",
      dataIndex: "salePrice",
      render: (val, _, index) => (
        <InputNumber
          value={val}
          addonAfter="$"
          onChange={(value) =>
            setUomPrices((prev) =>
              prev.map((u, i) => (i === index ? { ...u, salePrice: value } : u))
            )
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "លក់ដុំ",
      dataIndex: "wholePrice",
      render: (val, _, index) => (
        <InputNumber
          value={val}
          addonAfter="$"
          onChange={(value) =>
            setUomPrices((prev) =>
              prev.map((u, i) =>
                i === index ? { ...u, wholePrice: value } : u
              )
            )
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "សកម្មភាព",
      align: "center",
      render: (_, __, index) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() =>
            setUomPrices((prev) => prev.filter((_, i) => i !== index))
          }
        />
      ),
    },
  ];

  const productId = productDetail?.product?.[0]?.id;
  const containerMaxHeight = isFull ? "calc(100vh - 140px)" : "70vh";

  return (
    <>
      <style>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <Modal
        open={open}
        onCancel={onClose}
        closable={false}
        width={isFull ? "100%" : 950}
        style={isFull ? { top: 0, padding: 0 } : {}}
        styles={{ body: { padding: 0 } }}
        centered
        title={
          <div
            className="flex justify-between items-center w-full"
            style={{ paddingRight: 4 }}
          >
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
        <div
          className="modal-body-scroll no-scrollbar"
          style={{
            padding: 16,
            maxHeight: containerMaxHeight,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <Form form={form} layout="vertical" disabled={isView}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ឈ្មោះផលិតផល"
                  name="name"
                  rules={[{ required: true }]}
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
              <Col span={8}>
                <Form.Item label="ម៉ាក" name="brandId">
                  <Input.Group compact>
                    <Select
                      showSearch
                      options={brandOptions}
                      placeholder="ជ្រើសម៉ាក"
                      style={{ width: "calc(100% - 40px)" }}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setBrandModalOpen(true)}
                    />
                  </Input.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="ប្រភេទ" name="categoryId">
                  <Input.Group compact>
                    <Select
                      showSearch
                      options={categoryOptions}
                      placeholder="ជ្រើសប្រភេទ"
                      style={{ width: "calc(100% - 40px)" }}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setCatModalOpen(true)}
                    />
                  </Input.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="ឯកតា" name="uomId">
                  <Input.Group compact>
                    <Select
                      showSearch
                      options={uomOptions}
                      placeholder="ជ្រើសឯកតា"
                      style={{ width: "calc(100% - 40px)" }}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setUomModalOpen(true)}
                    />
                  </Input.Group>
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

            <Row gutter={16}>
              <Col span={24}>
                <Space size="large">
                  <Checkbox
                    checked={hasVariant}
                    onChange={(e) => setHasVariant(e.target.checked)}
                  >
                    មាន Variant
                  </Checkbox>
                  <Checkbox
                    checked={hasUom}
                    onChange={(e) => setHasUom(e.target.checked)}
                  >
                    មានតម្លៃតាមឯកតា (UOM Pricing)
                  </Checkbox>
                </Space>
              </Col>
            </Row>

            <Form.Item label="ពិពណ៌នា​ - Description" name="description">
              <Editor
                onInit={(evt, editor) => (editorRef.current = editor)}
                apiKey="5wiuf8cmrpbj12787t05xsgbl3xho76t6jh7ij2i6kpcsiv5"
                placeholder="ពិពណ៌នា..."
                init={{
                  height: 250,
                  menubar: false,
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                  ],
                  toolbar:
                    "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | removeformat",
                  branding: false,
                }}
                value={form.getFieldValue("description")}
                onEditorChange={(content) =>
                  form.setFieldValue("description", content)
                }
              />
            </Form.Item>
          </Form>

          <Tabs defaultActiveKey="1" className="mt-3">
            {hasVariant && (
              <Tabs.TabPane tab="Variants" key="1">
                <Table
                  dataSource={variants}
                  rowKey="id"
                  size="small"
                  bordered
                  pagination={false}
                  columns={variantColumns}
                  scroll={{ x: true }}
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
            )}

            {hasUom && (
              <Tabs.TabPane tab="UOM Pricing" key="2">
                <Table
                  dataSource={uomPrices}
                  rowKey={(r, i) => i}
                  size="small"
                  bordered
                  pagination={false}
                  columns={uomColumns}
                />
                {(isAdd || isEdit) && (
                  <Button
                    className="mt-2"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      setUomPrices((prev) => [
                        ...prev,
                        {
                          id: Math.random(),
                          uomId: null,
                          conversionQty: 1,
                          salePrice: 0,
                          wholePrice: 0,
                        },
                      ])
                    }
                  >
                    បន្ថែមតម្លៃតាមឯកតា
                  </Button>
                )}
              </Tabs.TabPane>
            )}

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
        </div>
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
