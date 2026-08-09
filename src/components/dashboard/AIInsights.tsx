"use client";

import Link from "next/link";
import { Product, getStockStatus } from "@/lib/products";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightSeverity = "critical" | "warning" | "info";

export type InventoryInsight = {
  id: string;
  severity: InsightSeverity;
  category: string;
  icon: string;
  title: string;
  description: string;
  /** Optional: related category name or product name for context */
  context?: string;
};

// ─── Insight Engine ───────────────────────────────────────────────────────────

/**
 * Generates a prioritized list of inventory insights from live product data.
 * Uses only fields available in the Product type:
 *   name, category, price, quantity, created_at
 * Does NOT use or fabricate sales, demand, or revenue data.
 */
export function generateInventoryInsights(
  products: Product[]
): InventoryInsight[] {
  const insights: InventoryInsight[] = [];

  if (products.length === 0) {
    insights.push({
      id: "no-products",
      severity: "info",
      category: "Getting Started",
      icon: "📦",
      title: "No Products in Catalog",
      description:
        "Add your first product to the catalog to start generating inventory insights and business recommendations.",
    });
    return insights;
  }

  // ── 1. Out-of-stock (Critical) ────────────────────────────────────────────
  const outOfStock = products.filter(
    (p) => getStockStatus(p.quantity) === "out_of_stock"
  );
  if (outOfStock.length > 0) {
    const sample = outOfStock
      .slice(0, 3)
      .map((p) => `"${p.name}"`)
      .join(", ");
    const more = outOfStock.length > 3 ? ` and ${outOfStock.length - 3} more` : "";
    insights.push({
      id: "out-of-stock",
      severity: "critical",
      category: "Stock Alert",
      icon: "🚨",
      title: `${outOfStock.length} ${outOfStock.length === 1 ? "Product" : "Products"} Out of Stock`,
      description: `${sample}${more} ${outOfStock.length === 1 ? "has" : "have"} 0 units remaining and ${outOfStock.length === 1 ? "requires" : "require"} immediate restocking to avoid missed sales.`,
    });
  }

  // ── 2. Low-stock (Warning) ────────────────────────────────────────────────
  const lowStock = products.filter(
    (p) => getStockStatus(p.quantity) === "low_stock"
  );
  if (lowStock.length > 0) {
    const sample = lowStock
      .slice(0, 3)
      .map((p) => `"${p.name}" (${p.quantity} left)`)
      .join(", ");
    const more = lowStock.length > 3 ? ` and ${lowStock.length - 3} more` : "";
    insights.push({
      id: "low-stock",
      severity: "warning",
      category: "Low Stock",
      icon: "⚠️",
      title: `${lowStock.length} ${lowStock.length === 1 ? "Product" : "Products"} Running Low`,
      description: `${sample}${more} ${lowStock.length === 1 ? "has" : "have"} 5 or fewer units remaining. Plan restock orders soon to prevent stockouts.`,
    });
  }

  // ── 3. All-healthy confirmation (Info, only if no alerts above) ───────────
  if (outOfStock.length === 0 && lowStock.length === 0) {
    insights.push({
      id: "inventory-healthy",
      severity: "info",
      category: "Inventory Health",
      icon: "✅",
      title: "All Products Sufficiently Stocked",
      description: `All ${products.length} products in your catalog currently have more than 5 units in stock. No immediate restocking action required.`,
    });
  }

  // ── 4. Inventory value concentration ─────────────────────────────────────
  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0
  );

  if (totalValue > 0) {
    // Category-level inventory value
    const catValueMap = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category?.trim() || "Uncategorized";
      catValueMap.set(
        cat,
        (catValueMap.get(cat) || 0) + Number(p.price) * Number(p.quantity)
      );
    });

    const sortedCats = Array.from(catValueMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topCat = sortedCats[0];
    const topCatPct = Math.round((topCat[1] / totalValue) * 100);

    if (topCatPct >= 50 && sortedCats.length > 1) {
      insights.push({
        id: "value-concentration",
        severity: "warning",
        category: "Inventory Risk",
        icon: "📊",
        title: `High Value Concentration in "${topCat[0]}"`,
        description: `"${topCat[0]}" accounts for ${topCatPct}% of your total inventory value (${topCat[1].toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB of ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB total). Consider diversifying to reduce risk.`,
        context: topCat[0],
      });
    } else {
      insights.push({
        id: "top-value-category",
        severity: "info",
        category: "Inventory Value",
        icon: "💰",
        title: `Highest Value Category: "${topCat[0]}"`,
        description: `"${topCat[0]}" holds the largest share of inventory value at ${topCat[1].toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB (${topCatPct}% of total). Overall catalog value: ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB.`,
        context: topCat[0],
      });
    }
  }

  // ── 5. Largest category by product count ─────────────────────────────────
  const catCountMap = new Map<string, number>();
  products.forEach((p) => {
    const cat = p.category?.trim() || "Uncategorized";
    catCountMap.set(cat, (catCountMap.get(cat) || 0) + 1);
  });
  const sortedCatCount = Array.from(catCountMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const topCountCat = sortedCatCount[0];

  if (sortedCatCount.length > 1) {
    insights.push({
      id: "largest-category",
      severity: "info",
      category: "Catalog Structure",
      icon: "🏷️",
      title: `Largest Category: "${topCountCat[0]}"`,
      description: `"${topCountCat[0]}" contains the most products (${topCountCat[1]} of ${products.length} total SKUs). Your catalog spans ${sortedCatCount.length} categories.`,
      context: topCountCat[0],
    });
  }

  // ── 6. High-value individual items (top 1 by unit price) ─────────────────
  const sortedByPrice = [...products].sort(
    (a, b) => Number(b.price) - Number(a.price)
  );
  const topPriceProduct = sortedByPrice[0];
  if (topPriceProduct && Number(topPriceProduct.price) > 0) {
    const stockStatus = getStockStatus(topPriceProduct.quantity);
    if (stockStatus !== "in_stock") {
      // Only flag if the highest-value item is at risk
      insights.push({
        id: "high-value-at-risk",
        severity: stockStatus === "out_of_stock" ? "critical" : "warning",
        category: "High-Value Risk",
        icon: "💎",
        title: `Highest-Value Item at Risk: "${topPriceProduct.name}"`,
        description: `"${topPriceProduct.name}" is your highest-priced item at ${Number(topPriceProduct.price).toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB per unit but currently ${stockStatus === "out_of_stock" ? "has 0 units in stock" : `has only ${topPriceProduct.quantity} units remaining`}. Prioritize restocking this item.`,
        context: topPriceProduct.name,
      });
    }
  }

  // ── 7. Zero-price anomaly ────────────────────────────────────────────────
  const zeroPriceProducts = products.filter((p) => Number(p.price) === 0);
  if (zeroPriceProducts.length > 0) {
    insights.push({
      id: "zero-price",
      severity: "warning",
      category: "Data Quality",
      icon: "🔧",
      title: `${zeroPriceProducts.length} ${zeroPriceProducts.length === 1 ? "Product" : "Products"} With Zero Price`,
      description: `${zeroPriceProducts.map((p) => `"${p.name}"`).join(", ")} ${zeroPriceProducts.length === 1 ? "has" : "have"} a price of 0 ETB. Update pricing to ensure accurate inventory valuations.`,
    });
  }

  // Sort by severity: critical first, then warning, then info
  const severityOrder: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Return up to 6 insights
  return insights.slice(0, 6);
}

