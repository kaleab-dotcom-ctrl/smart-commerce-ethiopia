"use client";

import Link from "next/link";
import { Product } from "@/lib/products";

type KpiCardsProps = {
  products: Product[];
};

export function KpiCards({ products }: KpiCardsProps) {
  // 1. Total Products
  const totalProducts = products.length;

  // 2. Total Inventory Units
  const totalInventoryUnits = products.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  // 3. Inventory Value (ETB)
  const totalInventoryValue = products.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  // 4. Low Stock Products (quantity <= 5)
  const lowStockCount = products.filter(
    (item) => Number(item.quantity) <= 5
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Products */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Products
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-sm">
            📦
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalProducts}
          </span>
          <Link
            href="/dashboard/products"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Catalog →
          </Link>
        </div>
        <p className="mt-1 text-[11px] text-muted">Active SKUs in database</p>
      </div>

      {/* 2. Total Inventory Units */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Inventory Units
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-brand-green font-semibold text-sm">
            📊
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalInventoryUnits.toLocaleString("en-US")}
          </span>
          <span className="text-xs text-muted">units</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">In-stock physical inventory</p>
      </div>

      {/* 3. Inventory Value (ETB) */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-green-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Inventory Value
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-semibold text-sm">
            💰
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalInventoryValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-brand-green">ETB</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Total retail valuation</p>
      </div>

      {/* 4. Low Stock (Visually Noticeable Card) */}
      <div
        className={`group rounded-xl border p-5 shadow-xs transition-all hover:shadow-md ${
          lowStockCount > 0
            ? "border-amber-300 bg-amber-50/40 hover:border-amber-400"
            : "border-border bg-surface hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              lowStockCount > 0 ? "text-amber-900" : "text-muted"
            }`}
          >
            Low Stock Alerts
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
              lowStockCount > 0
                ? "bg-amber-100 text-amber-800 shadow-xs"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {lowStockCount > 0 ? "⚠️" : "✅"}
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span
            className={`text-2xl font-bold ${
              lowStockCount > 0 ? "text-amber-700" : "text-foreground"
            }`}
          >
            {lowStockCount}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              lowStockCount > 0
                ? "bg-amber-200 text-amber-900 animate-pulse"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {lowStockCount > 0
              ? `${lowStockCount} ${lowStockCount === 1 ? "item" : "items"} ≤ 5 units`
              : "Stock healthy"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {lowStockCount > 0
            ? "Requires urgent inventory restock"
            : "All products above threshold"}
        </p>
      </div>
    </div>
  );
}
