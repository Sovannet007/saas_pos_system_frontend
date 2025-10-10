import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Flex,
  Input,
  InputNumber,
  List,
  Modal,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ShoppingCartOutlined,
  SearchOutlined,
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

/* ============================= HELPERS ============================= */
const money = (n) => (Number(n) || 0).toFixed(2);
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

/* ============================= VARIANT MODAL ============================= */
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

/* ============================= PAYMENT MODAL ============================= */
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

/* ============================= PRODUCT GRID ============================= */
function ProductGrid({ products, priceMode, onAddProduct, onOpenVariant }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))", // ✅ 5 per row
        gap: 12,
        padding: 10,
      }}
    >
      {products.map((p) => {
        const showPrice = priceForMode({ product: p, priceMode });
        const hasVariant = !!p.hasVariant;
        return (
          <Card
            key={p.id}
            hoverable
            size="small"
            style={{
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              cursor: "pointer",
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
              <div
                style={{
                  height: 90,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f9f9f9",
                  borderRadius: 8,
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
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 32, color: "#bbb" }}>🛍️</div>
                )}
              </div>
              <Typography.Text strong ellipsis style={{ fontSize: 13 }}>
                {p.name}
                {hasVariant && (
                  <Tag
                    color="blue"
                    style={{ marginLeft: 6, borderRadius: 6, fontSize: 10 }}
                  >
                    Variants
                  </Tag>
                )}
              </Typography.Text>
              <Flex justify="space-between" align="center">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {priceMode === "WHOLESALE" ? "Wholesale" : "Retail"}
                </Typography.Text>
                <Typography.Text strong style={{ color: "#106a2a" }}>
                  ${money(showPrice)}
                </Typography.Text>
              </Flex>
              <Button
                icon={<PlusOutlined />}
                block
                size="small"
                style={{ borderRadius: 6 }}
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

/* ============================= CART PANEL ============================= */
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
    { title: "#", width: 40, render: (_, __, idx) => idx + 1 },
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
          controls={true} // hide the up/down arrows
          inputMode="numeric"
          style={{
            width: 60,
            textAlign: "center",
            border: "none",
            outline: "none",
            background: "transparent",
            boxShadow: "none",
          }}
          onKeyPress={(e) => {
            if (!/[0-9]/.test(e.key)) e.preventDefault(); // allow digits only
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (!/^\d+$/.test(text)) e.preventDefault(); // block non-numeric paste
          }}
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
      width: 40,
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
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: 10,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          msOverflowStyle: "auto",
        }}
      >
        <style>{`
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        `}</style>
        <Table
          dataSource={cart}
          columns={columns}
          rowKey={(r) => `${r.productId}-${r.variantId}`}
          size="small"
          pagination={false}
          bordered
          sticky
        />
      </div>

      <Divider style={{ margin: "8px 0" }} />
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
      <Divider style={{ margin: "8px 0" }} />
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
    </div>
  );
}

/* ============================= MAIN PAGE ============================= */
export default function PosInvoicePage() {
  const { currentCompany } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [priceMode, setPriceMode] = useState("RETAIL");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [payOpen, setPayOpen] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await getPosProductList({
        categoryId: null,
        brandId: null,
        keyword: "",
      });
      if (res?.data?.data) setProducts(res.data.data);
    } catch {
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
    if (!cart.length) return message.warning("Cart is empty.");
    setPayOpen(true);
  };

  const finalizeInvoice = (payments) => {
    console.log("SAVE INVOICE PAYLOAD:", { cart, payments });
    message.success("Invoice saved (see console).");
    setPayOpen(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "#f8f9fa",
        padding: 8,
        overflow: "hidden",
      }}
    >
      {/* 🔹 Header */}
      <Card size="small" bodyStyle={{ padding: 8 }}>
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

      {/* 🔹 Main Content */}
      <Flex style={{ flex: 1, overflow: "hidden", marginTop: 8 }}>
        {/* Products */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "#fff",
              padding: "10px 16px",
              borderBottom: "1px solid #eee",
              fontWeight: 600,
            }}
          >
            <ShoppingCartOutlined /> Products
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            <ProductGrid
              products={filteredProducts}
              priceMode={priceMode}
              onAddProduct={addCartLine}
              onOpenVariant={openVariantFor}
            />
          </div>
        </div>

        {/* Cart */}
        <div
          style={{
            width: 520,
            marginLeft: 8,
            background: "#fff",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "#fff",
              padding: "10px 16px",
              borderBottom: "1px solid #eee",
              fontWeight: 600,
            }}
          >
            Current Sale
          </div>
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
        </div>
      </Flex>

      {/* 🔹 Modals */}
      <VariantSelectModal
        open={variantModalOpen}
        product={variantModalProduct}
        priceMode={priceMode}
        onClose={() => setVariantModalOpen(false)}
        onSelect={addCartLine}
      />
      <PaymentModal
        open={payOpen}
        total={total}
        onCancel={() => setPayOpen(false)}
        onConfirm={finalizeInvoice}
      />
    </div>
  );
}
