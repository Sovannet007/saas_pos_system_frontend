export default function TemplateSmallPaper({ invoice }) {
  return (
    <div
      style={{
        width: "80mm",
        padding: "8px",
        fontFamily: "monospace",
        fontSize: 12,
      }}
    >
      <h3 style={{ textAlign: "center" }}>☕ Coffee Shop Invoice</h3>
      <p>Invoice: {invoice.invoiceNo}</p>
      <p>Date: {invoice.date}</p>
      <p>Customer: {invoice.customer}</p>
      <hr />
      <p>Total: ${invoice.total.toFixed(2)}</p>
      <p style={{ textAlign: "center" }}>Thank You!</p>
    </div>
  );
}
