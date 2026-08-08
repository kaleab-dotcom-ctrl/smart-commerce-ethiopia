"use client";

import { Product } from "@/lib/products";
import { Sale } from "@/lib/sales";

type AIInsightsProps = {
  products: Product[];
  sales: Sale[];
};

type Priority = "urgent" | "warning" | "success" | "info";

type Insight = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  priority: Priority;
};

export function generateInsights(products: Product[], sales: Sale[]): Insight[] {
  const insights: Insight[] = [];

  // Edge Case: No products & no sales
  if (products.length === 0 && sales.length === 0) {
    return [
      {
        id: "no-data",
        category: "Getting Started",
        title: "Awaiting Catalog & Sales Data",
        description:
          "Add your first product and record sales to unlock AI business recommendations and automated inventory insights.",
        icon: "✨",
        priority: "info",
      },
    ];
  }

  // Rule 1: Out of Stock / Restock Recommended
  const outOfStock = products.filter((p) => Number(p.quantity) === 0);
  const lowStock = products.filter(
    (p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5
  );

  if (outOfStock.length > 0) {
    const names = outOfStock.map((p) => `"${p.name}"`).join(", ");
    insights.push({
      id: "out-of-stock",
      category: "Restock Recommended",
      title: `Out of Stock Alert (${outOfStock.length} ${outOfStock.length === 1 ? "item" : "items"})`,
      description: `${names} currently ${outOfStock.length === 1 ? "has" : "have"} 0 units in stock. Restock immediately to prevent lost sales.`,
      icon: "🚨",
      priority: "urgent",
    });
  } else if (lowStock.length > 0) {
    const topLow = lowStock
      .slice(0, 3)
      .map((p) => `"${p.name}" (${p.quantity} units)`)
      .join(", ");
    insights.push({
      id: "low-stock-alert",
      category: "Low Stock Alert",
      title: `Restock Recommended (${lowStock.length} ${lowStock.length === 1 ? "item" : "items"})`,
      description: `Stock levels are low for ${topLow}. Plan restock orders soon to maintain fulfillment.`,
      icon: "⚠️",
      priority: "warning",
    });
  } else if (products.length > 0) {
    insights.push({
      id: "inventory-healthy",
      category: "Inventory Health",
      title: "Inventory Buffer Optimal",
      description: `All ${products.length} products maintain healthy stock buffers above 5 units. No emergency restocking required.`,
      icon: "✅",
      priority: "success",
    });
  }

  // Rule 2: Top Seller / Best-Selling Product
  if (sales.length > 0) {
    const productSalesMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    sales.forEach((s) => {
      const key = s.product_id || s.product_name;
      const existing = productSalesMap.get(key) || {
        name: s.product_name,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += Number(s.quantity) || 0;
      existing.revenue += Number(s.total_price) || 0;
      productSalesMap.set(key, existing);
    });

    const sortedByUnits = Array.from(productSalesMap.values()).sort(
      (a, b) => b.quantity - a.quantity
    );

    if (sortedByUnits.length > 0) {
      const topSeller = sortedByUnits[0];
      insights.push({
        id: "top-seller",
        category: "Top Seller",
        title: `Top Seller: ${topSeller.name}`,
        description: `"${topSeller.name}" leads customer demand with ${topSeller.quantity} units sold generating ${topSeller.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB in revenue.`,
        icon: "🏆",
        priority: "success",
      });
    }
  }

  // Rule 3: Revenue Trend & Sales Performance
  if (sales.length > 0) {
    const totalRevenue = sales.reduce(
      (sum, s) => sum + (Number(s.total_price) || 0),
      0
    );
    const avgOrderValue = totalRevenue / sales.length;

    const today = new Date();
    const todaysSales = sales.filter((s) => {
      try {
        const d = new Date(s.created_at);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      } catch {
        return false;
      }
    });

    const todaysRevenue = todaysSales.reduce(
      (sum, s) => sum + (Number(s.total_price) || 0),
      0
    );

    if (todaysSales.length > 0) {
      insights.push({
        id: "revenue-today",
        category: "Revenue Trend",
        title: `Daily Revenue: ${todaysRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB Today`,
        description: `Logged ${todaysSales.length} ${todaysSales.length === 1 ? "transaction" : "transactions"} today. Average order value across all orders sits at ${avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB.`,
        icon: "📈",
        priority: "info",
      });
    } else {
      insights.push({
        id: "revenue-overall",
        category: "Revenue Trend",
        title: `Cumulative Revenue: ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB`,
        description: `Recorded ${sales.length} orders to date with an average order value of ${avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB.`,
        icon: "💼",
        priority: "info",
      });
    }
  } else if (products.length > 0) {
    insights.push({
      id: "awaiting-sales",
      category: "Revenue Trend",
      title: "Ready for Initial Sales",
      description: `Your product catalog contains ${products.length} items ready for sale. Log your first customer transaction to start tracking velocity trends.`,
      icon: "💡",
      priority: "info",
    });
  }

  // Rule 4: Sales Velocity & Stock Burn Risk
  if (sales.length > 0 && products.length > 0) {
    const productSalesMap = new Map<string, number>();
    sales.forEach((s) => {
      const key = s.product_id;
      if (key) {
        productSalesMap.set(
          key,
          (productSalesMap.get(key) || 0) + Number(s.quantity)
        );
      }
    });

    const fastMovingLowStock = products.filter((p) => {
      const soldQty = productSalesMap.get(p.id) || 0;
      const currentStock = Number(p.quantity);
      return soldQty > 0 && currentStock > 0 && currentStock <= 10;
    });

    if (fastMovingLowStock.length > 0 && insights.length < 5) {
      const p = fastMovingLowStock[0];
      const soldQty = productSalesMap.get(p.id) || 0;
      insights.push({
        id: `high-velocity-${p.id}`,
        category: "Sales Velocity",
        title: `High Velocity Risk: ${p.name}`,
        description: `"${p.name}" has sold ${soldQty} units and only ${p.quantity} units remain in stock. Order restock soon to keep up with customer demand.`,
        icon: "⚡",
        priority: "warning",
      });
    }
  }

  return insights.slice(0, 5);
}

export function AIInsights({ products, sales }: AIInsightsProps) {
  const insights = generateInsights(products, sales);

  const priorityStyles: Record<
    Priority,
    { border: string; bg: string; badge: string; text: string }
  > = {
    urgent: {
      border: "border-red-200",
      bg: "bg-red-50/70",
      badge: "bg-red-100 text-red-800",
      text: "text-red-950",
    },
    warning: {
      border: "border-amber-200",
      bg: "bg-amber-50/70",
      badge: "bg-amber-100 text-amber-800",
      text: "text-amber-950",
    },
    success: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/70",
      badge: "bg-emerald-100 text-emerald-800",
      text: "text-emerald-950",
    },
    info: {
      border: "border-blue-200",
      bg: "bg-blue-50/70",
      badge: "bg-blue-100 text-blue-800",
      text: "text-blue-950",
    },
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm">
                ✨
              </span>
              AI Business Insights
            </h2>
            <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-green">
              Smart Commerce Engine
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Automated recommendations based on real-time inventory levels and sales velocity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const style = priorityStyles[insight.priority];

          return (
            <div
              key={insight.id}
              className={`flex flex-col justify-between rounded-xl border p-4.5 transition-all hover:shadow-md ${style.border} ${style.bg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
                  >
                    {insight.category}
                  </span>
                  <span className="text-xl">{insight.icon}</span>
                </div>

                <h3 className={`mt-3 text-sm font-bold ${style.text}`}>
                  {insight.title}
                </h3>

                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
