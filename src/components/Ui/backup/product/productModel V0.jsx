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

export default function ProductModal({
  open,
  mode = "view", // "view" | "edit" | "add"
  onClose,
  onSave,
  productDetail, // { product:[], media:[], variants:[] }
  categories = [],
  uoms = [],
  onReloadMaster,
}) {
  const [form] = Form.useForm();
  const perms = usePagePerms("Product");
  const can = (k) => perms?.full || !!perms?.[k];
  const canCost = can("cost");
  const editorRef = useRef(null);

  const [isFull, setIsFull] = useState(false);
  const [variants, setVariants] = useState([]);
  const [media, setMedia] = useState([]);
  const [localCats, setLocalCats] = useState(categories);
  const [localUoms, setLocalUoms] = useState(uoms);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [uomModalOpen, setUomModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => setLocalCats(categories), [categories]);
  useEffect(() => setLocalUoms(uoms), [uoms]);

  useEffect(() => {
    if (productDetail?.product?.[0]) {
      form.setFieldsValue(productDetail.product[0]);
      setVariants(productDetail.variants || []);
      setMedia(productDetail.media || []);
    } else {
      form.resetFields();
      setVariants([]);
      setMedia([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productDetail]);

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  // ✅ Reload after save
  const afterSavedCategory = async () => {
    setCatModalOpen(false);
    if (onReloadMaster) {
      await onReloadMaster();
    }
  };
  const afterSavedUom = async () => {
    setUomModalOpen(false);
    if (onReloadMaster) {
      await onReloadMaster();
    }
  };

  // ✅ Submit product (safe for TinyMCE)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // ✅ Ensure description is plain HTML, not a TinyMCE object
      let descriptionHtml = "";
      if (editorRef.current) {
        descriptionHtml = editorRef.current.getContent() || "";
      } else {
        descriptionHtml = values.description || "";
      }

      const product = productDetail?.product?.[0];
      const payload = {
        ProductId: product?.id || 0,
        Name: values.name,
        CategoryId: values.categoryId || 0,
        UomId: values.uomId || 0,
        Description: descriptionHtml, // ✅ safe string only
        Variants: variants.map((v) => ({
          VariantId: v.variantId || v.id || 0,
          Name: v.name,
          Sku: v.sku || "",
          Barcode: v.barcode || "",
          CostPrice: parseFloat(v.costPrice || 0),
          WholesalePrice: parseFloat(v.wholesalePrice || 0),
          SalePrice: parseFloat(v.salePrice || 0),
          Qty: parseFloat(v.qty || 0),
          IsDefault: !!v.isDefault,
        })),
      };

      // ✅ payload is now safe to stringify or send via API
      console.log("Payload ready:", payload);
      onSave?.(payload);
    } catch (err) {
      console.error("Validation error:", err);
    }
  };

  // ✅ Variants
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

  // ✅ Generate barcode
  const handleGenerateBarcode = (record) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === record.id
          ? { ...v, barcode: Date.now().toString().slice(-8) }
          : v
      )
    );
  };

  // --- UI helpers ---
  const categoryOptions = useMemo(
    () => localCats.map((c) => ({ value: c.id, label: c.name })),
    [localCats]
  );
  const uomOptions = useMemo(
    () => localUoms.map((u) => ({ value: u.id, label: u.name })),
    [localUoms]
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
        width={isFull ? "100%" : 900}
        style={isFull ? { top: 0, padding: 0 } : {}}
        bodyStyle={{ padding: 0 }}
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
                <Form.Item label="ប្រភេទ" name="categoryId">
                  <Select
                    options={categoryOptions}
                    placeholder="ជ្រើសប្រភេទ"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          block
                          onClick={() => setCatModalOpen(true)}
                        >
                          បន្ថែមប្រភេទ
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="ឯកតា" name="uomId">
                  <Select
                    options={uomOptions}
                    placeholder="ជ្រើសឯកតា"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: "8px 0" }} />
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          block
                          onClick={() => setUomModalOpen(true)}
                        >
                          បន្ថែមឯកតា
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* <Row gutter={16}> */}
            <Col span={24}>
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
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "help",
                      "wordcount",
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
            </Col>
          </Form>

          <Tabs defaultActiveKey="1" className="mt-3">
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

            {productId && (
              <Tabs.TabPane tab="Images" key="2">
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

      {/* Mini Modals */}
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
      <VariantModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        onSave={handleSaveVariant}
        initialValues={selectedVariant}
      />
    </>
  );
}
