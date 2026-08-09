"use client";

import Link from "next/link";
import { Order, OrderStatus } from "@/lib/orders";

type RecentOrdersTableProps = {
  orders: Order[];
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const recentOrders = orders.slice(0, 5);

  function formatDate(isoString: string) {
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  const statusBadgeStyles: Record<OrderStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
                🛍️
              </span>
              Recent Customer Orders
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Latest sales orders placed in Smart Commerce Ethiopia.
            </p>
          </div>

          <Link
            href="/dashboard/orders"
            className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
          >
            All Orders →
          </Link>
        </div>

        {/* Content */}
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-muted">
              🛒
            </div>
            <h4 className="mt-3 text-xs font-bold text-foreground">
              No customer orders yet
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-muted">
              Create orders in the Orders section to process customer transactions.
            </p>
            <Link
              href="/dashboard/orders"
              className="mt-4 rounded-lg bg-brand-green px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              Create First Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50/70 font-semibold uppercase tracking-wider text-muted">
                  <th scope="col" className="py-3 pl-5 pr-3">
                    Order ID
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Total (ETB)
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Status
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-5 text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pl-5 pr-3 font-semibold text-foreground whitespace-nowrap">
                      <span className="font-mono text-foreground">
                        #{order.id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-foreground whitespace-nowrap">
                      {order.customer ? order.customer.name : "Walk-in Customer"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {Number(order.total_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] text-brand-green font-sans">
                        ETB
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          statusBadgeStyles[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right text-muted text-[11px] whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recentOrders.length > 0 && (
        <div className="p-3 border-t border-border bg-slate-50/50 text-center">
          <Link
            href="/dashboard/orders"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            Manage all {orders.length} orders →
          </Link>
        </div>
      )}
    </div>
  );
}
