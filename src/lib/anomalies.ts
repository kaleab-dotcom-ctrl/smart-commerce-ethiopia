import { Order } from "@/lib/orders";
import { Product } from "@/lib/products";

export type AnomalySeverity = "critical" | "warning" | "info";

export type AnomalyType =
  | "large_order"
  | "unusual_quantity"
  | "high_value_order"
  | "rapid_orders"
  | "sales_spike"
  | "inventory_risk";

export type DetectedAnomaly = {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  whyFlagged: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  customerId?: string;
  customerName?: string;
  timestamp?: string;
  metrics?: {
    observedValue: number;
    baselineValue: number;
    difference: number;
    unit: string;
  };
  action?: {
    label: string;
    href: string;
  };
};

export type AnomalySummary = {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  hasSufficientData: boolean;
  historyOrderCount: number;
  minOrdersRequired: number;
};

// ─── HELPER MATH ─────────────────────────────────────────────────────────────

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

// ─── MAIN ANOMALY DETECTION ENGINE ────────────────────────────────────────────

/**
 * Pure, deterministic rule-based anomaly detection algorithm.
 * Evaluates completed orders and current products against historical statistical baselines.
 * Does NOT call external AI APIs or claim confirmed fraud.
 */
export function detectAnomalies(
  products: Product[],
  orders: Order[]
): {
  anomalies: DetectedAnomaly[];
  summary: AnomalySummary;
} {
  const MIN_ORDERS_REQUIRED = 5;

  // Filter COMPLETED orders ONLY
  const completedOrders = orders.filter((o) => o.status === "completed");
  const historyOrderCount = completedOrders.length;
  const hasSufficientData = historyOrderCount >= MIN_ORDERS_REQUIRED;

  const summary: AnomalySummary = {
    totalCount: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    hasSufficientData,
    historyOrderCount,
    minOrdersRequired: MIN_ORDERS_REQUIRED,
  };

  if (!hasSufficientData) {
    return { anomalies: [], summary };
  }

  const anomalies: DetectedAnomaly[] = [];
  const trackedAnomalyKeys = new Set<string>();

  // ── 1. HIGH-VALUE ORDER DETECTION ─────────────────────────────────────────
  const orderAmounts = completedOrders.map((o) => Number(o.total_amount) || 0);
  const meanOrderValue = calculateMean(orderAmounts);
  const stdDevOrderValue = calculateStdDev(orderAmounts, meanOrderValue);
  const highValueThreshold = Math.max(
    meanOrderValue + 2 * stdDevOrderValue,
    meanOrderValue * 2.5
  );

  completedOrders.forEach((order) => {
    const val = Number(order.total_amount) || 0;
    if (val > highValueThreshold && val > 0) {
      const isExtreme = val > meanOrderValue + 3 * stdDevOrderValue;
      const severity: AnomalySeverity = isExtreme ? "critical" : "warning";

      const key = `high_val_${order.id}`;
      if (!trackedAnomalyKeys.has(key)) {
        trackedAnomalyKeys.add(key);
        anomalies.push({
          id: key,
          type: "high_value_order",
          severity,
          title: `Potentially Unusual High-Value Order (#${order.id.slice(0, 8)})`,
          description: `Order total of ${val.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB is significantly above the historical average of ${meanOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB.`,
          whyFlagged: `Order total exceeds statistical threshold (mean + 2σ: ${highValueThreshold.toLocaleString("en-US", { maximumFractionDigits: 0 })} ETB).`,
          orderId: order.id,
          customerName: order.customer?.name || "Walk-in Customer",
          timestamp: order.created_at,
          metrics: {
            observedValue: val,
            baselineValue: meanOrderValue,
            difference: val - meanOrderValue,
            unit: "ETB",
          },
          action: {
            label: "Review Order",
            href: "/dashboard/orders",
          },
        });
      }
    }
  });

  // ── 2. LARGE ORDER ITEM QUANTITY DETECTION ────────────────────────────────
  const orderTotalQuantities = completedOrders.map((o) =>
    (o.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  );

  const meanOrderQty = calculateMean(orderTotalQuantities);
  const stdDevOrderQty = calculateStdDev(orderTotalQuantities, meanOrderQty);
  const largeQtyThreshold = Math.max(
    meanOrderQty + 2 * stdDevOrderQty,
    meanOrderQty * 2.5,
    10
  );

  completedOrders.forEach((order) => {
    const totalQty = (order.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    if (totalQty > largeQtyThreshold) {
      const isExtreme = totalQty > meanOrderQty + 3 * stdDevOrderQty;
      const severity: AnomalySeverity = isExtreme ? "critical" : "warning";

      const key = `large_qty_${order.id}`;
      if (!trackedAnomalyKeys.has(key)) {
        trackedAnomalyKeys.add(key);
        anomalies.push({
          id: key,
          type: "large_order",
          severity,
          title: `Unusually Large Order Volume (#${order.id.slice(0, 8)})`,
          description: `Order contains ${totalQty} total items, which is substantially larger than the historical order average of ${Math.round(meanOrderQty)} items.`,
          whyFlagged: `Total items quantity exceeds standard volume baseline (${largeQtyThreshold} items threshold).`,
          orderId: order.id,
          customerName: order.customer?.name || "Walk-in Customer",
          timestamp: order.created_at,
          metrics: {
            observedValue: totalQty,
            baselineValue: meanOrderQty,
            difference: totalQty - meanOrderQty,
            unit: "items",
          },
          action: {
            label: "Inspect Order",
            href: "/dashboard/orders",
          },
        });
      }
    }
  });

  // ── 3. UNUSUAL SINGLE PRODUCT QUANTITY IN ORDER ───────────────────────────
  // Calculate average ordered quantity per product
  const productItemQtyMap = new Map<string, number[]>();
  completedOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const pId = item.product_id;
      const existing = productItemQtyMap.get(pId) || [];
      existing.push(Number(item.quantity) || 0);
      productItemQtyMap.set(pId, existing);
    });
  });

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const historyList = productItemQtyMap.get(item.product_id) || [];

      if (historyList.length >= 2) {
        const avgQty = calculateMean(historyList);
        // Flag if single item quantity is >= 3x average and >= 8 units
        if (qty >= avgQty * 3 && qty >= 8) {
          const key = `unusual_prod_qty_${order.id}_${item.product_id}`;
          if (!trackedAnomalyKeys.has(key)) {
            trackedAnomalyKeys.add(key);
            anomalies.push({
              id: key,
              type: "unusual_quantity",
              severity: "warning",
              title: `Unusual Quantity for "${item.product_name || "Product"}"`,
              description: `Order #${order.id.slice(0, 8)} contains ${qty} units of "${item.product_name || "Product"}" (typical item order is ~${Math.round(avgQty)} units).`,
              whyFlagged: `Single product quantity is 3x higher than typical per-order baseline for this product.`,
              orderId: order.id,
              productId: item.product_id,
              productName: item.product_name || "Product",
              customerName: order.customer?.name || "Walk-in Customer",
              timestamp: order.created_at,
              metrics: {
                observedValue: qty,
                baselineValue: avgQty,
                difference: qty - avgQty,
                unit: "units",
              },
              action: {
                label: "View Details",
                href: "/dashboard/orders",
              },
            });
          }
        }
      }
    });
  });

  // ── 4. RAPID REPEATED ORDERING DETECTION ──────────────────────────────────
  // Group orders by customer ID or customer name
  const customerOrdersMap = new Map<string, Order[]>();
  completedOrders.forEach((order) => {
    const custKey = order.customer_id || order.customer?.name || "unknown";
    if (custKey !== "unknown") {
      const existing = customerOrdersMap.get(custKey) || [];
      existing.push(order);
      customerOrdersMap.set(custKey, existing);
    }
  });

  // Check for 3+ completed orders within 10 minutes (600,000 ms)
  customerOrdersMap.forEach((custOrders, custKey) => {
    if (custOrders.length >= 3) {
      // Sort customer orders by timestamp ascending
      const sorted = [...custOrders].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      for (let i = 0; i <= sorted.length - 3; i++) {
        const tFirst = new Date(sorted[i].created_at).getTime();
        const tThird = new Date(sorted[i + 2].created_at).getTime();

        const diffMinutes = (tThird - tFirst) / (1000 * 60);

        if (diffMinutes <= 10 && diffMinutes >= 0) {
          const custName = sorted[i].customer?.name || "Customer";
          const key = `rapid_orders_${custKey}_${sorted[i].id}`;

          if (!trackedAnomalyKeys.has(key)) {
            trackedAnomalyKeys.add(key);
            anomalies.push({
              id: key,
              type: "rapid_orders",
              severity: "warning",
              title: `Rapid Repeated Ordering: ${custName}`,
              description: `Customer "${custName}" placed 3 completed orders within a ${Math.round(diffMinutes)} minute window.`,
              whyFlagged: "Multiple completed transactions occurring in short sequence.",
              customerId: sorted[i].customer_id || undefined,
              customerName: custName,
              timestamp: sorted[i + 2].created_at,
              metrics: {
                observedValue: 3,
                baselineValue: 1,
                difference: 2,
                unit: "orders / 10 min",
              },
              action: {
                label: "Review Customer Orders",
                href: "/dashboard/orders",
              },
            });
          }
          break; // Flag once per cluster
        }
      }
    }
  });

  // ── 5. SALES SPIKE DETECTION (Today vs Typical Daily Sales) ───────────────
  // Calculate daily sales per product for past 7 days
  const todayStr = new Date().toISOString().split("T")[0];
  const productTodayUnitsMap = new Map<string, number>();
  const productHistoricalDailyMap = new Map<string, Map<string, number>>();

  completedOrders.forEach((order) => {
    try {
      const dateStr = new Date(order.created_at).toISOString().split("T")[0];
      (order.items || []).forEach((item) => {
        const qty = Number(item.quantity) || 0;
        if (dateStr === todayStr) {
          productTodayUnitsMap.set(
            item.product_id,
            (productTodayUnitsMap.get(item.product_id) || 0) + qty
          );
        } else {
          const daysMap =
            productHistoricalDailyMap.get(item.product_id) || new Map();
          daysMap.set(dateStr, (daysMap.get(dateStr) || 0) + qty);
          productHistoricalDailyMap.set(item.product_id, daysMap);
        }
      });
    } catch {
      // Ignore invalid dates
    }
  });

  products.forEach((product) => {
    const todayUnits = productTodayUnitsMap.get(product.id) || 0;
    const histMap = productHistoricalDailyMap.get(product.id);

    if (histMap && histMap.size >= 3 && todayUnits >= 10) {
      const histDailyValues = Array.from(histMap.values());
      const avgDaily = calculateMean(histDailyValues);

      if (todayUnits >= avgDaily * 3) {
        const key = `sales_spike_${product.id}`;
        if (!trackedAnomalyKeys.has(key)) {
          trackedAnomalyKeys.add(key);
          anomalies.push({
            id: key,
            type: "sales_spike",
            severity: "warning",
            title: `Unusual Sales Spike: ${product.name}`,
            description: `Today's sales volume for "${product.name}" (${todayUnits} units) is 3x higher than typical daily sales (${Math.round(avgDaily)} units/day).`,
            whyFlagged: "Current daily demand significantly exceeds historical baseline.",
            productId: product.id,
            productName: product.name,
            metrics: {
              observedValue: todayUnits,
              baselineValue: avgDaily,
              difference: todayUnits - avgDaily,
              unit: "units today",
            },
            action: {
              label: "View Product",
              href: "/dashboard/products",
            },
          });
        }
      }
    }
  });

  // Sort anomalies by severity: critical -> warning -> info
  const severityOrder: Record<AnomalySeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Update summary counts
  anomalies.forEach((a) => {
    if (a.severity === "critical") summary.criticalCount++;
    if (a.severity === "warning") summary.warningCount++;
    if (a.severity === "info") summary.infoCount++;
  });
  summary.totalCount = anomalies.length;

  return { anomalies, summary };
}
