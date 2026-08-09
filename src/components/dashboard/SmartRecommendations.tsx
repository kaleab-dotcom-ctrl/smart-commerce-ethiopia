"use client";

import Link from "next/link";
import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";
import {
  generateSmartRecommendations,
  RecommendationPriority,
} from "@/lib/recommendations";

type SmartRecommendationsProps = {
  products: Product[];
  orders: Order[];
};

const PRIORITY_STYLES: Record<
  RecommendationPriority,
  {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    titleColor: string;
    icon: string;
    label: string;
  }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    badgeBg: "bg-red-100",
    badgeText: "text-red-900 border-red-200",
    titleColor: "text-red-950",
    icon: "🔴",
    label: "Critical",
  },
  high: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900 border-amber-200",
    titleColor: "text-amber-950",
    icon: "🟠",
    label: "High Priority",
  },
  medium: {
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-900 border-blue-200",
    titleColor: "text-blue-950",
    icon: "🔵",
    label: "Opportunity",
  },
  low: {
    border: "border-slate-200",
    bg: "bg-slate-50/70",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700 border-slate-200",
    titleColor: "text-slate-900",
    icon: "🟢",
    label: "Insight",
  },
};

export function SmartRecommendations({
  products,
  orders,
}: SmartRecommendationsProps) {
  const recommendations = generateSmartRecommendations(products, orders);

  const criticalCount = recommendations.filter(
    (r) => r.priority === "critical"
  ).length;

  const highCount = recommendations.filter(
    (r) => r.priority === "high"
  ).length;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between bg-surface">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
                🧠
              </span>
              Smart Product Recommendations
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
              Data Engine
            </span>
            {criticalCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800 animate-pulse">
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                {highCount} High
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Data-driven business recommendations derived from real customer orders and inventory levels.
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-slate-100"
        >
          View Orders →
        </Link>
      </div>

      {/* Content Area */}
      {recommendations.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
            📊
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">
            Awaiting Customer Order Data
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted">
            More completed sales data is needed to generate personalized product recommendations and co-purchasing insights.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/orders"
              className="rounded-lg bg-brand-green px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              Create Orders
            </Link>
            <Link
              href="/dashboard/products"
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-slate-50 transition-colors"
            >
              Manage Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* Recommendations Grid */
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const style = PRIORITY_STYLES[rec.priority];

              return (
                <div
                  key={rec.id}
                  className={`flex flex-col justify-between rounded-xl border p-4.5 transition-all hover:shadow-md ${style.border} ${style.bg}`}
                >
                  <div>
                    {/* Header Row: Priority & Type Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
                      >
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </span>

                      {rec.categoryName && (
                        <span className="text-[10px] font-semibold text-slate-600 rounded bg-surface px-2 py-0.5 border border-border truncate max-w-[120px]">
                          {rec.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Recommendation Title */}
                    <h3 className={`mt-3 text-sm font-bold ${style.titleColor}`}>
                      {rec.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                      {rec.description}
                    </p>

                    {/* Reason Section */}
                    <div className="mt-3 rounded-md bg-surface/80 p-2 border border-border/80 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">Why: </span>
                      <span>{rec.reason}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  {rec.action && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] text-muted">
                        Verified from Supabase data
                      </span>
                      <Link
                        href={rec.action.href}
                        className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                      >
                        <span>{rec.action.label}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
