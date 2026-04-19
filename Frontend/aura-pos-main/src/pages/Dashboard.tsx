import { useEffect, useMemo } from "react";
import { usePOS, formatCurrency } from "@/store/pos";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, ShoppingBag, Package, Crown } from "lucide-react";

export default function Dashboard() {
  const { sales, products, dashboard, refreshDashboard, isLoading } = usePOS();

  useEffect(() => {
    if (!dashboard && !isLoading) {
      void refreshDashboard();
    }
  }, [dashboard, isLoading, refreshDashboard]);

  const data = useMemo(() => {
    const todayRevenue = dashboard?.today_total ?? 0;
    const todayCount = dashboard?.sales_count ?? 0;
    const averageSale = dashboard?.average_sale ?? 0;

    // Most sold
    const counts: Record<string, { name: string; qty: number }> = {};
    sales.forEach((s) => s.items.forEach((i) => {
      counts[i.productId] = counts[i.productId] || { name: i.name, qty: 0 };
      counts[i.productId].qty += i.quantity;
    }));
    const top = Object.values(counts).sort((a, b) => b.qty - a.qty)[0];

    return {
      todayRevenue,
      todayCount,
      productCount: products.length,
      topName: top?.name ?? "—",
      averageSale,
      chart: dashboard?.chart_7d ?? [],
      recent: sales.slice(0, 5),
    };
  }, [dashboard, sales, products]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">A calm overview of your day.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Metric icon={TrendingUp} label="Today's Revenue" value={formatCurrency(data.todayRevenue)} />
        <Metric icon={ShoppingBag} label="Sales Today" value={String(data.todayCount)} />
        <Metric icon={Package} label="Products" value={String(data.productCount)} />
        <Metric icon={Crown} label="Top Seller" value={data.topName} small />
      </div>

      {isLoading && !dashboard && (
        <div className="mb-4 text-sm text-muted-foreground">Loading live data from the backend...</div>
      )}

      <div className="card-soft p-5 md:p-6 mb-6">
        <h2 className="font-display font-semibold text-[15px] mb-4">Last 7 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-soft p-5 md:p-6">
        <h2 className="font-display font-semibold text-[15px] mb-4">Recent sales</h2>
        {data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet — your most recent transactions will appear here.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.recent.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="font-display font-semibold tabular-nums">{formatCurrency(s.total)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, small }: { icon: any; label: string; value: string; small?: boolean }) {
  return (
    <div className="card-soft p-4 md:p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon size={15} />
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`font-display font-bold tabular-nums ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
