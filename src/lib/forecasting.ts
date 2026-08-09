import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";

export type DataQuality = "Low" | "Medium" | "Higher";

export type ReorderStatus =
  | "out_of_stock"
  | "critical"
  | "warning"
  | "healthy"
  | "no_demand";

export type DailyDemandPoint = {
  dateStr: string; // YYYY-MM-DD
  label: string;   // Display label e.g. "Aug 1"
  units: number;
  isForecast: boolean;
};

export type ProductDemandForecast = {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  historyDaysObserved: number;
  hasEnoughHistory: boolean;
  averageDailyDemand: number;
  forecast7Days: number;
  forecast30Days: number;
  estimatedDaysCoverage: number | null; // null if zero demand
  status: ReorderStatus;
  statusLabel: string;
  dataQuality: DataQuality;
  reorderRecommendation: string;
  dailyPoints: DailyDemandPoint[];
};

export type OverallForecastSummary = {
  totalProductsAssessed: number;
  productsWithForecast: number;
  criticalReorderCount: number;
  warningReorderCount: number;
  outOfStockCount: number;
  historySpanDays: number;
  hasSufficientOverallData: boolean;
};

/**
 * Calculates the total continuous historical observation span (in days)
 * from the earliest completed order to today.
 */
export function getHistoricalSpanDays(completedOrders: Order[]): number {
  if (completedOrders.length === 0) return 0;

  let earliestTime = Date.now();
  completedOrders.forEach((o) => {
    try {
      const t = new Date(o.created_at).getTime();
      if (!isNaN(t) && t < earliestTime) {
        earliestTime = t;
      }
    } catch {
      // Ignore invalid date strings
    }
  });

  const now = Date.now();
  const diffMs = now - earliestTime;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Computes deterministic demand forecast for a single product.
 */
export function calculateProductForecast(
  product: Product,
  completedOrders: Order[],
  historySpanDays: number
): ProductDemandForecast {
  const hasEnoughHistory = historySpanDays >= 7;

  // Aggregate units sold by date string (YYYY-MM-DD) for this product
  const dailyUnitsMap = new Map<string, number>();
  let totalUnitsSold = 0;

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (item.product_id === product.id) {
        try {
          const d = new Date(order.created_at);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const date = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${date}`;

          const qty = Number(item.quantity) || 0;
          totalUnitsSold += qty;
          dailyUnitsMap.set(dateStr, (dailyUnitsMap.get(dateStr) || 0) + qty);
        } catch {
          // Ignore invalid dates
        }
      }
    });
  });

  // Calculate Average Daily Demand using moving average over observed window
  const effectiveWindowDays = Math.max(historySpanDays, 7);
  const rawAvgDemand = totalUnitsSold / effectiveWindowDays;
  const averageDailyDemand = Math.round(rawAvgDemand * 10) / 10;

  // Forecast Horizons
  const forecast7Days = Math.round(averageDailyDemand * 7);
  const forecast30Days = Math.round(averageDailyDemand * 30);

  // Stock Coverage (Estimated Days Remaining)
  const currentStock = Number(product.quantity) || 0;
  const estimatedDaysCoverage =
    averageDailyDemand > 0
      ? Math.round((currentStock / averageDailyDemand) * 10) / 10
      : null;

  // Reorder Status & Recommendations
  let status: ReorderStatus = "healthy";
  let statusLabel = "Healthy (>7 Days)";
  let reorderRecommendation = `Stock coverage is healthy (~${estimatedDaysCoverage ?? "N/A"} days).`;

  if (currentStock === 0) {
    status = "out_of_stock";
    statusLabel = "Out of Stock";
    reorderRecommendation = "Product is out of stock. Replenish immediately.";
  } else if (averageDailyDemand === 0) {
    status = "no_demand";
    statusLabel = "No Recent Demand";
    reorderRecommendation = "No recent customer sales. Inventory is stable.";
  } else if (estimatedDaysCoverage !== null && estimatedDaysCoverage < 3) {
    status = "critical";
    statusLabel = "Critical (<3 Days)";
    reorderRecommendation = `Estimated 7-day demand is ${forecast7Days} units. Current stock covers only ~${estimatedDaysCoverage} days. Urgent reorder needed!`;
  } else if (estimatedDaysCoverage !== null && estimatedDaysCoverage <= 7) {
    status = "warning";
    statusLabel = "Warning (3–7 Days)";
    reorderRecommendation = `Estimated 7-day demand is ${forecast7Days} units. Current stock covers ~${estimatedDaysCoverage} days. Plan reorder soon.`;
  }

  // Data Quality (Forecast Reliability) Rating
  let dataQuality: DataQuality = "Low";
  if (historySpanDays >= 30) {
    dataQuality = "Higher";
  } else if (historySpanDays >= 14) {
    dataQuality = "Medium";
  }

  // Build daily timeline points (Past 7 Days Historical + Next 7 Days Forecast)
  const dailyPoints: DailyDemandPoint[] = [];
  const today = new Date();

  // Historical past 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${date}`;

    dailyPoints.push({
      dateStr,
      label:
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      units: dailyUnitsMap.get(dateStr) || 0,
      isForecast: false,
    });
  }

  // Next 7 days forecast projection
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${date}`;

    dailyPoints.push({
      dateStr,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      units: averageDailyDemand,
      isForecast: true,
    });
  }

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock,
    historyDaysObserved: historySpanDays,
    hasEnoughHistory,
    averageDailyDemand,
    forecast7Days,
    forecast30Days,
    estimatedDaysCoverage,
    status,
    statusLabel,
    dataQuality,
    reorderRecommendation,
    dailyPoints,
  };
}

/**
 * Calculates demand forecasts for all active products.
 */
export function generateAllProductForecasts(
  products: Product[],
  orders: Order[]
): {
  forecasts: ProductDemandForecast[];
  summary: OverallForecastSummary;
} {
  const completedOrders = orders.filter((o) => o.status === "completed");
  const historySpanDays = getHistoricalSpanDays(completedOrders);
  const hasSufficientOverallData = historySpanDays >= 7;

  const forecasts = products.map((product) =>
    calculateProductForecast(product, completedOrders, historySpanDays)
  );

  let criticalReorderCount = 0;
  let warningReorderCount = 0;
  let outOfStockCount = 0;

  forecasts.forEach((f) => {
    if (f.status === "critical") criticalReorderCount++;
    if (f.status === "warning") warningReorderCount++;
    if (f.status === "out_of_stock") outOfStockCount++;
  });

  const summary: OverallForecastSummary = {
    totalProductsAssessed: products.length,
    productsWithForecast: hasSufficientOverallData ? products.length : 0,
    criticalReorderCount,
    warningReorderCount,
    outOfStockCount,
    historySpanDays,
    hasSufficientOverallData,
  };

  return { forecasts, summary };
}
