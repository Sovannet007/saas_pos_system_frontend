import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Space, Input, message } from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  CopyOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getProducts, getMaster } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePagePerms } from "../context/MenuContext";
import ProductModal from "../components/Ui/ProductModel";
import { notify } from "../services/notify";

export default function ProductPage() {
  const { currentCompany } = useAuth();

  // 🔐 permissions for this page (module name must match backend "module_name")
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
      const res = await getMaster({ companyId: currentCompany.id });
      setCategories(res?.data?.category || []);
      setUoms(res?.data?.uom || []);
    } catch (e) {
      // ✅ success toast
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
      setData(rows);
    } catch (e) {
      console.error("[ProductPage] loadData error:", e);
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product) => {
    if (product && !can("edit")) {
      message.warning("អ្នកមិនមានសិទ្ធិកែប្រែទេ");
      return;
    }
    if (!product && !can("add")) {
      message.warning("អ្នកមិនមានសិទ្ធិបន្ថែមទេ");
      return;
    }
    setSelectedProduct(product || null);
    setModalOpen(true);
  };

  const handleDuplicate = (product) => {
    if (!can("add")) {
      message.warning("អ្នកមិនមានសិទ្ធិបន្ថែមទេ");
      return;
    }
    message.success(`Duplicated product #${product.id}`);
    setSelectedProduct({ ...product, id: null });
    setModalOpen(true);
  };

  const columns = useMemo(() => {
    const cols = [
      // {
      //   title: <input type="checkbox" />,
      //   dataIndex: "id",
      //   render: (id) => <input type="checkbox" value={id} />,
      //   width: 50,
      // },
      {
        title: "ល.រ",
        render: (_, __, idx) => <p>00{idx + 1}</p>,
        width: 80,
      },
      {
        title: "លេខកូដ",
        dataIndex: "code",
        render: (val, record) => (
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
        ),
      },
      {
        title: "ឈ្មោះ",
        dataIndex: "name",
        render: (val, record) => (
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
        ),
      },
      { title: "ប្រភេទ", dataIndex: "category" },
      ...(can("cost")
        ? [
            {
              title: "តម្លៃដើម",
              dataIndex: "costPrice",
              align: "right",
              render: (v) => (v ? v.toFixed(2) : "0.00"),
            },
          ]
        : []),
      {
        title: "តម្លៃលក់",
        dataIndex: "salePrice",
        align: "right",
        render: (v) => (v ? v.toFixed(2) : "0.00"),
      },
      {
        title: "ចំនួន",
        dataIndex: "qty",
        align: "center",
        render: (v) => v ?? 0,
      },
      {
        title: "សរុប",
        align: "right",
        render: (_, r) => ((r.salePrice || 0) * (r.qty || 0)).toFixed(2),
      },
    ];

    if (can("add") || can("edit") || can("delete")) {
      cols.push({
        title: "Action",
        dataIndex: "id",
        render: (_, record) => (
          <Space>
            {can("add") && (
              <Button
                type="default"
                style={{ color: "#d46b08", borderColor: "#ffa940" }}
                icon={<CopyOutlined />}
                size="small"
                onClick={() => handleDuplicate(record)}
              >
                Duplicate
              </Button>
            )}
          </Space>
        ),
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms]);

  return (
    <div className="p-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex gap-2">
          <Input
            prefix={<SearchOutlined />}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬ លេខកូដ..."
            allowClear
            size="middle"
            style={{ minWidth: 300, borderRadius: "8px" }}
            onChange={(e) => setKeyword(e.target.value)}
          />
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
              Add Product
            </Button>
          )}
          {can("print") && (
            <Button
              type="default"
              size="middle"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table
        rowClassName={(record) =>
          selectedRowKeys.includes(record.id) ? "bg-blue-500" : ""
        }
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={Array.isArray(data) ? data : []}
        rowKey="id"
        bordered
        size="small"
        pagination={{ pageSize: 20 }}
        loading={loading}
        summary={(pageData) => {
          let total = 0;
          pageData.forEach((r) => {
            total += (r.salePrice || 0) * (r.qty || 0);
          });

          const span = Math.max(1, (columns?.length || 1) - 2);
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell
                colSpan={span}
                className="text-right font-bold"
              >
                Total
              </Table.Summary.Cell>
              <Table.Summary.Cell className="text-right font-bold">
                {total.toFixed(2)}
              </Table.Summary.Cell>
              <Table.Summary.Cell />
            </Table.Summary.Row>
          );
        }}
        locale={
          !can("list")
            ? {
                emptyText: "អ្នកមិនមានសិទ្ធិបង្ហាញទិន្នន័យទេ",
              }
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
        onReloadMaster={loadFilters} // parent should update categories/uoms
        onSave={(values) => {
          if (!can("add") && !can("edit")) {
            message.warning(values);
            return;
          }
          message.success("Saved successfully!");
          setModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
