import { useEffect, useMemo, useState } from "react";
import { usePOS, formatCurrency } from "@/store/pos";
import { History } from "lucide-react";

const filters = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
] as const;

type Filter = typeof filters[number]["id"];

function startOf(filter: Filter): number {
  const d = new Date();
  if (filter === "today") { d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (filter === "week") { d.setDate(d.getDate() - 7); return d.getTime(); }
  if (filter === "month") { d.setDate(d.getDate() - 30); return d.getTime(); }
  return 0;
}

export default function Sales() {
  const { sales, dashboard, refreshDashboard, isLoading } = usePOS();
  const [filter, setFilter] = useState<Filter>("today");

  useEffect(() => {
    if (!dashboard && !isLoading) {
      void refreshDashboard();
    }
  }, [dashboard, isLoading, refreshDashboard]);

  const filtered = useMemo(() => {
    const cutoff = startOf(filter);
    return sales.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
  }, [sales, filter]);

  const todayRevenue = dashboard?.today_total ?? 0;
  const todaySalesCount = dashboard?.sales_count ?? 0;
  const avgSale = dashboard?.average_sale ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl">Sales History</h1>
        <p className="text-sm text-muted-foreground mt-1">Every transaction, at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <Metric label="Today's Revenue" value={formatCurrency(todayRevenue)} />
        <Metric label="Sales Today" value={String(todaySalesCount)} />
        <Metric label="Average Sale" value={formatCurrency(avgSale)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-all ${
              filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-soft p-16 text-center">
          <History className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">No sales in this range</p>
          <p className="text-sm text-muted-foreground">Record a sale from the POS screen to see it here.</p>
        </div>
      ) : (
        <div className="card-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="px-5 py-3 font-medium">Sale</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">#{s.id.slice(0, 6)}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium">{s.customerName || "—"}</div>
                    {s.notes && <div className="text-xs text-muted-foreground italic truncate max-w-xs">{s.notes}</div>}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {s.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </td>
                  <td className="px-5 py-4 font-semibold tabular-nums">{formatCurrency(s.total)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-soft p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="font-display font-bold text-2xl mt-2 tabular-nums">{value}</div>
    </div>
  );
}
