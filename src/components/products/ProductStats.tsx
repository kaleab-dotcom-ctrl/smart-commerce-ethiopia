"use client";

import { Product } from "@/lib/products";

type ProductStatsProps = {
  products: Product[];
};

export function ProductStats({ products }: ProductStatsProps) {
  const totalProducts = products.length;

  const totalValue = products.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  const totalStock = products.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const lowStockCount = products.filter(
    (item) => Number(item.quantity) <= 5
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Products */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Products
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-semibold text-xs">
            📦
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalProducts}
          </span>
          <span className="text-xs text-muted">SKUs active</span>
        </div>
      </div>

      {/* Inventory Value */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Inventory Value
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-semibold text-xs">
            ETB
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-semibold text-brand-green">ETB</span>
        </div>
      </div>

      {/* Total Units */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Units in Stock
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs">
            📊
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalStock.toLocaleString("en-US")}
          </span>
          <span className="text-xs text-muted">total units</span>
        </div>
      </div>

      {/* Low Stock Warning */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Low Stock Alert
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-semibold text-xs">
            ⚠️
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-bold ${
              lowStockCount > 0 ? "text-amber-600" : "text-foreground"
            }`}
          >
            {lowStockCount}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              lowStockCount > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-muted"
            }`}
          >
            {lowStockCount > 0 ? "Needs restock" : "Stock healthy"}
          </span>
        </div>
      </div>
    </div>
  );
}
