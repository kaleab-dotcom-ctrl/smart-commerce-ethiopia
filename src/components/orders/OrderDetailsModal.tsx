"use client";

import { Order, OrderStatus, updateOrderStatus } from "@/lib/orders";
import { useState } from "react";

type OrderDetailsModalProps = {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: () => void;
};

export function OrderDetailsModal({
  order,
  onClose,
  onOrderUpdated,
}: OrderDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!order) return null;

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    setErrorMsg(null);
    setIsUpdating(true);

    try {
      const { error } = await updateOrderStatus(order.id, newStatus);
      if (error) {
        setErrorMsg(error.message || "Failed to update order status.");
        return;
      }
      onOrderUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsUpdating(false);
    }
  }

  function formatDate(isoString: string) {
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  const statusStyles: Record<OrderStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Order #{order.id.substring(0, 8)}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border uppercase tracking-wider ${
                  statusStyles[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-foreground text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="font-bold underline text-red-800 text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Customer Info */}
          <div className="rounded-lg border border-border bg-surface p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Customer Info
            </span>
            <div className="text-xs font-bold text-foreground">
              {order.customer ? order.customer.name : "Walk-in / Cash Customer"}
            </div>
            {order.customer?.phone && (
              <div className="text-xs text-muted">📞 {order.customer.phone}</div>
            )}
            {order.customer?.email && (
              <div className="text-xs text-muted">✉️ {order.customer.email}</div>
            )}
          </div>

          {/* Order Items Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Ordered Items ({order.items?.length || 0})
            </span>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50 font-semibold text-muted uppercase tracking-wider">
                    <th className="py-2.5 pl-4 pr-2">Item</th>
                    <th className="px-2 py-2.5 text-right">Price</th>
                    <th className="px-2 py-2.5 text-center">Qty</th>
                    <th className="py-2.5 pl-2 pr-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {(order.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pl-4 pr-2 font-semibold text-foreground">
                        {item.product_name}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {Number(item.unit_price).toFixed(2)} ETB
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-right font-mono font-bold text-brand-green">
                        {Number(item.subtotal).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase text-foreground">
              Total Order Amount
            </span>
            <span className="text-base font-bold font-mono text-brand-green">
              {Number(order.total_amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
              ETB
            </span>
          </div>

          {/* Status Change Actions */}
          {order.status === "pending" && (
            <div className="space-y-2 border-t border-border pt-4">
              <span className="text-[11px] text-muted block">
                Update Status (Completing deducts product stock):
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange("completed")}
                  className="flex-1 rounded-lg bg-brand-green px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-dark disabled:opacity-60 transition-colors"
                >
                  {isUpdating ? "Completing…" : "✅ Mark Completed"}
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange("cancelled")}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-slate-50/50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
