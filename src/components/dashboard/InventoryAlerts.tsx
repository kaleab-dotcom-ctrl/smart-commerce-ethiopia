"use client";

import Link from "next/link";
import { Product, getStockStatus, getStockStatusLabel } from "@/lib/products";

type InventoryAlertsProps = {
  products: Product[];
};

export function InventoryAlerts({ products }: InventoryAlertsProps) {
  // Alert products = quantity <= 5
  const alertProducts = products.filter(
    (p) => getStockStatus(p.quantity) !== "in_stock"
  );

  const outOfStockCount = products.filter(
    (p) => getStockStatus(p.quantity) === "out_of_stock"
  ).length;

  const lowStockCount = products.filter(
    (p) => getStockStatus(p.quantity) === "low_stock"
  ).length;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col gap-3 p-5 border-b border-border sm:flex-row sm:items-center sm:justify-between bg-surface">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold ${
                alertProducts.length > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {alertProducts.length > 0 ? "⚠️" : "✅"}
            </span>
            Inventory Alerts
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Real-time stock monitoring for out-of-stock and low-stock items.
          </p>
        </div>

        {/* Action Link */}
        <Link
          href="/dashboard/products"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-slate-100"
        >
          <span>Manage Catalog</span>
          <span>→</span>
        </Link>
      </div>

      {/* Summary Counts Header Cards */}
      <div className="grid grid-cols-2 gap-4 border-b border-border bg-slate-50/60 p-4">
        {/* Out of Stock Count */}
        <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-900 block">
              Out of Stock
            </span>
            <span className="text-2xl font-bold text-red-700 mt-0.5 block">
              {outOfStockCount}
            </span>
          </div>
          <span className="text-2xl">🚨</span>
        </div>

        {/* Low Stock Count */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900 block">
              Low Stock
            </span>
            <span className="text-2xl font-bold text-amber-700 mt-0.5 block">
              {lowStockCount}
            </span>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
      </div>

      {/* Content Area */}
      {alertProducts.length === 0 ? (
        /* Positive Empty State */
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✅
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">
            All products are sufficiently stocked
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted">
            No active inventory alerts. Every item in your catalog currently has more than 5 units in stock.
          </p>
          <Link
            href="/dashboard/products"
            className="mt-4 rounded-lg bg-brand-green px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
          >
            View Products Catalog
          </Link>
        </div>
      ) : (
        /* Alerts Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3 pl-5 pr-3">
                  Product Name
                </th>
                <th scope="col" className="px-3 py-3">
                  Category
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Price (ETB)
                </th>
                <th scope="col" className="px-3 py-3 text-center">
                  Current Quantity
                </th>
                <th scope="col" className="py-3 pl-3 pr-5 text-right">
                  Stock Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {alertProducts.map((product) => {
                const status = getStockStatus(product.quantity);
                const isOut = status === "out_of_stock";

                return (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Product Name */}
                    <td className="py-3 pl-5 pr-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold text-[10px] uppercase ${
                            isOut
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {product.name.substring(0, 2)}
                        </span>
                        <span className="truncate max-w-[160px] sm:max-w-[220px]">
                          {product.name}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3 text-muted whitespace-nowrap">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                      {Number(product.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] text-brand-green font-sans font-bold">
                        ETB
                      </span>
                    </td>

                    {/* Current Quantity */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="font-bold text-foreground">
                        {product.quantity} units
                      </span>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                          isOut
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {getStockStatusLabel(status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
