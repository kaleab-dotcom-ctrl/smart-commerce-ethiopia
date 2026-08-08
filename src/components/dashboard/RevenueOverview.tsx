"use client";

import { Sale } from "@/lib/sales";

type RevenueOverviewProps = {
  sales: Sale[];
};

type DailyRevenue = {
  dateStr: string; // ISO date string YYYY-MM-DD
  label: string;   // e.g. "Thu, Aug 7"
  isToday: boolean;
  revenue: number;
  salesCount: number;
};

export function RevenueOverview({ sales }: RevenueOverviewProps) {
  // Generate last 7 days array
  const last7Days: DailyRevenue[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${date}`;

    const label =
      i === 0
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    last7Days.push({
      dateStr,
      label,
      isToday: i === 0,
      revenue: 0,
      salesCount: 0,
    });
  }

  // Aggregate sales into last7Days
  sales.forEach((s) => {
    try {
      const saleDate = new Date(s.created_at);
      const year = saleDate.getFullYear();
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const date = String(saleDate.getDate()).padStart(2, "0");
      const saleDateStr = `${year}-${month}-${date}`;

      const dayObj = last7Days.find((d) => d.dateStr === saleDateStr);
      if (dayObj) {
        dayObj.revenue += Number(s.total_price) || 0;
        dayObj.salesCount += 1;
      }
    } catch {
      // Ignore invalid date strings
    }
  });

  const total7DayRevenue = last7Days.reduce((sum, d) => sum + d.revenue, 0);
  const total7DaySales = last7Days.reduce((sum, d) => sum + d.salesCount, 0);
  const maxRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-brand-green text-sm">
              📊
            </span>
            Revenue Overview (Last 7 Days)
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Daily income trends in ETB over the past week.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-brand-green inline-block" />
            <span className="text-muted font-medium">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-200 inline-block" />
            <span className="text-muted font-medium">Previous Days</span>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted font-medium">7-Day Total Revenue</div>
          <div className="text-lg font-bold text-foreground font-mono mt-0.5">
            {total7DayRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-sans text-brand-green">ETB</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted font-medium">Weekly Orders</div>
          <div className="text-lg font-bold text-foreground mt-0.5">
            {total7DaySales} <span className="text-xs font-normal text-muted">sales</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <div className="text-xs text-muted font-medium">Avg. Order Value</div>
          <div className="text-lg font-bold text-foreground font-mono mt-0.5">
            {(total7DaySales > 0 ? total7DayRevenue / total7DaySales : 0).toLocaleString(
              "en-US",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}{" "}
            <span className="text-xs font-sans text-brand-green">ETB</span>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="pt-2">
        <div className="grid h-48 grid-cols-7 items-end gap-2 sm:gap-4 border-b border-border pb-3">
          {last7Days.map((day) => {
            const heightPercent =
              day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 8) : 4;

            return (
              <div
                key={day.dateStr}
                className="group relative flex h-full flex-col justify-end items-center"
              >
                {/* Tooltip / Value on Top */}
                <div className="mb-1 text-center opacity-90 transition-opacity">
                  <span className="text-[10px] font-mono font-semibold text-slate-700 block sm:text-xs">
                    {day.revenue > 0
                      ? day.revenue.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })
                      : "0"}
                  </span>
                </div>

                {/* Bar Element */}
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
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
                <div className="mt-2 text-center">
                  <span
                    className={`text-[10px] sm:text-xs block font-medium ${
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
          <span>Amounts shown in ETB</span>
          <span>Updated real-time from Supabase</span>
        </div>
      </div>
    </div>
  );
}
