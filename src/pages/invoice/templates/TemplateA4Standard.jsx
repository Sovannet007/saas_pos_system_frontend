export default function TemplateA4Standard({ invoice }) {
  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>Invoice - A4 Standard</h2>
      <p>
        <b>Invoice No:</b> {invoice.invoiceNo}
      </p>
      <p>
        <b>Date:</b> {invoice.date}
      </p>
      <p>
        <b>Customer:</b> {invoice.customer}
      </p>
      <p>
        <b>Total:</b> ${invoice.total.toFixed(2)}
      </p>
      <hr />
      <p style={{ textAlign: "center" }}>Thank you for your purchase!</p>
    </div>
  );
}
