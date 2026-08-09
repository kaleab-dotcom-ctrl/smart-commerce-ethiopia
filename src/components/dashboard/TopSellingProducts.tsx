"use client";

import Link from "next/link";
import { Order } from "@/lib/orders";
import { getCompletedOrders, getTopSellingProducts } from "@/lib/analytics";

type TopSellingProductsProps = {
  orders: Order[];
};

export function TopSellingProducts({ orders }: TopSellingProductsProps) {
  const completedOrders = getCompletedOrders(orders);
  const topProducts = getTopSellingProducts(completedOrders, 5);

  const maxUnits = Math.max(...topProducts.map((p) => p.unitsSold), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-sm">
                🏆
              </span>
              Top-Selling Products
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Ranked by completed units sold & revenue in ETB.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
            Top 5
          </span>
        </div>

        {/* Content */}
        {topProducts.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted flex flex-col items-center justify-center">
            <span className="text-2xl mb-2">📦</span>
            <p className="font-semibold text-foreground">No product sales recorded yet</p>
            <p className="mt-1 text-[11px]">
              Complete customer orders to see top-performing items.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product, index) => {
              const widthPct = (product.unitsSold / maxUnits) * 100;
              return (
                <div key={product.productId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                        {product.productName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">
                        {product.unitsSold} {product.unitsSold === 1 ? "unit" : "units"}
                      </span>
                      <span className="font-mono font-bold text-brand-green">
                        {product.revenueGenerated.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="font-sans text-[10px]">ETB</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                      className="h-full rounded-full bg-brand-green transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {topProducts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border text-center">
          <Link
            href="/dashboard/orders"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            View all sales orders →
          </Link>
        </div>
      )}
    </div>
  );
}
