import { Container } from "@/components/ui/Container";

type StatCard = {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
};

const stats: StatCard[] = [
  {
    label: "Revenue",
    value: "ETB 284,500",
    change: "+12.5% vs last month",
    changeType: "positive",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Products",
    value: "1,248",
    change: "32 added this week",
    changeType: "neutral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Orders",
    value: "386",
    change: "+8.2% vs last week",
    changeType: "positive",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Low Stock Alerts",
    value: "7",
    change: "Items need reorder",
    changeType: "negative",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const lowStockItems = [
  { name: "Ethiopian Coffee Beans (1kg)", stock: 4, threshold: 20 },
  { name: "Teff Flour (25kg)", stock: 8, threshold: 15 },
  { name: "Spice Mix — Berbere", stock: 3, threshold: 10 },
];

const changeColors = {
  positive: "text-emerald-600",
  negative: "text-red-500",
  neutral: "text-muted",
};

function StatCardComponent({ label, value, change, changeType, icon }: StatCard) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="text-muted">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className={`mt-1 text-xs font-medium ${changeColors[changeType]}`}>
        {change}
      </p>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <section id="solutions" className="bg-surface py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-green">
              Dashboard Preview
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your business at a glance
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Monitor revenue, inventory, and orders from a single intuitive
              dashboard. Get instant alerts when stock runs low so you never miss
              a sale.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Real-time sync across all your locations",
                "ETB currency with local tax support",
                "Export reports for accountants and banks",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div id="demo" className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-green/10 to-brand-gold/10 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-medium text-muted">
                  Smart Commerce Dashboard
                </span>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {stats.map((stat) => (
                    <StatCardComponent key={stat.label} {...stat} />
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-red-500" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h4 className="text-sm font-semibold text-red-700">
                      Low Stock Alerts
                    </h4>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {lowStockItems.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs sm:text-sm"
                      >
                        <span className="truncate font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {item.stock} left
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex h-24 items-end gap-1.5 rounded-xl bg-slate-50 p-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                    (height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-brand-green/80 transition-all"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
                <p className="mt-2 text-center text-xs text-muted">
                  Monthly revenue trend
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
