"use client";

import { Product } from "@/lib/products";

type CategoryAnalyticsProps = {
  products: Product[];
};

type CategoryStat = {
  category: string;
  count: number;
  totalUnits: number;
  inventoryValue: number;
  percentageOfValue: number;
};

export function CategoryAnalytics({ products }: CategoryAnalyticsProps) {
  // Aggregate stats per category
  const categoryMap = new Map<
    string,
    { count: number; totalUnits: number; inventoryValue: number }
  >();

  let overallInventoryValue = 0;

  products.forEach((product) => {
    const cat = product.category.trim() || "Uncategorized";
    const qty = Number(product.quantity) || 0;
    const price = Number(product.price) || 0;
    const value = qty * price;

    overallInventoryValue += value;

    const existing = categoryMap.get(cat) || {
      count: 0,
      totalUnits: 0,
      inventoryValue: 0,
    };
    existing.count += 1;
    existing.totalUnits += qty;
    existing.inventoryValue += value;
    categoryMap.set(cat, existing);
  });

  const categoryStats: CategoryStat[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      count: data.count,
      totalUnits: data.totalUnits,
      inventoryValue: data.inventoryValue,
      percentageOfValue:
        overallInventoryValue > 0
          ? (data.inventoryValue / overallInventoryValue) * 100
          : 0,
    })
  );

  // Sort categories by inventory value descending
  categoryStats.sort((a, b) => b.inventoryValue - a.inventoryValue);

  const maxCategoryValue = Math.max(
    ...categoryStats.map((c) => c.inventoryValue),
    1
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* 1. Category Product Count Analytics */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
                🏷️
              </span>
              Product Count by Category
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Active SKU breakdown across business categories.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
            {categoryStats.length}{" "}
            {categoryStats.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            No products available to generate category analytics.
          </div>
        ) : (
          <div className="space-y-4">
            {categoryStats.map((stat) => {
              const countPercentage = (stat.count / products.length) * 100;
              return (
                <div key={stat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {stat.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {stat.count} {stat.count === 1 ? "product" : "products"}
                      </span>
                      <span className="text-[11px] text-muted">
                        ({countPercentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${countPercentage}%` }}
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Inventory Value Visualization by Category */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green text-sm">
                💰
              </span>
              Inventory Value by Category
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Valuation in ETB = sum(Price × Quantity) per category.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-brand-green">
            Total: {overallInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
          </span>
        </div>

        {categoryStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">
            No products available to visualize category valuation.
          </div>
        ) : (
          <div className="space-y-4">
            {categoryStats.map((stat) => {
              const barWidthPercentage = (stat.inventoryValue / maxCategoryValue) * 100;
              return (
                <div key={stat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {stat.category}
                      </span>
                      <span className="text-[11px] text-muted">
                        ({stat.totalUnits.toLocaleString("en-US")} units)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-foreground">
                        {stat.inventoryValue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[11px] font-sans font-bold text-brand-green">
                        ETB
                      </span>
                    </div>
                  </div>

                  {/* Valuation Bar */}
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(barWidthPercentage, 4)}%` }}
                      className="h-full rounded-full bg-brand-green transition-all duration-500"
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
