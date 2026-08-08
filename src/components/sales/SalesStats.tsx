"use client";

import { Sale } from "@/lib/sales";

type SalesStatsProps = {
  sales: Sale[];
};

export function SalesStats({ sales }: SalesStatsProps) {
  const totalSalesCount = sales.length;

  const totalRevenue = sales.reduce(
    (sum, item) => sum + (Number(item.total_price) || 0),
    0
  );

  const totalUnitsSold = sales.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Revenue */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Revenue
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-semibold text-xs">
            💰
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-semibold text-brand-green">ETB</span>
        </div>
      </div>

      {/* Sales Transactions */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Sales Count
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-semibold text-xs">
            🧾
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalSalesCount}
          </span>
          <span className="text-xs text-muted">
            {totalSalesCount === 1 ? "transaction" : "transactions"}
          </span>
        </div>
      </div>

      {/* Total Units Sold */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Units Sold
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs">
            🛍️
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalUnitsSold.toLocaleString("en-US")}
          </span>
          <span className="text-xs text-muted">units sold</span>
        </div>
      </div>
    </div>
  );
}
