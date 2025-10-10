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
  CalendarOutlined,
} from "@ant-design/icons";
import {
  getProducts,
  getMaster,
  saveProduct,
  getProductMedia,
  getProductDetail,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePagePerms } from "../context/MenuContext";
import ProductModal from "../components/Ui/ProductModel";
import ProductPhotoModal from "../components/Ui/ProductPhotoModel";
import { notify } from "../services/notify";
import ProductPrintModal from "../components/Ui/ProductPrintModal";

export default function ProductPage() {
  const { currentCompany } = useAuth();
  const perms = usePagePerms("Product");
  const can = (k) => perms?.full || !!perms?.[k];

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [productDetail, setProductDetail] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoProduct, setPhotoProduct] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // pagination and search
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  // trigger data change
  useEffect(() => {
    if (!currentCompany?.id) return;
    if (!can("list")) {
      loadFilters();
      return;
    }
    loadFilters();
    loadData(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany?.id, keyword, currentPage, pageSize, showTodayOnly]);

  // load master filters
  const loadFilters = async () => {
    try {
      const res = await getMaster({ companyId: currentCompany.id });
      setCategories(res?.data?.category || []);
      setUoms(res?.data?.uom || []);
      setBrands(res?.data?.brand || []);
    } catch (e) {
      notify({
        type: "error",
        message: "Failed to load filters products.",
        description: e.message,
      });
    }
  };

  // data from api
  const loadData = async (page = 1, size = 20) => {
    if (!can("list")) return;
    setLoading(true);
    try {
      const res = await getProducts({
        companyId: currentCompany.id,
        page,
        pageSize: size,
      });

      const productList = Array.isArray(res?.data?.product)
        ? res.data.product
        : [];
      const todayList = Array.isArray(res?.data?.today) ? res.data.today : [];
      const total = res?.data?.total?.[0]?.totalCount || 0;

      let rows = showTodayOnly ? [...todayList] : [...productList];
      const count = showTodayOnly ? todayList.length : total;
      setTotalCount(count);

      if (keyword) {
        const kw = keyword.toLowerCase();
        rows = rows.filter(
          (p) =>
            p.name?.toLowerCase().includes(kw) ||
            p.code?.toLowerCase().includes(kw)
        );
      }

      const groups = {};
      rows.forEach((p) => {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      });

      const groupedRows = [];
      Object.entries(groups).forEach(([cat, items]) => {
        groupedRows.push({
          isCategory: true,
          key: `cat-${cat}`,
          category: toTitleCase(cat),
          count: items.length,
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

  const handleOpenModal = async (product, mode = "edit") => {
    if (mode === "edit" && !can("edit")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិកែសម្រួលទេ" });
      return;
    }
    if (mode === "add" && !can("add")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិបន្ថែមទេ" });
      return;
    }
    if (product?.id) {
      try {
        const res = await getProductDetail({ id: product.id });
        if (res.data?.code === 200) {
          setProductDetail(res.data);
        } else {
          notify({ type: "error", message: res.data?.message });
          return;
        }
      } catch (err) {
        notify({ type: "error", message: err.message });
        return;
      }
    } else {
      setProductDetail(null);
    }

    setModalMode(mode);
    setModalOpen(true);
  };

  const handleDuplicate = async (product) => {
    if (!can("add")) {
      notify({ type: "warning", message: "អ្នកមិនមានសិទ្ធិបន្ថែមទេ" });
      return;
    }
    try {
      const res = await getProductDetail({ id: product.id });
      if (res.data?.code === 200) {
        setProductDetail({
          ...res.data,
          product: res.data.product.map((p) => ({ ...p, id: null })),
        });
        setModalMode("add");
        setModalOpen(true);
      }
    } catch (err) {
      notify({ type: "error", message: err.message });
    }
  };

  const handleOpenPhotoModal = async (product) => {
    try {
      const res = await getProductMedia({ id: product.id });
      if (res.data?.code === 200) {
        const media = res.data.media || [];
        const defaultPhoto = media.find((m) => m.isDefault)?.path || null;
        const otherPhotos = media
          .filter((m) => !m.isDefault)
          .map((m) => m.path);

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
      notify({ type: "error", message: err.message });
    }
  };

  const toTitleCase = (str = "") =>
    str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const bilingual = (kh, en) => (
    <div style={{ lineHeight: "16px" }}>
      <div>{kh}</div>
      <div style={{ fontSize: 11, color: "#888" }}>{en}</div>
    </div>
  );

  const columns = useMemo(() => {
    const cols = [
      {
        title: bilingual("រូបភាព", "Image"),
        align: "center",
        width: 80,
        render: (_, record) => {
          if (record.isCategory) {
            return {
              children: (
                <div className="w-full text-left font-semibold text-gray-600 pr-3">
                  📦 {toTitleCase(record.category)} ({record.count} Products)
                </div>
              ),
              props: {
                colSpan: can("add") || can("edit") || can("delete") ? 8 : 7,
                style: { backgroundColor: "#f9fafb" },
              },
            };
          }
          if (record.mediaPath) {
            return (
              <img
                src={record.mediaPath}
                alt="product"
                className="h-12 w-12 object-contain cursor-pointer mx-auto"
                onClick={() => handleOpenPhotoModal(record)}
              />
            );
          }
          return (
            <span
              className={`${
                can("edit")
                  ? "text-yellow-700 cursor-pointer text-xl"
                  : "text-gray-400 text-xl"
              }`}
              onClick={() => handleOpenPhotoModal(record)}
            >
              <PictureOutlined />
            </span>
          );
        },
      },
      {
        title: bilingual("ឈ្មោះទំនិញ", "Product Name"),
        dataIndex: "name",
        render: (val, record) =>
          record.isCategory ? (
            { props: { colSpan: 0 } }
          ) : (
            <span
              className={`${
                can("edit")
                  ? "text-blue-600 hover:underline cursor-pointer"
                  : "text-gray-700"
              } font-light`}
              onClick={() => handleOpenModal(record, "edit")}
            >
              {val}
            </span>
          ),
      },
      {
        title: bilingual("ឯកតា", "UOM"),
        dataIndex: "uom",
        align: "center",
        width: 100,
        render: (val, record) =>
          record.isCategory ? { props: { colSpan: 0 } } : val,
      },
      {
        title: bilingual("ស្តុកសរុប", "Total Stock"),
        dataIndex: "totalStock",
        align: "center",
        width: 100,
        render: (val, record) =>
          record.isCategory ? { props: { colSpan: 0 } } : val ?? 0,
      },
      {
        title: bilingual("តម្លៃលក់រាយ ($)", "Min - Max"),
        dataIndex: "minSalePrice",
        align: "right",
        width: 140,
        render: (val, record) => {
          if (record.isCategory) return { props: { colSpan: 0 } };
          if (record.isVariant)
            return `${(record.minSalePrice || 0).toFixed(2)} - ${(
              record.maxSalePrice || 0
            ).toFixed(2)}`;
          return (record.minSalePrice || 0).toFixed(2);
        },
      },
      {
        title: bilingual("ចំនួនវ៉ារ្យ៉ង់", "Variants"),
        dataIndex: "variantCount",
        align: "center",
        width: 100,
        render: (val, record) =>
          record.isCategory ? { props: { colSpan: 0 } } : val,
      },
    ];

    if (can("add") || can("edit") || can("delete")) {
      cols.push({
        title: bilingual("សកម្មភាព", "Action"),
        align: "center",
        width: 120,
        render: (_, record) =>
          record.isCategory ? (
            { props: { colSpan: 0 } }
          ) : (
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
                  onClick={() => handleOpenModal(record, "edit")}
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
          ),
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms]);

  return (
    <div className="px-2 py-1">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <div className="flex gap-2">
          <Select
            value={pageSize}
            style={{ minWidth: 70 }}
            onChange={(e) => {
              setPageSize(e);
              setCurrentPage(1);
            }}
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

          {/* 🔹 Show Today Products Button */}
          <Button
            type={showTodayOnly ? "primary" : "default"}
            size="middle"
            icon={<CalendarOutlined />}
            onClick={() => {
              setCurrentPage(1);
              setShowTodayOnly(!showTodayOnly);
            }}
          >
            {showTodayOnly ? "បង្ហាញទំនិញទាំងអស់" : "បង្ហាញទំនិញថ្ងៃនេះ"}
          </Button>

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
              onClick={() => handleOpenModal(null, "add")}
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
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: false,
          onChange: (page) => setCurrentPage(page),
        }}
        loading={loading}
        scroll={{ x: "max-content", y: 500 }}
        sticky={{ offsetHeader: 0, offsetSummary: 0 }}
        locale={
          !can("list")
            ? { emptyText: "អ្នកមិនមានសិទ្ធិបង្ហាញទិន្នន័យទេ" }
            : undefined
        }
      />

      {/* Product Modal */}
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => {
          setModalOpen(false);
          loadData(currentPage, pageSize);
        }}
        productDetail={productDetail}
        categories={categories}
        uoms={uoms}
        brands={brands}
        onSave={async (values) => {
          if (!can("add") && !can("edit")) return;
          try {
            const res = await saveProduct(values);
            if (res?.data?.code == "200") {
              notify({
                type: "success",
                message: res?.data?.message || "Product saved.",
              });
              setModalOpen(false);
              loadData(currentPage, pageSize);
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

      {/* Photo Modal */}
      <ProductPhotoModal
        open={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
          loadData(currentPage, pageSize);
        }}
        productId={photoProduct?.id}
        defaultPhoto={photoProduct?.defaultPhoto}
        otherPhotos={photoProduct?.otherPhotos || []}
        onSaved={() => {
          setPhotoModalOpen(false);
          loadData(currentPage, pageSize);
        }}
      />

      {/* Print Modal */}
      <ProductPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}
