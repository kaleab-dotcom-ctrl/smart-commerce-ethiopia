"use client";

import Link from "next/link";
import { Product } from "@/lib/products";

type RecentProductsTableProps = {
  products: Product[];
};

export function RecentProductsTable({ products }: RecentProductsTableProps) {
  // Show 5 most recent products
  const recentProducts = products.slice(0, 5);

  function formatDate(isoString?: string) {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green text-sm">
                🆕
              </span>
              Recently Added Products
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Latest items added to your Smart Commerce Ethiopia inventory.
            </p>
          </div>

          <Link
            href="/dashboard/products"
            className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
          >
            Catalog →
          </Link>
        </div>

        {/* Content */}
        {recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-muted">
              📦
            </div>
            <h4 className="mt-3 text-xs font-bold text-foreground">
              No products added yet
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-muted">
              Add products in the catalog to track inventory levels.
            </p>
            <Link
              href="/dashboard/products"
              className="mt-4 rounded-lg bg-brand-green px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50/70 font-semibold uppercase tracking-wider text-muted">
                  <th scope="col" className="py-3 pl-5 pr-3">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Price (ETB)
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Quantity
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-5 text-right">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {recentProducts.map((product) => {
                  const qty = Number(product.quantity);
                  const isOutOfStock = qty === 0;
                  const isLowStock = qty <= 5;

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      {/* Product Name */}
                      <td className="py-3 pl-5 pr-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                            {product.name.substring(0, 2)}
                          </span>
                          <span className="truncate max-w-[140px]">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 text-muted whitespace-nowrap">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px]">
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

                      {/* Quantity */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {product.quantity} units
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 pl-3 pr-5 text-right text-muted text-[11px] whitespace-nowrap">
                        {formatDate(product.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recentProducts.length > 0 && (
        <div className="p-3 border-t border-border bg-slate-50/50 text-center">
          <Link
            href="/dashboard/products"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            View full inventory catalog ({products.length} products) →
          </Link>
        </div>
      )}
    </div>
  );
}
