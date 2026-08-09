import { Order } from "@/lib/orders";
import { Product } from "@/lib/products";

export type DateRange = "7d" | "30d" | "90d" | "all";

export type StatusBreakdown = {
  completedCount: number;
  completedRevenue: number;
  pendingCount: number;
  pendingAmount: number;
  cancelledCount: number;
  cancelledAmount: number;
  totalOrdersCount: number;
};

export type DailyMetric = {
  dateStr: string; // YYYY-MM-DD
  label: string;   // Display label (e.g. "Aug 7" or "Today")
  isToday: boolean;
  revenue: number;
  orderCount: number;
  unitsCount: number;
};

export type TopProductMetric = {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueGenerated: number;
};

export type TopCategoryMetric = {
  category: string;
  unitsSold: number;
  revenueGenerated: number;
  percentageOfTotalRevenue: number;
};

// ─── DATE FILTERING HELPER ───────────────────────────────────────────────────

export function filterOrdersByDateRange(
  orders: Order[],
  range: DateRange
): Order[] {
  if (range === "all") return orders;

  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return orders.filter((o) => {
    try {
      const orderDate = new Date(o.created_at);
      return orderDate >= cutoff;
    } catch {
      return true;
    }
  });
}

// ─── COMPLETED ORDERS FILTER ──────────────────────────────────────────────────

export function getCompletedOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === "completed");
}

// ─── KPI CALCULATIONS ────────────────────────────────────────────────────────

/** Total revenue from COMPLETED orders only */
export function getTotalRevenue(completedOrders: Order[]): number {
  return completedOrders.reduce(
    (sum, o) => sum + (Number(o.total_amount) || 0),
    0
  );
}

/** Total completed orders count */
export function getCompletedOrdersCount(completedOrders: Order[]): number {
  return completedOrders.length;
}

/** Total units sold across completed order items */
export function getUnitsSold(completedOrders: Order[]): number {
  return completedOrders.reduce((totalUnits, order) => {
    const itemsUnits = (order.items || []).reduce(
      (itemSum, item) => itemSum + (Number(item.quantity) || 0),
      0
    );
    return totalUnits + itemsUnits;
  }, 0);
}

/** Average Order Value (AOV) = Completed Revenue / Completed Orders */
export function getAverageOrderValue(completedOrders: Order[]): number {
  if (completedOrders.length === 0) return 0;
  const totalRev = getTotalRevenue(completedOrders);
  return totalRev / completedOrders.length;
}

/** Status Breakdown for Order Status Summary */
export function getStatusBreakdown(orders: Order[]): StatusBreakdown {
  const result: StatusBreakdown = {
    completedCount: 0,
    completedRevenue: 0,
    pendingCount: 0,
    pendingAmount: 0,
    cancelledCount: 0,
    cancelledAmount: 0,
    totalOrdersCount: orders.length,
  };

  orders.forEach((o) => {
    const amount = Number(o.total_amount) || 0;
    if (o.status === "completed") {
      result.completedCount += 1;
      result.completedRevenue += amount;
    } else if (o.status === "pending") {
      result.pendingCount += 1;
      result.pendingAmount += amount;
    } else if (o.status === "cancelled") {
      result.cancelledCount += 1;
      result.cancelledAmount += amount;
    }
  });

  return result;
}

// ─── DAILY TREND METRICS ─────────────────────────────────────────────────────

export function getDailyMetrics(
  completedOrders: Order[],
  range: DateRange
): DailyMetric[] {
  const numDays = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 14;
  const today = new Date();
  const dailyMap = new Map<string, DailyMetric>();
  const dailyList: DailyMetric[] = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${date}`;

    const label =
      i === 0
        ? "Today"
        : range === "7d"
        ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const metric: DailyMetric = {
      dateStr,
      label,
      isToday: i === 0,
      revenue: 0,
      orderCount: 0,
      unitsCount: 0,
    };

    dailyMap.set(dateStr, metric);
    dailyList.push(metric);
  }

  // Aggregate completed orders into daily bucket
  completedOrders.forEach((o) => {
    try {
      const d = new Date(o.created_at);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date}`;

      const metric = dailyMap.get(dateStr);
      if (metric) {
        metric.revenue += Number(o.total_amount) || 0;
        metric.orderCount += 1;

        const unitsInOrder = (o.items || []).reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );
        metric.unitsCount += unitsInOrder;
      }
    } catch {
      // Ignore invalid date strings
    }
  });

  return dailyList;
}

// ─── TOP SELLING PRODUCTS ────────────────────────────────────────────────────

export function getTopSellingProducts(
  completedOrders: Order[],
  limit = 5
): TopProductMetric[] {
  const productMap = new Map<
    string,
    { name: string; unitsSold: number; revenueGenerated: number }
  >();

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const pId = item.product_id;
      const pName = item.product_name || "Unknown Product";
      const qty = Number(item.quantity) || 0;
      const subtotal = Number(item.subtotal) || 0;

      const existing = productMap.get(pId) || {
        name: pName,
        unitsSold: 0,
        revenueGenerated: 0,
      };

      existing.unitsSold += qty;
      existing.revenueGenerated += subtotal;
      productMap.set(pId, existing);
    });
  });

  const list: TopProductMetric[] = Array.from(productMap.entries()).map(
    ([productId, data]) => ({
      productId,
      productName: data.name,
      unitsSold: data.unitsSold,
      revenueGenerated: data.revenueGenerated,
    })
  );

  // Sort by units sold descending (or revenue if tied)
  list.sort((a, b) => b.unitsSold - a.unitsSold || b.revenueGenerated - a.revenueGenerated);

  return list.slice(0, limit);
}

// ─── TOP PERFORMING CATEGORIES ───────────────────────────────────────────────

export function getTopPerformingCategories(
  completedOrders: Order[],
  products: Product[],
  limit = 5
): TopCategoryMetric[] {
  // Map product ID to product category
  const productCategoryMap = new Map<string, string>();
  products.forEach((p) => {
    productCategoryMap.set(p.id, p.category.trim() || "Uncategorized");
  });

  const categoryMap = new Map<
    string,
    { unitsSold: number; revenueGenerated: number }
  >();

  let overallCompletedRevenue = 0;

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const cat = productCategoryMap.get(item.product_id) || "Uncategorized";
      const qty = Number(item.quantity) || 0;
      const subtotal = Number(item.subtotal) || 0;

      overallCompletedRevenue += subtotal;

      const existing = categoryMap.get(cat) || {
        unitsSold: 0,
        revenueGenerated: 0,
      };

      existing.unitsSold += qty;
      existing.revenueGenerated += subtotal;
      categoryMap.set(cat, existing);
    });
  });

  const list: TopCategoryMetric[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      unitsSold: data.unitsSold,
      revenueGenerated: data.revenueGenerated,
      percentageOfTotalRevenue:
        overallCompletedRevenue > 0
          ? (data.revenueGenerated / overallCompletedRevenue) * 100
          : 0,
    })
  );

  // Sort by revenue descending
  list.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  return list.slice(0, limit);
}
