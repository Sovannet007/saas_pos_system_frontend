import { useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Input, Select } from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  CopyOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  getProducts,
  getMaster,
  saveProduct,
  getProductMedia,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePagePerms } from "../../context/MenuContext";
import ProductModal from "../../components/Ui/ProductModel";
import ProductPhotoModal from "../../components/Ui/ProductPhotoModel";
import { notify } from "../../services/notify";
import ProductPrintModal from "../../components/Ui/ProductPrintModal";
import { Command } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const normalizePath = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

export default function ProductPage() {
  const { currentCompany } = useAuth();
  const perms = usePagePerms("Product");
  const can = (k) => perms?.full || !!perms?.[k];

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // photo modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoProduct, setPhotoProduct] = useState(null);

  // print modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!currentCompany?.id) return;
    if (!can("list")) {
      loadFilters();
      return;
    }
    loadFilters();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany?.id, keyword]);

  const loadFilters = async () => {
    try {
      const res = await getMaster({
        companyId: currentCompany.id,
      });
      setCategories(res?.data?.category || []);
      setUoms(res?.data?.uom || []);
    } catch (e) {
      notify({
        type: "error",
        message: "Failed to load filters products.",
        description: e.message,
      });
    }
  };

  const loadData = async () => {
    if (!can("list")) return;
    setLoading(true);
    try {
      const res = await getProducts({ companyId: currentCompany.id });
      let rows = Array.isArray(res?.data?.product) ? res.data.product : [];

      if (keyword) {
        const kw = keyword.toLowerCase();
        rows = rows.filter(
          (p) =>
            p.name?.toLowerCase().includes(kw) ||
            p.code?.toLowerCase().includes(kw)
        );
      }

      // 🔹 Group products by category
      const groups = {};
      rows.forEach((p) => {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      });

      // 🔹 Flatten into rows with category header rows
      const groupedRows = [];
      Object.entries(groups).forEach(([cat, items]) => {
        groupedRows.push({
          isCategory: true,
          key: `cat-${cat}`,
          category: toTitleCase(cat), // ✅ format here
          count: items.length, // product count
        });
        items.forEach((p) =>
          groupedRows.push({
            ...p,
            isCategory: false,
            key: `prod-${p.id}`,
          })
        );
      });

      setData(groupedRows);
    } catch (e) {
      notify({
        type: "error",
        message: "Failed to load products.",
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product) => {
    if (product && !can("edit")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិកែសម្រួលទេ" });
      return;
    }
    if (!product && !can("add")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិបន្ថែមទេ" });
      return;
    }
    setSelectedProduct(product || null);
    setModalOpen(true);
  };

  const handleDuplicate = (product) => {
    if (!can("add")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិបន្ថែមទេ" });
      return;
    }
    notify({ type: "info", message: "ការចម្លងទិន្ន័យថ្មី" });
    setSelectedProduct({ ...product, id: null });
    setModalOpen(true);
  };

  const handleOpenPhotoModal = async (product) => {
    try {
      const res = await getProductMedia({ id: product.id });
      if (res.data?.code === 200) {
        const media = res.data.media || [];

        const defaultPhoto = normalizePath(
          media.find((m) => m.isDefault)?.path
        );
        const otherPhotos = media
          .filter((m) => !m.isDefault)
          .map((m) => normalizePath(m.path));

        setPhotoProduct({
          ...product,
          defaultPhoto,
          otherPhotos,
        });
        setPhotoModalOpen(true);
      } else {
        notify({ type: "error", message: res?.data?.message });
      }
    } catch (err) {
      console.error("media error:", err);
      notify({ type: "error", message: err.message });
    }
  };
  const toTitleCase = (str = "") =>
    str
      .trim()
      .toLowerCase()
      .split(/\s+/) // split by one or more spaces
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const columns = useMemo(() => {
    const cols = [
      {
        title: "ល.រ",
        width: 40,
        render: (_, record, idx) => {
          if (record.isCategory) {
            return {
              children: (
                <span className="font-semibold text-gray-600 bg-grre">
                  📦 {toTitleCase(record.category)} ({record.count} Products)
                </span>
              ),
              props: {
                colSpan: cols.length, // 🔹 span across all columns
              },
            };
          }
          return <p className="text-center font-semibold">{idx}</p>;
        },
      },
      {
        title: "លេខកូដ",
        dataIndex: "code",
        width: 100,
        render: (val, record) => {
          if (record.isCategory) {
            return { props: { colSpan: 0 } }; // 🔹 hide under merged row
          }
          return (
            <span
              className={`${
                can("edit")
                  ? "text-blue-600 hover:underline cursor-pointer"
                  : "text-gray-700"
              } font-light`}
              onClick={() => can("edit") && handleOpenModal(record)}
            >
              {val}
            </span>
          );
        },
      },
      {
        title: "រូបភាព",
        align: "center",
        width: 80,
        render: (_, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return (
            <span
              className={`${
                can("edit")
                  ? "text-yellow-700 hover:underline cursor-pointer text-xl"
                  : "text-gray-700 text-xl"
              } font-light`}
              onClick={() => can("edit") && handleOpenPhotoModal(record)}
            >
              <PictureOutlined />
            </span>
          );
        },
      },
      {
        title: "ឈ្មោះ",
        dataIndex: "name",
        render: (val, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return (
            <span
              className={`${
                can("edit")
                  ? "text-blue-600 hover:underline cursor-pointer"
                  : "text-gray-700"
              } font-light`}
              onClick={() => can("edit") && handleOpenModal(record)}
            >
              {val}
            </span>
          );
        },
      },
      {
        title: "ឯកតា",
        dataIndex: "uom",
        align: "center",
        width: 100,
      },
      ...(can("cost")
        ? [
            {
              title: "តម្លៃដើម ($)",
              dataIndex: "costPrice",
              align: "right",
              width: 120,
              render: (v, record) => {
                if (record.isCategory) return { props: { colSpan: 0 } };
                return v ? v.toFixed(2) : "0.00";
              },
            },
          ]
        : []),
      {
        title: "តម្លៃលក់រាយ ($)",
        dataIndex: "salePrice",
        align: "right",
        width: 120,
        render: (v, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return v ? v.toFixed(2) : "0.00";
        },
      },
      {
        title: "តម្លៃលក់ដុំ ($)",
        dataIndex: "wholesalePrice",
        align: "right",
        width: 120,
        render: (v, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return v ? v.toFixed(2) : "0.00";
        },
      },
      {
        title: "ចំនួន",
        dataIndex: "qty",
        align: "center",
        width: 100,
        render: (v, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return v ?? 0;
        },
      },
      {
        title: "សរុប ($)",
        align: "right",
        width: 120,
        render: (_, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return ((record.salePrice || 0) * (record.qty || 0)).toFixed(2);
        },
      },
    ];

    if (can("add") || can("edit") || can("delete")) {
      cols.push({
        title: "Action",
        dataIndex: "id",
        align: "center",
        width: 120,
        render: (_, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          return (
            <Space>
              {can("add") && (
                <Button
                  type="default"
                  style={{
                    color: "#d46b08",
                    borderColor: "#ffa940",
                    backgroundColor: "#fff",
                  }}
                  icon={<CopyOutlined />}
                  size="small"
                  shape="circle"
                  title="Copy"
                  onClick={() => handleDuplicate(record)}
                />
              )}
              {can("edit") && (
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  size="small"
                  shape="circle"
                  title="Edit"
                  style={{ color: "#1890ff", borderColor: "#40a9ff" }}
                  onClick={() => handleOpenModal(record)}
                />
              )}
              {can("delete") && (
                <Button
                  type="default"
                  icon={<DeleteOutlined />}
                  size="small"
                  shape="circle"
                  style={{ color: "#ff4d4f", borderColor: "#ff7875" }}
                  title="Delete"
                  onClick={() => console.log(record)}
                />
              )}
            </Space>
          );
        },
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms]);

  return (
    <div className="px-2 py-1">
      {" "}
      {/* 🔹 tighter page padding */}
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <div className="flex gap-2">
          <Select
            defaultValue={pageSize}
            style={{ minWidth: 70 }}
            onChange={(e) => setPageSize(e)}
            options={[
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 50, label: "50" },
              { value: 100, label: "100" },
            ]}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬ លេខកូដ..."
            allowClear
            size="middle"
            style={{ minWidth: 300, borderRadius: "8px" }}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {can("print") && (
            <Button
              type="default"
              size="middle"
              title="Print"
              shape="circle"
              style={{ color: "#1890ff", borderColor: "#40a9ff" }}
              icon={<PrinterOutlined />}
              onClick={() => setPrintModalOpen(true)}
            />
          )}
        </div>

        <div className="flex gap-2">
          {can("add") && (
            <Button
              type="primary"
              size="middle"
              icon={<PlusOutlined />}
              className="bg-green-500 text-white hover:bg-green-600"
              onClick={() => handleOpenModal(null)}
            >
              បន្ថែម
            </Button>
          )}
        </div>
      </div>
      {/* Table */}
      <Table
        rowClassName={(record) =>
          record.isCategory
            ? "bg-gray-100 text-blue-700 font-semibold text-sm"
            : selectedRowKeys.includes(record.id)
            ? "bg-blue-100"
            : ""
        }
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: (record) => ({
            disabled: record.isCategory,
          }),
        }}
        columns={columns}
        dataSource={Array.isArray(data) ? data : []}
        rowKey="key"
        bordered
        size="small"
        pagination={{ pageSize: pageSize, showSizeChanger: true }}
        loading={loading}
        scroll={{ x: "max-content", y: 500 }} // ✅ keep scroll but hide scrollbar
        sticky={{ offsetHeader: 0, offsetSummary: 0 }}
        summary={(pageData) => {
          let total = 0;
          pageData.forEach((r) => {
            if (!r.isCategory) {
              total += (r.salePrice || 0) * (r.qty || 0);
            }
          });
          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell
                  colSpan={columns.length - 1}
                  className="text-right font-bold"
                >
                  Total
                </Table.Summary.Cell>
                <Table.Summary.Cell className="text-right font-bold">
                  {total.toFixed(2)} $
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
        locale={
          !can("list")
            ? { emptyText: "អ្នកមិនមានសិទ្ធិបង្ហាញទិន្នន័យទេ" }
            : undefined
        }
      />
      {/* Product Modal */}
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={selectedProduct}
        categories={categories}
        uoms={uoms}
        readOnly={!can("edit") && !can("add")}
        onReloadMaster={loadFilters}
        onSave={async (values) => {
          if (!can("add") && !can("edit")) return;
          try {
            const res = await saveProduct(values);
            if (res?.data?.ProductId) {
              notify({
                type: "success",
                message: res?.data?.message || "Product saved.",
              });
              setModalOpen(false);
              loadData();
            } else {
              notify({
                type: "error",
                message: res?.data?.message || "Failed to save product.",
              });
            }
          } catch (err) {
            notify({
              type: "error",
              message: "Error saving product",
              description: err.message,
            });
          }
        }}
      />
      {/* Product Photo Modal */}
      <ProductPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        productId={photoProduct?.id}
        defaultPhoto={photoProduct?.defaultPhoto}
        otherPhotos={photoProduct?.otherPhotos || []}
        onSaved={() => {
          if (photoProduct) handleOpenPhotoModal(photoProduct);
        }}
      />
      {/* Product Print Modal */}
      <ProductPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}
