"use client";

import { Order } from "@/lib/orders";
import { getStatusBreakdown } from "@/lib/analytics";

type OrderStatusSummaryProps = {
  orders: Order[];
};

export function OrderStatusSummary({ orders }: OrderStatusSummaryProps) {
  const breakdown = getStatusBreakdown(orders);
  const totalCount = breakdown.totalOrdersCount;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
              📋
            </span>
            Order Status Summary
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Breakdown across fulfillment lifecycle.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-muted">
          {totalCount} {totalCount === 1 ? "order" : "orders"} total
        </span>
      </div>

      {totalCount === 0 ? (
        <div className="py-6 text-center text-xs text-muted">
          No orders created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Completed */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                Completed
              </span>
              <span className="text-xs font-bold text-emerald-700">✅</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-950">
                {breakdown.completedCount}
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {Math.round((breakdown.completedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-emerald-900 pt-1 border-t border-emerald-200">
              {breakdown.completedRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ETB realized
            </div>
          </div>

          {/* Pending */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Pending
              </span>
              <span className="text-xs font-bold text-amber-700">⏳</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-amber-950">
                {breakdown.pendingCount}
              </span>
              <span className="text-xs font-bold text-amber-800">
                {Math.round((breakdown.pendingCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-amber-900 pt-1 border-t border-amber-200">
              {breakdown.pendingAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ETB unfulfilled
            </div>
          </div>

          {/* Cancelled */}
          <div className="rounded-lg border border-slate-200 bg-slate-100/70 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Cancelled
              </span>
              <span className="text-xs font-bold text-slate-500">🚫</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-800">
                {breakdown.cancelledCount}
              </span>
              <span className="text-xs font-bold text-slate-600">
                {Math.round((breakdown.cancelledCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200">
              {breakdown.cancelledAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ETB cancelled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
