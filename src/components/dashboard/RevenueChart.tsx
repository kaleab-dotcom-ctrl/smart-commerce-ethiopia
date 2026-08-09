"use client";

import { Order } from "@/lib/orders";
import {
  DateRange,
  getCompletedOrders,
  getDailyMetrics,
  getTotalRevenue,
} from "@/lib/analytics";

type RevenueChartProps = {
  orders: Order[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
};

export function RevenueChart({
  orders,
  dateRange,
  onDateRangeChange,
}: RevenueChartProps) {
  const completedOrders = getCompletedOrders(orders);
  const dailyMetrics = getDailyMetrics(completedOrders, dateRange);

  const rangeTotalRevenue = dailyMetrics.reduce((sum, d) => sum + d.revenue, 0);
  const rangeTotalOrders = dailyMetrics.reduce((sum, d) => sum + d.orderCount, 0);
  const maxRevenue = Math.max(...dailyMetrics.map((d) => d.revenue), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      {/* Header with Date Range Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green text-sm">
              📊
            </span>
            Revenue & Sales Trend
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Realized income from completed customer orders in ETB.
          </p>
        </div>

        {/* Date Range Selector Buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-slate-50 p-1">
          {(
            [
              { key: "7d", label: "7 Days" },
              { key: "30d", label: "30 Days" },
              { key: "90d", label: "90 Days" },
              { key: "all", label: "All Time" },
            ] as { key: DateRange; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onDateRangeChange(item.key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                dateRange === item.key
                  ? "bg-surface text-brand-green shadow-xs font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Summary Banner */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted font-medium">Period Revenue</div>
          <div className="text-lg font-bold text-foreground font-mono mt-0.5">
            {rangeTotalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-sans text-brand-green">ETB</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted font-medium">Completed Orders</div>
          <div className="text-lg font-bold text-foreground mt-0.5">
            {rangeTotalOrders}{" "}
            <span className="text-xs font-normal text-muted">orders</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <div className="text-xs text-muted font-medium">Average / Day</div>
          <div className="text-lg font-bold text-foreground font-mono mt-0.5">
            {(
              dailyMetrics.length > 0 ? rangeTotalRevenue / dailyMetrics.length : 0
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-sans text-brand-green">ETB</span>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      {dailyMetrics.every((d) => d.revenue === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-muted">
            📈
          </div>
          <h4 className="mt-3 text-xs font-bold text-foreground">
            No completed revenue in this period
          </h4>
          <p className="mt-1 max-w-xs text-[11px] text-muted">
            Revenue will populate here as customer orders are marked as completed.
          </p>
        </div>
      ) : (
        <div className="pt-2">
          <div className="grid h-48 items-end gap-1.5 sm:gap-3 border-b border-border pb-3"
            style={{
              gridTemplateColumns: `repeat(${dailyMetrics.length}, minmax(0, 1fr))`,
            }}
          >
            {dailyMetrics.map((day) => {
              const heightPercent =
                day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 8) : 4;

              return (
                <div
                  key={day.dateStr}
                  className="group relative flex h-full flex-col justify-end items-center"
                >
                  {/* Tooltip / Numeric Value */}
                  <div className="mb-1 text-center opacity-90 transition-opacity">
                    <span className="text-[9px] sm:text-[11px] font-mono font-semibold text-slate-700 block truncate max-w-[40px] sm:max-w-none">
                      {day.revenue > 0
                        ? day.revenue.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        : "0"}
                    </span>
                  </div>

                  {/* Bar Element */}
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full transition-all duration-500 rounded-t-md ${
                        day.isToday
                          ? "bg-brand-green shadow-xs shadow-brand-green/30"
                          : day.revenue > 0
                          ? "bg-emerald-400 group-hover:bg-brand-green"
                          : "bg-slate-200"
                      }`}
                    />
                  </div>

                  {/* Date Label */}
                  <div className="mt-2 text-center overflow-hidden w-full">
                    <span
                      className={`text-[9px] sm:text-[11px] block font-medium truncate ${
                        day.isToday
                          ? "font-bold text-brand-green"
                          : "text-muted"
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
            <span>Only completed orders generate revenue</span>
            <span>Amounts in ETB</span>
          </div>
        </div>
      )}
    </div>
  );
}
