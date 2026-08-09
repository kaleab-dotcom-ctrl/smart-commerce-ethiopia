"use client";

import { useState, useMemo } from "react";
import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";
import {
  generateAllProductForecasts,
  ProductDemandForecast,
  ReorderStatus,
  DataQuality,
} from "@/lib/forecasting";

type DemandForecastProps = {
  products: Product[];
  orders: Order[];
};

export function DemandForecast({ products, orders }: DemandForecastProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  const { forecasts, summary } = useMemo(
    () => generateAllProductForecasts(products, orders),
    [products, orders]
  );

  // Selected product forecast (if specific product chosen)
  const selectedForecast = useMemo(() => {
    if (selectedProductId === "all") return null;
    return forecasts.find((f) => f.productId === selectedProductId) || null;
  }, [forecasts, selectedProductId]);

  const maxChartUnits = useMemo(() => {
    if (selectedForecast) {
      return Math.max(...selectedForecast.dailyPoints.map((p) => p.units), 1);
    }
    return 1;
  }, [selectedForecast]);

  const statusStyles: Record<
    ReorderStatus,
    { badge: string; text: string; icon: string }
  > = {
    out_of_stock: {
      badge: "bg-red-100 text-red-800 border-red-200",
      text: "text-red-950",
      icon: "🚨",
    },
    critical: {
      badge: "bg-red-100 text-red-800 border-red-200",
      text: "text-red-950",
      icon: "⚠️",
    },
    warning: {
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      text: "text-amber-950",
      icon: "⚡",
    },
    healthy: {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      text: "text-emerald-950",
      icon: "✅",
    },
    no_demand: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      text: "text-slate-900",
      icon: "ℹ️",
    },
  };

  const qualityStyles: Record<DataQuality, string> = {
    Low: "bg-amber-50 text-amber-700 border-amber-200",
    Medium: "bg-blue-50 text-blue-700 border-blue-200",
    Higher: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green text-sm">
                  📈
                </span>
                Demand Forecasting & Inventory Planning
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-green">
                Moving Average Model
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Data-driven demand projections derived from completed order history.
            </p>
          </div>

          {/* Product Selector Dropdown */}
          <div className="w-full sm:w-64">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="all">View All Products Summary</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.quantity} in stock)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Requirement Warning Banner */}
        {!summary.hasSufficientOverallData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <div className="font-bold text-amber-950">
                Not enough historical sales data to generate a reliable forecast.
              </div>
              <div className="mt-0.5 text-[11px] text-amber-800">
                Your store currently has {summary.historySpanDays} {summary.historySpanDays === 1 ? "day" : "days"} of completed order history. At least 7 days of sales observations are required. More completed sales over time will improve forecast accuracy.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {products.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">📦</span>
          <p className="font-bold text-foreground">No products available</p>
          <p className="mt-1 max-w-xs text-[11px]">
            Add products to your catalog to enable inventory planning.
          </p>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Selected Product KPI Cards (If single product selected) */}
          {selectedForecast && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Forecast Deep-Dive: {selectedForecast.productName}
                  </h3>
                  <span className="text-xs text-muted">
                    ({selectedForecast.category})
                  </span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                    qualityStyles[selectedForecast.dataQuality]
                  }`}
                >
                  Reliability: {selectedForecast.dataQuality}
                </span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Current Stock */}
                <div className="rounded-lg border border-border bg-surface p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                    Current Stock
                  </span>
                  <span className="text-xl font-bold text-foreground mt-1 block">
                    {selectedForecast.currentStock} units
                  </span>
                </div>

                {/* Avg Daily Demand */}
                <div className="rounded-lg border border-border bg-surface p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                    Avg Daily Demand
                  </span>
                  <span className="text-xl font-bold text-foreground mt-1 block">
                    {selectedForecast.averageDailyDemand} /day
                  </span>
                </div>

                {/* 7-Day Forecast */}
                <div className="rounded-lg border border-border bg-surface p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                    7-Day Forecast
                  </span>
                  <span className="text-xl font-bold text-brand-green mt-1 block">
                    ~{selectedForecast.forecast7Days} units
                  </span>
                </div>

                {/* Stock Coverage */}
                <div className="rounded-lg border border-border bg-surface p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                    Stock Coverage
                  </span>
                  <span className="text-xl font-bold text-foreground mt-1 block">
                    {selectedForecast.estimatedDaysCoverage !== null
                      ? `~${selectedForecast.estimatedDaysCoverage} days`
                      : "No demand"}
                  </span>
                </div>
              </div>

              {/* Recommendation Box */}
              <div
                className={`rounded-lg border p-3.5 text-xs flex items-start gap-2.5 ${
                  statusStyles[selectedForecast.status].badge
                }`}
              >
                <span className="text-base">
                  {statusStyles[selectedForecast.status].icon}
                </span>
                <div>
                  <div className="font-bold">
                    Reorder Recommendation ({selectedForecast.statusLabel})
                  </div>
                  <div className="mt-0.5 text-[11px]">
                    {selectedForecast.reorderRecommendation}
                  </div>
                </div>
              </div>

              {/* Lightweight Timeline Chart (Historical vs Forecasted) */}
              <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                  <span className="font-bold text-foreground">
                    14-Day Demand Timeline (7-Day History + 7-Day Projected Forecast)
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 inline-block" />
                      <span className="text-muted">Historical Demand</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-xs bg-blue-400 border border-blue-600 border-dashed inline-block" />
                      <span className="text-muted font-semibold">Forecast Projection</span>
                    </div>
                  </div>
                </div>

                <div className="grid h-36 grid-cols-14 items-end gap-1 border-b border-border pb-2 pt-4">
                  {selectedForecast.dailyPoints.map((pt, idx) => {
                    const heightPct =
                      pt.units > 0
                        ? Math.max((pt.units / maxChartUnits) * 100, 8)
                        : 4;

                    return (
                      <div
                        key={idx}
                        className="group relative flex h-full flex-col justify-end items-center"
                      >
                        <span className="text-[9px] font-mono text-slate-700 block mb-1 font-semibold">
                          {pt.units > 0 ? pt.units.toFixed(pt.isForecast ? 1 : 0) : "0"}
                        </span>

                        <div className="w-full max-w-[24px] bg-slate-100 rounded-t overflow-hidden flex flex-col justify-end h-full">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full transition-all duration-300 rounded-t ${
                              pt.isForecast
                                ? "bg-blue-300 border-t-2 border-dashed border-blue-600"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>

                        <span className="mt-1 text-[8px] text-muted block truncate w-full text-center">
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Overall Forecast Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Product Inventory Coverage & Demand Planning ({forecasts.length} SKUs)
              </h3>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50 font-semibold uppercase tracking-wider text-muted">
                    <th scope="col" className="py-3 pl-4 pr-2">
                      Product Name
                    </th>
                    <th scope="col" className="px-2 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      Current Stock
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      Avg Demand / Day
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      7-Day Forecast
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      Stock Coverage
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      Reorder Status
                    </th>
                    <th scope="col" className="py-3 pl-2 pr-4 text-center">
                      Data Quality
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {forecasts.map((f) => {
                    const style = statusStyles[f.status];

                    return (
                      <tr
                        key={f.productId}
                        onClick={() => setSelectedProductId(f.productId)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                          selectedProductId === f.productId ? "bg-slate-50 font-medium" : ""
                        }`}
                      >
                        {/* Product Name */}
                        <td className="py-3 pl-4 pr-2 font-semibold text-foreground">
                          {f.productName}
                        </td>

                        {/* Category */}
                        <td className="px-2 py-3 text-muted whitespace-nowrap">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px]">
                            {f.category}
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="px-2 py-3 text-center font-bold font-mono">
                          {f.currentStock} units
                        </td>

                        {/* Avg Demand */}
                        <td className="px-2 py-3 text-center font-mono">
                          {summary.hasSufficientOverallData
                            ? `${f.averageDailyDemand} /day`
                            : "N/A"}
                        </td>

                        {/* 7-Day Forecast */}
                        <td className="px-2 py-3 text-center font-mono font-bold text-brand-green">
                          {summary.hasSufficientOverallData
                            ? `~${f.forecast7Days} units`
                            : "N/A"}
                        </td>

                        {/* Stock Coverage */}
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          {summary.hasSufficientOverallData ? (
                            f.estimatedDaysCoverage !== null ? (
                              <span className="font-semibold">
                                ~{f.estimatedDaysCoverage} days
                              </span>
                            ) : (
                              <span className="text-muted text-[11px]">No demand</span>
                            )
                          ) : (
                            <span className="text-muted text-[11px]">Insufficient history</span>
                          )}
                        </td>

                        {/* Reorder Status */}
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${style.badge}`}
                          >
                            <span>{style.icon}</span>
                            <span>{f.statusLabel}</span>
                          </span>
                        </td>

                        {/* Data Quality */}
                        <td className="py-3 pl-2 pr-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              qualityStyles[f.dataQuality]
                            }`}
                          >
                            {f.dataQuality}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
