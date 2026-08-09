"use client";

import { Order } from "@/lib/orders";
import {
  getCompletedOrders,
  getTotalRevenue,
  getCompletedOrdersCount,
  getUnitsSold,
  getAverageOrderValue,
} from "@/lib/analytics";

type SalesKpiCardsProps = {
  orders: Order[];
};

export function SalesKpiCards({ orders }: SalesKpiCardsProps) {
  const completedOrders = getCompletedOrders(orders);

  const totalRevenue = getTotalRevenue(completedOrders);
  const completedCount = getCompletedOrdersCount(completedOrders);
  const unitsSold = getUnitsSold(completedOrders);
  const aov = getAverageOrderValue(completedOrders);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Revenue */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Revenue
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-brand-green font-semibold text-sm">
            💰
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-foreground">
            {totalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-brand-green font-sans">
            ETB
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          From {completedCount} completed {completedCount === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* 2. Completed Orders */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-blue-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Completed Orders
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-sm">
            ✅
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {completedCount}
          </span>
          <span className="text-xs font-medium text-muted">
            {orders.length > 0
              ? `${Math.round((completedCount / orders.length) * 100)}% of total`
              : "0 orders"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Fulfillments finalized</p>
      </div>

      {/* 3. Units Sold */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-purple-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Units Sold
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-semibold text-sm">
            📦
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {unitsSold.toLocaleString("en-US")}
          </span>
          <span className="text-xs font-medium text-muted">units</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Items shipped to customers</p>
      </div>

      {/* 4. Average Order Value (AOV) */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Avg. Order Value (AOV)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-semibold text-sm">
            📈
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-foreground">
            {aov.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-brand-green font-sans">
            ETB
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Average spend per order</p>
      </div>
    </div>
  );
}
