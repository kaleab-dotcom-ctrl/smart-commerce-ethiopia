"use client";

import { useState } from "react";
import { Sale, deleteSale } from "@/lib/sales";

type SalesTableProps = {
  sales: Sale[];
  onSaleDeleted: () => void;
};

export function SalesTable({ sales, onSaleDeleted }: SalesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter sales by product name search term
  const filteredSales = sales.filter((s) =>
    s.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleDelete(id: string, productName: string) {
    setDeleteError(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete the sale record for "${productName}"?`
    );

    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await deleteSale(id);
      if (error) {
        setDeleteError(error.message || "Failed to delete sale.");
        return;
      }
      onSaleDeleted();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An error occurred while deleting.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        year: "numeric",
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
      {/* Toolbar Header */}
      <div className="flex flex-col gap-3 p-5 border-b border-border sm:flex-row sm:items-center sm:justify-between bg-surface">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            Sales History
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-muted">
              {filteredSales.length} {filteredSales.length === 1 ? "record" : "records"}
            </span>
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sales by product..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3.5 text-xs text-foreground placeholder:text-muted/60 transition-colors focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="m-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          <span>⚠️ {deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-xs underline hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-muted">
            🛒
          </div>
          <h4 className="mt-4 text-sm font-bold text-foreground">
            {sales.length === 0
              ? "No sales recorded yet"
              : "No matching sales found"}
          </h4>
          <p className="mt-1 max-w-sm text-xs text-muted">
            {sales.length === 0
              ? "Use the form above to record your first sale in Smart Commerce Ethiopia."
              : "Try adjusting your search query."}
          </p>
        </div>
      ) : (
        /* Sales Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3.5 pl-6 pr-4">
                  Product
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Quantity
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Total Price (ETB)
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Date & Time
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredSales.map((sale) => {
                const isDeleting = deletingId === sale.id;

                return (
                  <tr
                    key={sale.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    {/* Product Name */}
                    <td className="py-4 pl-6 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-brand-green font-bold text-xs uppercase">
                          {sale.product_name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {sale.product_name}
                          </div>
                          <div className="text-[11px] text-muted">
                            Sale ID: {sale.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-bold text-brand-green">
                        {sale.quantity} {sale.quantity === 1 ? "unit" : "units"}
                      </span>
                    </td>

                    {/* Total Price */}
                    <td className="px-4 py-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {Number(sale.total_price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-brand-green font-sans font-bold">
                        ETB
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">
                      {formatDate(sale.created_at)}
                    </td>

                    {/* Delete Action */}
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(sale.id, sale.product_name)}
                        disabled={isDeleting}
                        title="Delete Sale Record"
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Deleting…
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            🗑️ Delete
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
