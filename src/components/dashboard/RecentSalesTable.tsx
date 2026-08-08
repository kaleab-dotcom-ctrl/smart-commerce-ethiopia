"use client";

import Link from "next/link";
import { Sale } from "@/lib/sales";

type RecentSalesTableProps = {
  sales: Sale[];
};

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  // Show latest 5 sales
  const recentSales = sales.slice(0, 5);

  function formatDate(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
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
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
                🕒
              </span>
              Recent Sales
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Latest 5 customer transactions.
            </p>
          </div>

          <Link
            href="/dashboard/sales"
            className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
          >
            View All Sales →
          </Link>
        </div>

        {/* Content */}
        {recentSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-muted">
              🛒
            </div>
            <h4 className="mt-3 text-xs font-bold text-foreground">
              No sales recorded yet
            </h4>
            <p className="mt-1 max-w-xs text-[11px] text-muted">
              Start recording sales to track orders and revenue in real-time.
            </p>
            <Link
              href="/dashboard/sales"
              className="mt-4 rounded-lg bg-brand-green px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              Record First Sale
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-slate-50/70 font-semibold uppercase tracking-wider text-muted">
                  <th scope="col" className="py-3 pl-5 pr-3">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Quantity
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Total
                  </th>
                  <th scope="col" className="py-3 pl-3 pr-5 text-right">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Product */}
                    <td className="py-3 pl-5 pr-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          {sale.product_name.substring(0, 2)}
                        </span>
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                          {sale.product_name}
                        </span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                        {sale.quantity} units
                      </span>
                    </td>

                    {/* Total (ETB) */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {Number(sale.total_price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] text-brand-green font-sans font-bold">
                        ETB
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 pl-3 pr-5 text-right text-muted text-[11px] whitespace-nowrap">
                      {formatDate(sale.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recentSales.length > 0 && (
        <div className="p-3 border-t border-border bg-slate-50/50 text-center">
          <Link
            href="/dashboard/sales"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            View complete sales history ({sales.length} transactions) →
          </Link>
        </div>
      )}
    </div>
  );
}
