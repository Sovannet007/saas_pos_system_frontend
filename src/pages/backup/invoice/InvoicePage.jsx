import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
  HistoryOutlined,
  DeleteOutlined,
  PlusOutlined,
  PrinterOutlined,
  HolderOutlined,
  CreditCardOutlined,
  DollarOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { getPosProductList } from "../../services/api";

/* =============================
   Helpers
   ============================= */
function priceForMode({ product, variant, priceMode }) {
  if (variant)
    return priceMode === "WHOLESALE"
      ? variant.wholesalePrice ?? variant.salePrice
      : variant.salePrice;
  if (!product) return 0;
  return priceMode === "WHOLESALE"
    ? product.wholePrice ?? product.salePrice
    : product.salePrice;
}

function money(n) {
  return (Number(n) || 0).toFixed(2);
}

/* =============================
   Variant Select Modal
   ============================= */
function VariantSelectModal({ open, product, priceMode, onClose, onSelect }) {
  if (!product) return null;
  return (
    <Modal
      title={`Select Variant: ${product.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
    >
      <List
        bordered
        dataSource={product.variants || []}
        renderItem={(v, idx) => {
          const p = priceForMode({ product, variant: v, priceMode });
          return (
            <List.Item
              key={v.variantId}
              onClick={() => {
                onSelect({
                  productId: product.id,
                  variantId: v.variantId,
                  displayName: `${product.name} - ${v.name}`,
                  unitPrice: p,
                });
                onClose();
              }}
              style={{ cursor: "pointer", padding: 12 }}
            >
              <Flex
                justify="space-between"
                align="center"
                style={{ width: "100%" }}
              >
                <Typography.Text>
                  {idx + 1}. {v.name}
                </Typography.Text>
                <Typography.Text strong>${money(p)}</Typography.Text>
              </Flex>
            </List.Item>
          );
        }}
      />
    </Modal>
  );
}

/* =============================
   Payment Modal
   ============================= */
function PaymentModal({ open, total, onCancel, onConfirm }) {
  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [qr, setQr] = useState(0);
  const paid = (Number(cash) || 0) + (Number(card) || 0) + (Number(qr) || 0);
  const change = Math.max(0, paid - (Number(total) || 0));

  const handleConfirm = () => {
    onConfirm([
      ...(cash ? [{ method: "CASH", amount: Number(cash) }] : []),
      ...(card ? [{ method: "CARD", amount: Number(card) }] : []),
      ...(qr ? [{ method: "QR", amount: Number(qr) }] : []),
    ]);
  };

  return (
    <Modal
      title="Payment"
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="Confirm"
      width={480}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Flex justify="space-between">
          <Typography.Text>Total</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>
            ${money(total)}
          </Typography.Title>
        </Flex>
        <InputNumber
          addonBefore={<DollarOutlined />}
          value={cash}
          onChange={setCash}
          placeholder="Cash"
          style={{ width: "100%" }}
        />
        <InputNumber
          addonBefore={<CreditCardOutlined />}
          value={card}
          onChange={setCard}
          placeholder="Card"
          style={{ width: "100%" }}
        />
        <InputNumber
          addonBefore={<QrcodeOutlined />}
          value={qr}
          onChange={setQr}
          placeholder="QR / E-Wallet"
          style={{ width: "100%" }}
        />
        <Divider style={{ margin: "8px 0" }} />
        <Flex justify="space-between">
          <Typography.Text>Paid</Typography.Text>
          <Typography.Text strong>${money(paid)}</Typography.Text>
        </Flex>
        <Flex justify="space-between">
          <Typography.Text>Change</Typography.Text>
          <Typography.Text strong>${money(change)}</Typography.Text>
        </Flex>
      </Space>
    </Modal>
  );
}

/* =============================
   Product Grid
   ============================= */
function ProductGrid({ products, priceMode, onAddProduct, onOpenVariant }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {products.map((p) => {
        const showPrice = priceForMode({
          product: p,
          variant: null,
          priceMode,
        });
        const hasVariant = !!p.hasVariant;
        return (
          <Card
            key={p.id}
            hoverable
            size="small"
            style={{
              userSelect: "none",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
              padding: 5,
            }}
            onClick={() => {
              if (hasVariant) onOpenVariant(p);
              else
                onAddProduct({
                  productId: p.id,
                  variantId: 0,
                  displayName: p.name,
                  unitPrice: showPrice,
                });
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {/* 🔹 Image Box */}
              <div
                style={{
                  height: 90, // reduced from 120px
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f9f9f9",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      backgroundColor: "#fff",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 32,
                      color: "#bbb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      width: "100%",
                    }}
                  >
                    🛍️
                  </div>
                )}
              </div>

              {/* 🔹 Name */}
              <Typography.Text
                strong
                ellipsis
                style={{
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {p.name}
                {hasVariant && (
                  <Tag
                    color="blue"
                    style={{
                      marginLeft: 6,
                      borderRadius: 6,
                      fontSize: 10,
                      lineHeight: "12px",
                    }}
                  >
                    Variants
                  </Tag>
                )}
              </Typography.Text>

              {/* 🔹 Price Row */}
              <Flex justify="space-between" align="center">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {priceMode === "WHOLESALE" ? "Wholesale" : "Retail"}
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{ color: "#106a2a", fontSize: 13 }}
                >
                  ${money(showPrice)}
                </Typography.Text>
              </Flex>

              {/* 🔹 Add Button */}
              <Button
                icon={<PlusOutlined />}
                block
                size="small"
                style={{
                  marginTop: 4,
                  borderRadius: 6,
                  fontWeight: 500,
                }}
                type={hasVariant ? "default" : "primary"}
              >
                {hasVariant ? "Select Variant" : "Add"}
              </Button>
            </Space>
          </Card>
        );
      })}
    </div>
  );
}

/* =============================
   Cart Panel
   ============================= */
function CartPanel({
  cart,
  onQtyChange,
  onRemove,
  discount,
  setDiscount,
  subtotal,
  total,
  onPay,
  onHold,
  onSavePrint,
  onNew,
}) {
  const columns = [
    { title: "#", width: 48, render: (_, __, idx) => idx + 1 },
    { title: "Product", dataIndex: "displayName" },
    {
      title: "Qty",
      dataIndex: "qty",
      width: 80,
      align: "center",
      render: (v, r) => (
        <InputNumber
          min={1}
          value={v}
          onChange={(val) => onQtyChange(r, Number(val || 1))}
          size="small"
        />
      ),
    },
    {
      title: "Price",
      dataIndex: "unitPrice",
      align: "right",
      width: 90,
      render: money,
    },
    {
      title: "Total",
      dataIndex: "lineTotal",
      align: "right",
      width: 90,
      render: money,
    },
    {
      title: "",
      width: 50,
      align: "center",
      render: (_, r) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="small"
          onClick={() => onRemove(r)}
        />
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <Space>
          <ShoppingCartOutlined /> Current Sale
        </Space>
      }
      styles={{ body: { padding: 8 } }}
    >
      <Table
        dataSource={cart}
        columns={columns}
        rowKey={(r) => `${r.productId}-${r.variantId}`}
        size="small"
        pagination={false}
        scroll={{ y: 380 }}
      />
      <Divider />
      <Flex vertical gap={6}>
        <Flex justify="space-between">
          <Typography.Text>Subtotal</Typography.Text>
          <Typography.Text>${money(subtotal)}</Typography.Text>
        </Flex>
        <Flex justify="space-between" align="center" gap={8}>
          <Typography.Text>Discount</Typography.Text>
          <InputNumber
            value={discount}
            onChange={(v) => setDiscount(Number(v || 0))}
          />
        </Flex>
        <Divider style={{ margin: "8px 0" }} />
        <Flex justify="space-between" align="center">
          <Typography.Title level={4} style={{ margin: 0, color: "#106a2a" }}>
            Total
          </Typography.Title>
          <Typography.Title level={4} style={{ margin: 0, color: "#106a2a" }}>
            ${money(total)}
          </Typography.Title>
        </Flex>
      </Flex>
      <Divider />
      <Flex gap={8} wrap>
        <Button icon={<DollarOutlined />} type="primary" onClick={onPay}>
          Cash / Card / QR
        </Button>
        <Button icon={<HolderOutlined />} onClick={onHold}>
          Hold
        </Button>
        <Button icon={<PrinterOutlined />} onClick={onSavePrint}>
          Save & Print
        </Button>
        <Button onClick={onNew}>New Sale</Button>
      </Flex>
    </Card>
  );
}

/* =============================
   MAIN PAGE
   ============================= */
export default function PosInvoicePage() {
  const { currentCompany } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [priceMode, setPriceMode] = useState("RETAIL");
  const [customer] = useState({
    value: 0,
    label: "Walk-in",
    priceType: "RETAIL",
  });

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [payOpen, setPayOpen] = useState(false);

  const effectivePriceMode = priceMode;

  // ✅ Load from real API
  const loadProducts = async () => {
    try {
      const res = await getPosProductList({
        categoryId: null,
        brandId: null,
        keyword: "",
      });
      if (res?.data?.data) setProducts(res.data.data);
      else setProducts([]);
    } catch (err) {
      console.error(err);
      message.error("Failed to load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const k = search.toLowerCase().trim();
    if (!k) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(k) || String(p.id).includes(k)
    );
  }, [search, products]);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const openVariantFor = (p) => {
    setVariantModalProduct(p);
    setVariantModalOpen(true);
  };

  const addCartLine = ({ productId, variantId, displayName, unitPrice }) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (x) => x.productId === productId && x.variantId === variantId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + 1,
          lineTotal: (next[idx].qty + 1) * next[idx].unitPrice,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId,
          variantId,
          displayName,
          unitPrice,
          qty: 1,
          lineTotal: unitPrice,
        },
      ];
    });
  };

  const onQtyChange = (row, qty) =>
    setCart((prev) =>
      prev.map((x) =>
        x.productId === row.productId && x.variantId === row.variantId
          ? { ...x, qty, lineTotal: qty * x.unitPrice }
          : x
      )
    );

  const onRemove = (row) =>
    setCart((prev) =>
      prev.filter(
        (x) => !(x.productId === row.productId && x.variantId === row.variantId)
      )
    );

  const onPay = () => {
    if (cart.length === 0) return message.warning("Cart is empty.");
    setPayOpen(true);
  };

  const finalizeInvoice = (payments) => {
    console.log("SAVE INVOICE PAYLOAD:", { cart, payments });
    message.success("Invoice saved (see console).");
    setPayOpen(false);
  };

  return (
    <Flex vertical gap={12} style={{ height: "100%", padding: 12 }}>
      <Card size="small" styles={{ body: { padding: 8 } }}>
        <Flex align="center" gap={12} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 360 }}
          />
          <Flex align="center" gap={8}>
            <Typography.Text>Mode:</Typography.Text>
            <Segmented
              options={[
                { label: "Retail", value: "RETAIL" },
                { label: "Wholesale", value: "WHOLESALE" },
              ]}
              value={priceMode}
              onChange={setPriceMode}
            />
          </Flex>
        </Flex>
      </Card>

      <Row gutter={12} style={{ height: "calc(100vh - 180px)" }}>
        <Col span={14} style={{ height: "100%", overflow: "hidden" }}>
          <Card
            size="small"
            title="Products"
            styles={{
              body: { padding: 12, height: "100%", overflowY: "auto" },
            }}
          >
            <ProductGrid
              products={filteredProducts}
              priceMode={effectivePriceMode}
              onAddProduct={addCartLine}
              onOpenVariant={openVariantFor}
            />
          </Card>
        </Col>

        <Col span={10} style={{ height: "100%", overflow: "hidden" }}>
          <CartPanel
            cart={cart}
            onQtyChange={onQtyChange}
            onRemove={onRemove}
            discount={discount}
            setDiscount={setDiscount}
            subtotal={subtotal}
            total={total}
            onPay={onPay}
            onHold={() => message.info("Invoice held")}
            onSavePrint={() => message.info("Save & Print")}
            onNew={() => {
              setCart([]);
              setDiscount(0);
            }}
          />
        </Col>
      </Row>

      <VariantSelectModal
        open={variantModalOpen}
        product={variantModalProduct}
        priceMode={effectivePriceMode}
        onClose={() => setVariantModalOpen(false)}
        onSelect={addCartLine}
      />

      <PaymentModal
        open={payOpen}
        total={total}
        onCancel={() => setPayOpen(false)}
        onConfirm={finalizeInvoice}
      />
    </Flex>
  );
}
