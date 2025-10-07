import { useState, useRef } from "react";
import { Modal, Checkbox, Button, Select, Space, message, Spin } from "antd";
import html2pdf from "html2pdf.js";
import { useReactToPrint } from "react-to-print";
import { printProduct } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ProductPrintModal({ open, onClose, categories }) {
  const [priceTypes, setPriceTypes] = useState([]);
  const [includeImage, setIncludeImage] = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const { currentCompany } = useAuth();

  const printRef = useRef(null);

  // fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await printProduct({
        companyId: currentCompany?.id,
        categoryId,
      });
      if (res.data?.code === 200) {
        setProducts(res.data.products);
      } else {
        message.warning(res.data?.message || "No products found");
      }
    } catch (err) {
      message.error(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  // Save as PDF
  const handleDownload = () => {
    if (products.length === 0) {
      message.warning("No products to print!");
      return;
    }
    const element = printRef.current;
    const opt = {
      margin: 10,
      filename: "products.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  // Print directly
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: A4 portrait; margin: 10mm; }
      body {
        font-family: 'Khmer OS Battambang','Khmer OS Siemreap','Khmer UI', Arial, sans-serif;
        font-size: 12px;
      }
      table { width: 100%; max-width: 190mm; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #333; padding: 4px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
      thead th { background: #e5e5e5; font-weight: bold; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }

      .col-idx { width: 4%; text-align: center; }
      .col-code { width: 10%; }
      .col-img { width: 12%; text-align: center; }
      .col-name { width: auto; }
      .col-cost, .col-wh, .col-sale { width: 8%; text-align: right; }

      .img-box {
        width: 100%;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .img-box img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
      }
    `,
  });

  return (
    <>
      <Modal
        title="🖨️ Print Product Options"
        open={open}
        onCancel={onClose}
        footer={null}
        width={500}
        style={{ top: 40 }}
        destroyOnClose
      >
        <Spin spinning={loading}>
          <div className="space-y-4">
            <Checkbox.Group
              options={[
                { label: "តម្លៃដើម (Cost)", value: "cost" },
                { label: "តម្លៃលក់ដុំ (Wholesale)", value: "wholesale" },
                { label: "តម្លៃលក់រាយ (Sale)", value: "sale" },
              ]}
              value={priceTypes}
              onChange={setPriceTypes}
              className="flex flex-col items-start gap-2"
            />

            <Checkbox
              checked={includeImage}
              onChange={(e) => setIncludeImage(e.target.checked)}
            >
              Include Product Image
            </Checkbox>

            <div className="text-left">
              <label className="block mb-1 text-sm font-medium">
                Filter by Category
              </label>
              <Select
                placeholder="-- All Categories --"
                style={{ width: "100%" }}
                allowClear
                value={categoryId}
                onChange={setCategoryId}
              >
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Button block type="dashed" onClick={fetchProducts}>
              Load Products
            </Button>

            <Space className="flex justify-center">
              <Button
                type="primary"
                disabled={!products.length}
                onClick={handleDownload}
              >
                Save as PDF
              </Button>
              <Button
                type="default"
                disabled={!products.length}
                onClick={handlePrint}
              >
                Start Print
              </Button>
            </Space>
          </div>
        </Spin>
      </Modal>

      {/* PRINT AREA */}
      <div ref={printRef} className="print-area">
        <h2
          style={{
            textAlign: "center",
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          ក្រុមហ៊ុន : {currentCompany?.name || "Company Name"}
        </h2>
        <h3
          style={{
            textAlign: "center",
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          បញ្ជីទំនិញ (Product List)
        </h3>

        <table>
          <thead>
            <tr>
              <th className="col-idx">ល.រ</th>
              <th className="col-code">លេខកូដ</th>
              {includeImage && <th className="col-img">រូបភាព</th>}
              <th className="col-name">ឈ្មោះទំនិញ</th>
              {priceTypes.includes("cost") && (
                <th className="col-cost">តម្លែដើម ($)</th>
              )}
              {priceTypes.includes("wholesale") && (
                <th className="col-wh">តម្លៃលក់ដុំ ($)</th>
              )}
              {priceTypes.includes("sale") && (
                <th className="col-sale">តម្លៃលក់រាយ ($)</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id}>
                <td className="col-idx">{i + 1}</td>
                <td className="col-code">{p.code}</td>

                {includeImage && (
                  <td className="col-img">
                    {p.mediaUrl ? (
                      <div className="img-box">
                        <img src={p.mediaUrl} alt="" />
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                )}

                <td className="col-name">
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>
                    ប្រភេទ: {p.category}
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 11, color: "#777" }}>
                      ពណ៌នា: {p.description}
                    </div>
                  )}
                </td>

                {priceTypes.includes("cost") && (
                  <td className="col-cost">
                    {Number(p.costPrice || 0).toFixed(2)}
                  </td>
                )}
                {priceTypes.includes("wholesale") && (
                  <td className="col-wh">
                    {Number(p.wholesalePrice || 0).toFixed(2)}
                  </td>
                )}
                {priceTypes.includes("sale") && (
                  <td className="col-sale">
                    {Number(p.salePrice || 0).toFixed(2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hide print-area on screen but keep dimensions */}
      <style>{`
        @media screen {
          .print-area {
            visibility: hidden;
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
            width: 210mm;
            max-width: 210mm;
            padding: 10mm;
            box-sizing: border-box;
            background: #fff;
          }
        }
      `}</style>
    </>
  );
}
