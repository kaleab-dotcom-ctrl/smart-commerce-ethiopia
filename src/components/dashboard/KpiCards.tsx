"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { Sale } from "@/lib/sales";

type KpiCardsProps = {
  products: Product[];
  sales: Sale[];
};

export function KpiCards({ products, sales }: KpiCardsProps) {
  // 1. Total Products
  const totalProducts = products.length;

  // 2. Today's Revenue (ETB)
  const today = new Date();
  const todaysSales = sales.filter((s) => {
    try {
      const saleDate = new Date(s.created_at);
      return (
        saleDate.getFullYear() === today.getFullYear() &&
        saleDate.getMonth() === today.getMonth() &&
        saleDate.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  });

  const todaysRevenue = todaysSales.reduce(
    (sum, s) => sum + (Number(s.total_price) || 0),
    0
  );

  // 3. Total Sales (Count)
  const totalSalesCount = sales.length;

  // 4. Low Stock Products (quantity <= 5)
  const lowStockCount = products.filter(
    (p) => Number(p.quantity) <= 5
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Products */}
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
            Manage →
          </Link>
        </div>
        <p className="mt-1 text-[11px] text-muted">Active SKUs in inventory</p>
      </div>

      {/* Today's Revenue (ETB) */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Today&apos;s Revenue
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-semibold text-sm">
            💵
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {todaysRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-brand-green">ETB</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          From {todaysSales.length} {todaysSales.length === 1 ? "sale" : "sales"} today
        </p>
      </div>

      {/* Total Sales */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-green-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Sales
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-semibold text-sm">
            🧾
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalSalesCount}
          </span>
          <Link
            href="/dashboard/sales"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            History →
          </Link>
        </div>
        <p className="mt-1 text-[11px] text-muted">Total recorded orders</p>
      </div>

      {/* Low Stock Products */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Low Stock Products
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
              lowStockCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-muted"
            }`}
          >
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
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {lowStockCount > 0 ? "Items <= 5 units" : "Stock healthy"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Requires inventory restock</p>
      </div>
    </div>
  );
}
