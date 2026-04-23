import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { formatCurrency } from "@/store/pos";
import { requestJson } from "@/store/pos";

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

type HeatmapHour = {
  hour: number;
  sale_count: number;
  revenue: number;
};

type HeatmapPeriod = {
  startHour: number;
  endHour: number;
  label: string;
  sale_count: number;
  revenue: number;
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

const formatHourLabel = (hour: number) => {
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}${suffix}`;
};

const buildPeriodLabel = (startHour: number, endHour: number) => `${formatHourLabel(startHour)}-${formatHourLabel(endHour)}`;

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
  const [heatmapDate, setHeatmapDate] = useState(toDateInput(today));
  const [heatmap, setHeatmap] = useState<HeatmapHour[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadHeatmap(toDateInput(today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const payload = await requestJson<any[]>(`/sales/?${query.toString()}`);
      setSales(Array.isArray(payload) ? payload.map(normalizeSale) : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report.";
      setError(message);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHeatmap = async (date: string) => {
    setHeatmapLoading(true);
    setHeatmapError(null);
    try {
      const payload = await requestJson<{ date?: string; hours?: any[] }>(
        `/reports/heatmap/?date=${encodeURIComponent(date)}`
      );
      const next = Array.isArray(payload?.hours)
        ? payload.hours.map((row: any) => ({
            hour: toNumber(row.hour),
            sale_count: toNumber(row.sale_count),
            revenue: toNumber(row.revenue),
          }))
        : [];

      setHeatmap(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load heatmap archive.";
      setHeatmapError(message);
      setHeatmap([]);
    } finally {
      setHeatmapLoading(false);
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

  const productPerformance = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productId || item.name;
        if (!map[key]) {
          map[key] = { name: item.name || "Unnamed", quantity: 0, revenue: 0 };
        }
        map[key].quantity += item.quantity;
        map[key].revenue += item.quantity * item.price;
      }
    }

    const totalRevenue = summary.totalRevenue || 1;
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .map((row) => ({
        ...row,
        share: (row.revenue / totalRevenue) * 100,
      }));
  }, [sales, summary.totalRevenue]);

  const periodHeatmap = useMemo<HeatmapPeriod[]>(() => {
    const byHour = new Map<number, HeatmapHour>();
    for (const slot of heatmap) {
      byHour.set(slot.hour, slot);
    }

    const periodStarts = [6, 9, 12, 15, 18, 21, 0, 3];
    return periodStarts.map((startHour) => {
      const endHour = (startHour + 3) % 24;
      let sale_count = 0;
      let revenue = 0;

      for (let offset = 0; offset < 3; offset += 1) {
        const hour = (startHour + offset) % 24;
        const row = byHour.get(hour);
        if (!row) continue;
        sale_count += row.sale_count;
        revenue += row.revenue;
      }

      return {
        startHour,
        endHour,
        label: buildPeriodLabel(startHour, endHour),
        sale_count,
        revenue,
      };
    });
  }, [heatmap]);

  const maxHeatCount = Math.max(1, ...periodHeatmap.map((slot) => slot.sale_count));

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCsv}
            disabled={sales.length === 0}
            className="h-10 px-4 rounded-[10px] border border-border/70 text-sm font-medium flex items-center gap-2 hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Download CSV
          </button>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
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
          <div className="text-muted-foreground text-sm hidden lg:block lg:pb-3">to</div>
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
            className="btn-accent h-11 px-5 rounded-[10px] text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed sm:col-span-2 lg:col-span-1"
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
            <table className="w-full min-w-[720px]">
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

      <div className="card-soft p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-lg">Hourly heatmap archive</h2>
            <p className="text-sm text-muted-foreground">Persisted hourly sales snapshot for a selected date.</p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Heatmap date</label>
              <input
                type="date"
                value={heatmapDate}
                onChange={(e) => setHeatmapDate(e.target.value)}
                className="input-pos mt-1"
              />
            </div>
            <button
              onClick={() => void loadHeatmap(heatmapDate)}
              disabled={heatmapLoading || !heatmapDate}
              className="btn-accent h-11 px-4 rounded-[10px] text-sm font-semibold disabled:opacity-60"
            >
              {heatmapLoading ? "Loading" : "Load"}
            </button>
          </div>
        </div>

        {heatmapError && <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{heatmapError}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          {periodHeatmap.map((slot) => {
            const intensity = slot.sale_count === 0 ? 0.08 : 0.2 + (slot.sale_count / maxHeatCount) * 0.8;
            const tooltip = `${slot.label}: ${slot.sale_count} sales, ${formatCurrency(slot.revenue)} revenue`;
            return (
              <div key={slot.label} className="rounded-[10px] border border-border/60 p-2" title={tooltip}>
                <div className="text-xs font-medium text-muted-foreground">{slot.label}</div>
                <div className="h-8 rounded-md mt-2" style={{ background: `hsl(var(--primary) / ${intensity})` }} />
                <div className="mt-2 text-xs text-muted-foreground">{slot.sale_count} sales</div>
                <div className="text-xs font-semibold tabular-nums">{formatCurrency(slot.revenue)}</div>
              </div>
            );
          })}
        </div>
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
