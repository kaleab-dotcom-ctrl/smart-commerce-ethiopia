"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";
import {
  detectAnomalies,
  AnomalySeverity,
  AnomalyType,
} from "@/lib/anomalies";

type AnomalyDetectionProps = {
  products: Product[];
  orders: Order[];
};

const SEVERITY_STYLES: Record<
  AnomalySeverity,
  {
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    icon: string;
    label: string;
  }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    badgeBg: "bg-red-100",
    badgeText: "text-red-900 border-red-200",
    icon: "🔴",
    label: "Critical",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900 border-amber-200",
    icon: "🟠",
    label: "Warning",
  },
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-900 border-blue-200",
    icon: "🔵",
    label: "Info",
  },
};

const TYPE_LABELS: Record<AnomalyType, string> = {
  large_order: "Unusually Large Order",
  unusual_quantity: "Unusual Item Quantity",
  high_value_order: "High-Value Order",
  rapid_orders: "Rapid Repeated Orders",
  sales_spike: "Unusual Sales Spike",
  inventory_risk: "Unusual Inventory Risk",
};

export function AnomalyDetection({ products, orders }: AnomalyDetectionProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { anomalies, summary } = useMemo(
    () => detectAnomalies(products, orders),
    [products, orders]
  );

  const filteredAnomalies = useMemo(() => {
    if (severityFilter === "all") return anomalies;
    return anomalies.filter((a) => a.severity === severityFilter);
  }, [anomalies, severityFilter]);

  function formatDate(isoString?: string) {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 text-sm">
                  🛡️
                </span>
                Fraud & Anomaly Detection
              </h2>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                Rule-Based Security
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Potentially unusual activity requiring human review — not automated fraud decisions.
            </p>
          </div>

          {/* Filter Pills */}
          {summary.hasSufficientData && (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-slate-50 p-1">
              {[
                { key: "all", label: `All (${anomalies.length})` },
                { key: "critical", label: `Critical (${summary.criticalCount})` },
                { key: "warning", label: `Warning (${summary.warningCount})` },
                { key: "info", label: `Info (${summary.infoCount})` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSeverityFilter(item.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    severityFilter === item.key
                      ? "bg-surface text-foreground shadow-xs font-bold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Insufficient Data Banner */}
        {!summary.hasSufficientData && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <span className="text-base">ℹ️</span>
            <div>
              <div className="font-bold text-blue-950">
                More transaction history needed for anomaly detection.
              </div>
              <div className="mt-0.5 text-[11px] text-blue-800">
                At least {summary.minOrdersRequired} completed orders are required to establish statistical baselines. Current completed orders: {summary.historyOrderCount}.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!summary.hasSufficientData ? (
        <div className="py-10 text-center text-xs text-muted flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">📊</span>
          <p className="font-bold text-foreground">Statistical Baseline Pending</p>
          <p className="mt-1 max-w-xs text-[11px]">
            Complete customer orders to automatically build statistical thresholds for order values, volumes, and velocity.
          </p>
        </div>
      ) : filteredAnomalies.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">✅</span>
          <p className="font-bold text-foreground">No unusual activity detected</p>
          <p className="mt-1 max-w-sm text-[11px]">
            {severityFilter === "all"
              ? "Current order and inventory activity are within observed historical patterns."
              : `No anomalies matching filter "${severityFilter}".`}
          </p>
        </div>
      ) : (
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnomalies.map((anomaly) => {
              const style = SEVERITY_STYLES[anomaly.severity];

              return (
                <div
                  key={anomaly.id}
                  className={`flex flex-col justify-between rounded-xl border p-4.5 transition-all hover:shadow-md ${style.border} ${style.bg}`}
                >
                  <div>
                    {/* Header Row: Severity & Type */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
                      >
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </span>

                      <span className="text-[10px] font-semibold text-slate-600 rounded bg-surface px-2 py-0.5 border border-border">
                        {TYPE_LABELS[anomaly.type] || anomaly.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 text-sm font-bold text-foreground">
                      {anomaly.title}
                    </h3>

                    {/* Timestamp / Context */}
                    {anomaly.timestamp && (
                      <span className="text-[10px] text-muted block mt-0.5">
                        Recorded on {formatDate(anomaly.timestamp)}
                      </span>
                    )}

                    {/* Description */}
                    <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                      {anomaly.description}
                    </p>

                    {/* Why Flagged Callout */}
                    <div className="mt-3 rounded-md bg-surface/80 p-2.5 border border-border/80 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">
                        Why Flagged:
                      </div>
                      <p className="text-[11px] text-slate-700">
                        {anomaly.whyFlagged}
                      </p>

                      {anomaly.metrics && (
                        <div className="pt-1.5 mt-1 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
                          <span>Observed: {anomaly.metrics.observedValue.toLocaleString("en-US", { maximumFractionDigits: 1 })} {anomaly.metrics.unit}</span>
                          <span>Baseline: {anomaly.metrics.baselineValue.toLocaleString("en-US", { maximumFractionDigits: 1 })} {anomaly.metrics.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Link */}
                  {anomaly.action && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] text-muted">
                        Requires Review
                      </span>
                      <Link
                        href={anomaly.action.href}
                        className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                      >
                        <span>{anomaly.action.label}</span>
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
