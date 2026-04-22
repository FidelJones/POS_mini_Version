type PrintSummary = {
  totalRevenue: number;
  numberOfSales: number;
  averageSale: number;
  topProduct: string;
  uniqueCustomers: number;
};

type PrintProductPerformance = {
  name: string;
  quantity: number;
  revenue: number;
  share: number;
};

type PrintSale = {
  id: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  total: number;
  items: { name: string; quantity: number }[];
};

type BuildPrintDocumentArgs = {
  businessName: string;
  fromDate: string;
  toDate: string;
  summary: PrintSummary;
  productPerformance: PrintProductPerformance[];
  sales: PrintSale[];
  generatedAt: string;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildReportPrintHtml({
  businessName,
  fromDate,
  toDate,
  summary,
  productPerformance,
  sales,
  generatedAt,
}: BuildPrintDocumentArgs) {
  const summaryRows = [
    ["Total revenue", formatMoney(summary.totalRevenue)],
    ["Number of sales", String(summary.numberOfSales)],
    ["Average sale value", formatMoney(summary.averageSale)],
    ["Top product", summary.topProduct],
    ["Unique customers", String(summary.uniqueCustomers)],
  ]
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const productRows =
    productPerformance.length === 0
      ? `<tr><td colspan="5" class="empty">No product performance data for this range.</td></tr>`
      : productPerformance
          .map(
            (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(row.name)}</td>
            <td>${row.quantity}</td>
            <td>${escapeHtml(formatMoney(row.revenue))}</td>
            <td>${row.share.toFixed(1)}%</td>
          </tr>
        `
          )
          .join("");

  const saleRows =
    sales.length === 0
      ? `<tr><td colspan="6" class="empty">No sales records for this period.</td></tr>`
      : sales
          .map((sale) => {
            const itemText = sale.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
            return `
              <tr>
                <td>#${escapeHtml(sale.id.slice(0, 8))}</td>
                <td>${escapeHtml(sale.customerName || "-")}</td>
                <td>${escapeHtml(itemText || "-")}</td>
                <td>${escapeHtml(sale.notes || "-")}</td>
                <td>${escapeHtml(new Date(sale.createdAt).toLocaleString())}</td>
                <td>${escapeHtml(formatMoney(sale.total))}</td>
              </tr>
            `;
          })
          .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report ${escapeHtml(fromDate)} to ${escapeHtml(toDate)}</title>
  <style>
    :root {
      --ink: #111827;
      --muted: #6b7280;
      --line: #e5e7eb;
      --accent: #10b981;
      --bg-soft: #f9fafb;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      color: var(--ink);
      background: white;
    }
    .wrap {
      max-width: 1080px;
      margin: 28px auto;
      padding: 0 24px 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 2px solid var(--line);
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .subtitle {
      color: var(--muted);
      margin-top: 4px;
      font-size: 14px;
    }
    .meta {
      text-align: right;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .section {
      margin-top: 20px;
      break-inside: avoid;
    }
    .section h2 {
      font-size: 16px;
      margin: 0 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #374151;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--bg-soft);
      font-weight: 600;
    }
    .summary td {
      font-weight: 700;
    }
    .chip {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      margin-top: 10px;
    }
    .empty {
      text-align: center;
      color: var(--muted);
      font-style: italic;
    }
    .footer {
      margin-top: 16px;
      color: var(--muted);
      font-size: 12px;
      border-top: 1px dashed var(--line);
      padding-top: 10px;
    }

    @media print {
      body {
        margin: 0;
      }
      .wrap {
        margin: 0;
        max-width: none;
        padding: 10mm;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div>
        <h1 class="title">${escapeHtml(businessName)} - Report</h1>
        <div class="subtitle">Period: ${escapeHtml(fromDate)} to ${escapeHtml(toDate)}</div>
      </div>
      <div class="meta">
        Generated: ${escapeHtml(generatedAt)}<br/>
        Sales loaded: ${sales.length}
      </div>
    </div>

    <div class="section">
      <h2>Summary Metrics</h2>
      <table class="summary">
        <tbody>
          ${summaryRows}
        </tbody>
      </table>
      <div class="chip">Printable report document</div>
    </div>

    <div class="section">
      <h2>Product Performance</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Units sold</th>
            <th>Revenue</th>
            <th>% of total revenue</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Itemized Sales</h2>
      <table>
        <thead>
          <tr>
            <th>Sale</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Notes</th>
            <th>Date</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${saleRows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      This report is generated from persisted sales records in Jambo POS.
    </div>
  </div>
</body>
</html>
`;
}
