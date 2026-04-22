import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { formatCurrency } from "@/store/pos";

type SaleItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type Sale = {
  id: string;
  items: SaleItem[];
  total: number;
  customerName?: string;
  notes?: string;
  createdAt: string;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSale = (raw: any): Sale => ({
  id: String(raw.id),
  items: Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        productId: String(item.productId ?? item.product_id ?? ""),
        name: String(item.name ?? ""),
        price: toNumber(item.price),
        quantity: toNumber(item.quantity),
      }))
    : [],
  total: toNumber(raw.total),
  customerName: raw.customerName ?? raw.customer_name ?? "",
  notes: raw.notes ?? "",
  createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
});

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function escapeCsvField(value: string) {
  const text = value ?? "";
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export default function Reports() {
  const today = new Date();
  const weekStart = new Date();
  weekStart.setDate(today.getDate() - 7);

  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("week");
  const [fromDate, setFromDate] = useState(toDateInput(weekStart));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPeriod = (next: "today" | "week" | "month" | "custom") => {
    setPeriod(next);
    if (next === "custom") return;

    const end = new Date();
    const start = new Date();
    if (next === "today") {
      // keep same day
    } else if (next === "week") {
      start.setDate(end.getDate() - 7);
    } else if (next === "month") {
      start.setDate(end.getDate() - 30);
    }

    setFromDate(toDateInput(start));
    setToDate(toDateInput(end));
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        start_date: fromDate,
        end_date: toDate,
      });

      const response = await fetch(`/api/sales/?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load report (${response.status})`);
      }

      const payload = await response.json();
      setSales(Array.isArray(payload) ? payload.map(normalizeSale) : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report.";
      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const numberOfSales = sales.length;
    const averageSale = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

    const productCounts: Record<string, { name: string; qty: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productId || item.name;
        if (!productCounts[key]) {
          productCounts[key] = { name: item.name || "Unnamed", qty: 0 };
        }
        productCounts[key].qty += item.quantity;
      }
    }

    const topProduct = Object.values(productCounts).sort((a, b) => b.qty - a.qty)[0]?.name ?? "—";

    const customers = new Set(
      sales
        .map((sale) => (sale.customerName ?? "").trim().toLowerCase())
        .filter((name) => name.length > 0)
    );

    return {
      totalRevenue,
      numberOfSales,
      averageSale,
      topProduct,
      uniqueCustomers: customers.size,
    };
  }, [sales]);

  const downloadCsv = () => {
    if (sales.length === 0) return;

    const headers = ["sale_id", "created_at", "customer_name", "notes", "item_count", "total", "items"];
    const rows = sales.map((sale) => {
      const itemSummary = sale.items.map((item) => `${item.quantity}x ${item.name}`).join(" | ");
      return [
        sale.id,
        new Date(sale.createdAt).toISOString(),
        sale.customerName ?? "",
        sale.notes ?? "",
        String(sale.items.length),
        String(sale.total),
        itemSummary,
      ].map(escapeCsvField);
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate, review, and export report data by date range.</p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={sales.length === 0}
          className="h-10 px-4 rounded-[10px] border border-border/70 text-sm font-medium flex items-center gap-2 hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={15} /> Download CSV
        </button>
      </div>

      <div className="card-soft p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "This week" },
            { id: "month", label: "This month" },
            { id: "custom", label: "Custom" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => applyPeriod(item.id as "today" | "week" | "month" | "custom")}
              className={`h-9 px-4 rounded-full text-sm font-medium transition ${
                period === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPeriod("custom");
                setFromDate(e.target.value);
              }}
              className="input-pos w-full mt-1"
            />
          </div>
          <div className="text-muted-foreground text-sm md:pb-3">to</div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPeriod("custom");
                setToDate(e.target.value);
              }}
              className="input-pos w-full mt-1"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading || !fromDate || !toDate}
            className="btn-accent h-11 px-5 rounded-[10px] text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Generating
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {error && <div className="rounded-[12px] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <SummaryCard title="Total revenue" value={formatCurrency(summary.totalRevenue)} />
        <SummaryCard title="Number of sales" value={String(summary.numberOfSales)} />
        <SummaryCard title="Average sale value" value={formatCurrency(summary.averageSale)} />
        <SummaryCard title="Top product" value={summary.topProduct} />
        <SummaryCard title="Unique customers" value={String(summary.uniqueCustomers)} />
      </div>

      <div className="card-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2 text-sm font-medium">
          <FileSpreadsheet size={16} className="text-primary" />
          Sales detail for selected period
        </div>

        {sales.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No sales loaded for this range yet. Pick dates and click Generate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{sale.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">{sale.customerName || "—"}</td>
                    <td className="px-4 py-3 text-sm">{sale.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="card-soft p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</div>
      <div className="font-display font-bold text-2xl mt-2">{value}</div>
    </div>
  );
}
