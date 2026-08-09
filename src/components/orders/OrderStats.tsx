"use client";

import { Order } from "@/lib/orders";

type OrderStatsProps = {
  orders: Order[];
};

export function OrderStats({ orders }: OrderStatsProps) {
  const totalOrders = orders.length;

  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Orders */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Orders
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-sm">
            🛒
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {totalOrders}
          </span>
          <span className="text-xs text-muted">orders</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">All historical customer orders</p>
      </div>

      {/* 2. Completed Orders */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Completed Orders
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-brand-green font-semibold text-sm">
            ✅
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {completedOrders}
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            {totalOrders > 0
              ? `${Math.round((completedOrders / totalOrders) * 100)}%`
              : "0%"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Inventory deducted & finalized</p>
      </div>

      {/* 3. Pending Orders */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Pending Orders
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-semibold text-sm">
            ⏳
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-amber-700">
            {pendingOrders}
          </span>
          <span className="text-xs font-bold text-amber-700">
            Awaiting Fulfillment
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">Orders awaiting completion</p>
      </div>

      {/* 4. Total Order Revenue */}
      <div className="group rounded-xl border border-border bg-surface p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Completed Revenue
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green font-semibold text-sm">
            💰
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground font-mono">
            {totalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-bold text-brand-green font-sans">
            ETB
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">From finalized customer orders</p>
      </div>
    </div>
  );
}