// ─── Component ────────────────────────────────────────────────────────────────

type AIInsightsProps = {
  products: Product[];
};

const SEVERITY_STYLES: Record<
  InsightSeverity,
  {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    titleColor: string;
    labelText: string;
  }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    titleColor: "text-red-950",
    labelText: "Critical",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    titleColor: "text-amber-950",
    labelText: "Warning",
  },
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50/50",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    titleColor: "text-blue-950",
    labelText: "Info",
  },
};

export function AIInsights({ products }: AIInsightsProps) {
  const insights = generateInventoryInsights(products);

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-base">
                ✨
              </span>
              AI Inventory Insights
            </h2>
            <span className="rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-green">
              Smart Commerce Engine
            </span>
            {criticalCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800 animate-pulse">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                {warningCount} Warning
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Deterministic recommendations derived from real inventory data — no external AI required.
          </p>
        </div>

        <Link
          href="/dashboard/products"
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-slate-100"
        >
          Manage Inventory →
        </Link>
      </div>

      {/* Insights Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight) => {
            const style = SEVERITY_STYLES[insight.severity];
            return (
              <div
                key={insight.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${style.border} ${style.bg}`}
              >
                {/* Top row: category badge + severity label + icon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
                    >
                      {insight.category}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                        insight.severity === "critical"
                          ? "border-red-300 text-red-700"
                          : insight.severity === "warning"
                          ? "border-amber-300 text-amber-700"
                          : "border-blue-300 text-blue-700"
                      }`}
                    >
                      {style.labelText}
                    </span>
                  </div>
                  <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
                </div>

                {/* Title */}
                <h3 className={`text-sm font-bold leading-snug ${style.titleColor}`}>
                  {insight.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
