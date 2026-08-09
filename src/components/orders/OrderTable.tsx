"use client";

import { useState, useMemo } from "react";
import { Order, OrderStatus, updateOrderStatus } from "@/lib/orders";
import { OrderDetailsModal } from "./OrderDetailsModal";

type OrderTableProps = {
  orders: Order[];
  onOrderUpdated: () => void;
  onOpenCreateModal?: () => void;
};

export function OrderTable({
  orders,
  onOrderUpdated,
  onOpenCreateModal,
}: OrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter & Search pipeline
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // 2. Search Term Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const custName = order.customer?.name?.toLowerCase() || "";
        const orderId = order.id.toLowerCase();
        const itemNames = (order.items || [])
          .map((i) => i.product_name?.toLowerCase() || "")
          .join(" ");

        return (
          custName.includes(query) ||
          orderId.includes(query) ||
          itemNames.includes(query)
        );
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  async function handleQuickComplete(orderId: string) {
    setActionError(null);
    setUpdatingId(orderId);
    try {
      const { error } = await updateOrderStatus(orderId, "completed");
      if (error) {
        setActionError(error.message || "Failed to complete order.");
      } else {
        onOrderUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setActionError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

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
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm">
                📋
              </span>
              Order History & Fulfillment
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>

          {onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              <span>+ Create Order</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Search Box */}
          <div className="relative sm:col-span-8">
            <input
              type="text"
              placeholder="Search by customer name, order ID, or product name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-xs font-medium text-foreground placeholder:text-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            <span className="absolute left-3 top-2.5 text-xs text-muted">🔍</span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-xs font-bold text-muted hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="all">Filter: All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="m-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <span>⚠️ {actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table Content */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-muted">
            🛒
          </div>
          <h4 className="mt-3 text-sm font-bold text-foreground">
            {orders.length === 0 ? "No orders recorded yet" : "No matching orders found"}
          </h4>
          <p className="mt-1 max-w-sm text-xs text-muted">
            {orders.length === 0
              ? "Use the Create Order button above to place your first order."
              : "Try adjusting your search query or status filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3.5 pl-6 pr-3">
                  Order ID
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3.5 text-right">
                  Total (ETB)
                </th>
                <th scope="col" className="px-3 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-right">
                  Date
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredOrders.map((order) => {
                const isUpdating = updatingId === order.id;

                return (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 pl-6 pr-3 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          #{order.id.substring(0, 2)}
                        </span>
                        <div>
                          <span className="font-mono text-foreground font-bold">
                            #{order.id.substring(0, 8)}
                          </span>
                          <span className="block text-[10px] text-muted font-normal">
                            {order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {order.customer ? order.customer.name : "Walk-in Customer"}
                      </div>
                      {order.customer?.phone && (
                        <div className="text-[10px] text-muted">
                          {order.customer.phone}
                        </div>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="px-3 py-3.5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {Number(order.total_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] text-brand-green font-sans">
                        ETB
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border uppercase tracking-wider ${
                          statusBadgeStyles[order.status]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3.5 text-right text-muted whitespace-nowrap text-[11px]">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleQuickComplete(order.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-brand-green hover:bg-brand-green hover:text-white transition-colors disabled:opacity-60"
                            title="Complete Order & Deduct Inventory"
                          >
                            {isUpdating ? "Finalizing…" : "Complete"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors"
                        >
                          Details →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={onOrderUpdated}
        />
      )}
    </div>
  );
}
