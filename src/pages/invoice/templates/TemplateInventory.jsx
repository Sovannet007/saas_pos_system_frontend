export default function TemplateInventory({ invoice }) {
  return (
    <div style={{ padding: 20, fontFamily: "Segoe UI" }}>
      <h2>📦 Inventory Invoice</h2>
      <p>
        <b>Invoice:</b> {invoice.invoiceNo}
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
      <div style={{ marginTop: 30 }}>
        <table
          width="100%"
          border="1"
          cellPadding="6"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Example Item</td>
              <td>2</td>
              <td>$10</td>
              <td>$20</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
