"use client";

import Link from "next/link";
import { Product } from "@/lib/products";

type LowStockSummaryProps = {
  products: Product[];
};

export function LowStockSummary({ products }: LowStockSummaryProps) {
  // Low stock = quantity <= 5
  const lowStockProducts = products.filter(
    (p) => Number(p.quantity) <= 5
  );

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-sm">
                ⚠️
              </span>
              Low Stock Alerts
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Products requiring urgent inventory restock (≤ 5 units).
            </p>
          </div>

          <Link
            href="/dashboard/products"
            className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
          >
            Manage Products →
          </Link>
        </div>

        {/* Content */}
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
              ✅
            </div>
            <h4 className="mt-3 text-xs font-bold text-foreground">
              Inventory status healthy
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-muted">
              All active product stock levels are currently above 5 units.
            </p>
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
                  <th scope="col" className="py-3 pl-3 pr-5 text-right">
                    Stock Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {lowStockProducts.map((product) => {
                  const qty = Number(product.quantity);
                  const isOutOfStock = qty === 0;

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      {/* Product */}
                      <td className="py-3 pl-5 pr-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold text-[10px] uppercase ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
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

                      {/* Stock Status Badge */}
                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isOutOfStock
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock (0)" : `${qty} units left`}
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

      {lowStockProducts.length > 0 && (
        <div className="p-3 border-t border-border bg-slate-50/50 text-center">
          <Link
            href="/dashboard/products"
            className="text-xs font-semibold text-amber-700 hover:underline"
          >
            Update product inventory levels ({lowStockProducts.length} items low) →
          </Link>
        </div>
      )}
    </div>
  );
}
