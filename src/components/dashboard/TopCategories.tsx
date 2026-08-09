"use client";

import { Order } from "@/lib/orders";
import { Product } from "@/lib/products";
import { getCompletedOrders, getTopPerformingCategories } from "@/lib/analytics";

type TopCategoriesProps = {
  orders: Order[];
  products: Product[];
};

export function TopCategories({ orders, products }: TopCategoriesProps) {
  const completedOrders = getCompletedOrders(orders);
  const topCategories = getTopPerformingCategories(completedOrders, products, 5);

  const maxRevenue = Math.max(
    ...topCategories.map((c) => c.revenueGenerated),
    1
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 text-sm">
                🏷️
              </span>
              Top-Performing Categories
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Category revenue share from completed orders.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
            {topCategories.length}{" "}
            {topCategories.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {/* Content */}
        {topCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted flex flex-col items-center justify-center">
            <span className="text-2xl mb-2">📊</span>
            <p className="font-semibold text-foreground">No category sales yet</p>
            <p className="mt-1 text-[11px]">
              Complete orders to see category performance breakdowns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topCategories.map((cat) => {
              const widthPct = (cat.revenueGenerated / maxRevenue) * 100;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {cat.category}
                      </span>
                      <span className="text-[11px] text-muted">
                        ({cat.unitsSold} {cat.unitsSold === 1 ? "unit" : "units"})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-foreground">
                        {cat.revenueGenerated.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[10px] font-sans font-bold text-brand-green">
                        ETB
                      </span>
                      <span className="text-[10px] text-muted font-sans">
                        ({cat.percentageOfTotalRevenue.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
