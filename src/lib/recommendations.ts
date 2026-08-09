import { Product } from "@/lib/products";
import { Order } from "@/lib/orders";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type RecommendationType =
  | "restock"
  | "high_performer"
  | "inventory_risk"
  | "product_pair"
  | "category_opportunity"
  | "pricing"
  | "inventory_value";

export type ProductRecommendation = {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reason: string;
  productId?: string;
  productName?: string;
  relatedProductId?: string;
  relatedProductName?: string;
  categoryName?: string;
  action?: {
    label: string;
    href: string;
  };
};

/**
 * Generates data-driven, deterministic recommendations based strictly on
 * live product inventory and completed orders.
 *
 * Rules:
 * - Does NOT call external AI APIs.
 * - Does NOT invent sales data, customer behavior, or fake pairs.
 * - Product pair recommendations REQUIRE at least 2 separate completed orders.
 */
export function generateSmartRecommendations(
  products: Product[],
  orders: Order[]
): ProductRecommendation[] {
  const recommendations: ProductRecommendation[] = [];

  // Filter completed orders ONLY
  const completedOrders = orders.filter((o) => o.status === "completed");

  // Build completed sales map per product ID
  const productSalesMap = new Map<
    string,
    { name: string; unitsSold: number; revenue: number; orderCount: number }
  >();

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const pId = item.product_id;
      const pName = item.product_name || "Product";
      const qty = Number(item.quantity) || 0;
      const subtotal = Number(item.subtotal) || 0;

      const existing = productSalesMap.get(pId) || {
        name: pName,
        unitsSold: 0,
        revenue: 0,
        orderCount: 0,
      };

      existing.unitsSold += qty;
      existing.revenue += subtotal;
      existing.orderCount += 1;
      productSalesMap.set(pId, existing);
    });
  });

  // Track product IDs already recommended to prevent duplication
  const recommendedProductIds = new Set<string>();

  // ── 1. RESTOCK RECOMMENDATIONS (quantity <= 5 + proven sales volume) ───────────
  products.forEach((product) => {
    const salesData = productSalesMap.get(product.id);
    const unitsSold = salesData ? salesData.unitsSold : 0;
    const qty = Number(product.quantity);

    // Only recommend restock if product is low/out AND has completed sales
    if (qty <= 5 && unitsSold > 0) {
      const isOut = qty === 0;
      const priority: RecommendationPriority = isOut ? "critical" : "high";

      recommendations.push({
        id: `restock-${product.id}`,
        type: "restock",
        priority,
        title: isOut
          ? `Out of Stock: ${product.name}`
          : `Restock Urgently: ${product.name}`,
        description: isOut
          ? `"${product.name}" has 0 units remaining and has generated ${unitsSold} completed units sold. Replenish stock to avoid lost sales.`
          : `"${product.name}" has only ${qty} units remaining with ${unitsSold} units sold across completed orders.`,
        reason: isOut
          ? "Item is completely out of stock while maintaining active customer demand."
          : "Stock level has dropped to ≤ 5 units with proven historical order volume.",
        productId: product.id,
        productName: product.name,
        categoryName: product.category,
        action: {
          label: "Manage Inventory",
          href: "/dashboard/products",
        },
      });

      recommendedProductIds.add(product.id);
    }
  });

  // ── 2. HIGH-PERFORMING PRODUCTS ──────────────────────────────────────────────
  const salesList = Array.from(productSalesMap.entries()).map(
    ([id, data]) => ({
      id,
      ...data,
    })
  );

  salesList.sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

  if (salesList.length > 0) {
    const topSeller = salesList[0];
    if (topSeller.unitsSold >= 2 && !recommendedProductIds.has(topSeller.id)) {
      recommendations.push({
        id: `high-performer-${topSeller.id}`,
        type: "high_performer",
        priority: "high",
        title: `Top-Performing Product: ${topSeller.name}`,
        description: `"${topSeller.name}" leads your sales with ${topSeller.unitsSold} completed units sold generating ${topSeller.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB in revenue.`,
        reason: "Highest total units sold across completed customer orders.",
        productId: topSeller.id,
        productName: topSeller.name,
        action: {
          label: "View Orders",
          href: "/dashboard/orders",
        },
      });

      recommendedProductIds.add(topSeller.id);
    }
  }

  // ── 3. INVENTORY RISK (High value exposure on low-stock items) ───────────────
  products.forEach((product) => {
    const qty = Number(product.quantity);
    const price = Number(product.price);
    const salesData = productSalesMap.get(product.id);

    // High price item (>= 500 ETB) with low stock (1-5 units) and active demand
    if (
      price >= 500 &&
      qty > 0 &&
      qty <= 5 &&
      salesData &&
      salesData.unitsSold > 0 &&
      !recommendedProductIds.has(product.id)
    ) {
      recommendations.push({
        id: `inventory-risk-${product.id}`,
        type: "inventory_risk",
        priority: "high",
        title: `High Revenue Risk: ${product.name}`,
        description: `"${product.name}" is a high-value item (${price.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB) with only ${qty} units left and ${salesData.unitsSold} units sold.`,
        reason: "High unit-price product at risk of stockout with active buyer demand.",
        productId: product.id,
        productName: product.name,
        categoryName: product.category,
        action: {
          label: "Review Product",
          href: "/dashboard/products",
        },
      });

      recommendedProductIds.add(product.id);
    }
  });

  // ── 4. PRODUCT ASSOCIATIONS (Co-purchased in >= 2 completed orders) ───────────
  const pairMap = new Map<
    string,
    {
      prod1Id: string;
      prod1Name: string;
      prod2Id: string;
      prod2Name: string;
      orderCount: number;
    }
  >();

  completedOrders.forEach((order) => {
    const items = order.items || [];
    if (items.length < 2) return;

    // Get unique product IDs in order
    const uniqueItemIds = Array.from(new Set(items.map((i) => i.product_id)));

    for (let i = 0; i < uniqueItemIds.length; i++) {
      for (let j = i + 1; j < uniqueItemIds.length; j++) {
        const idA = uniqueItemIds[i];
        const idB = uniqueItemIds[j];

        // Sort IDs deterministically to form key
        const [firstId, secondId] = idA < idB ? [idA, idB] : [idB, idA];
        const key = `${firstId}___${secondId}`;

        const itemA = items.find((it) => it.product_id === firstId);
        const itemB = items.find((it) => it.product_id === secondId);

        const existing = pairMap.get(key) || {
          prod1Id: firstId,
          prod1Name: itemA?.product_name || "Product A",
          prod2Id: secondId,
          prod2Name: itemB?.product_name || "Product B",
          orderCount: 0,
        };

        existing.orderCount += 1;
        pairMap.set(key, existing);
      }
    }
  });

  // Filter pairs with orderCount >= 2 (STRICT REQUIREMENT)
  const verifiedPairs = Array.from(pairMap.values()).filter(
    (p) => p.orderCount >= 2
  );
  verifiedPairs.sort((a, b) => b.orderCount - a.orderCount);

  if (verifiedPairs.length > 0) {
    const topPair = verifiedPairs[0];
    recommendations.push({
      id: `product-pair-${topPair.prod1Id}-${topPair.prod2Id}`,
      type: "product_pair",
      priority: "medium",
      title: `Frequently Bought Together: "${topPair.prod1Name}" & "${topPair.prod2Name}"`,
      description: `"${topPair.prod1Name}" and "${topPair.prod2Name}" were purchased together across ${topPair.orderCount} separate completed orders. Consider bundling or cross-promoting them.`,
      reason: `Co-occurrence verified across ${topPair.orderCount} distinct completed customer orders.`,
      productId: topPair.prod1Id,
      productName: topPair.prod1Name,
      relatedProductId: topPair.prod2Id,
      relatedProductName: topPair.prod2Name,
      action: {
        label: "View Orders",
        href: "/dashboard/orders",
      },
    });
  }

  // ── 5. CATEGORY OPPORTUNITIES ──────────────────────────────────────────────
  if (completedOrders.length > 0 && products.length > 0) {
    const categoryRevenueMap = new Map<string, number>();
    let totalCompletedRevenue = 0;

    const prodCategoryMap = new Map<string, string>(
      products.map((p) => [p.id, p.category.trim() || "Uncategorized"])
    );

    completedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const cat = prodCategoryMap.get(item.product_id) || "Uncategorized";
        const subtotal = Number(item.subtotal) || 0;
        totalCompletedRevenue += subtotal;
        categoryRevenueMap.set(
          cat,
          (categoryRevenueMap.get(cat) || 0) + subtotal
        );
      });
    });

    const sortedCats = Array.from(categoryRevenueMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedCats.length > 0 && totalCompletedRevenue > 0) {
      const [topCat, topCatRev] = sortedCats[0];
      const pct = (topCatRev / totalCompletedRevenue) * 100;

      if (pct >= 25) {
        recommendations.push({
          id: `category-opportunity-${topCat}`,
          type: "category_opportunity",
          priority: "medium",
          title: `Strong Category Performance: "${topCat}"`,
          description: `"${topCat}" generated ${topCatRev.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB, representing ${pct.toFixed(0)}% of your total completed revenue.`,
          reason: "Highest realized revenue contribution among active catalog categories.",
          categoryName: topCat,
          action: {
            label: "View Analytics",
            href: "/dashboard",
          },
        });
      }
    }
  }

  // ── 6. INVENTORY VALUE CAPITAL CONCENTRATION ─────────────────────────────────
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0
  );

  if (totalInventoryValue > 0) {
    const categoryValuationMap = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category.trim() || "Uncategorized";
      const val = Number(p.price) * Number(p.quantity);
      categoryValuationMap.set(cat, (categoryValuationMap.get(cat) || 0) + val);
    });

    const sortedValuationCats = Array.from(
      categoryValuationMap.entries()
    ).sort((a, b) => b[1] - a[1]);

    if (sortedValuationCats.length > 1) {
      const [topValCat, topVal] = sortedValuationCats[0];
      const pct = (topVal / totalInventoryValue) * 100;

      if (pct >= 50) {
        recommendations.push({
          id: `inventory-value-${topValCat}`,
          type: "inventory_value",
          priority: "low",
          title: `Capital Concentration in "${topValCat}"`,
          description: `"${topValCat}" accounts for ${pct.toFixed(0)}% of your physical inventory valuation (${topVal.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB).`,
          reason: "Over half of total catalog capital is tied up in a single category.",
          categoryName: topValCat,
          action: {
            label: "View Catalog",
            href: "/dashboard/products",
          },
        });
      }
    }
  }

  // ── 7. SORT RECOMMENDATIONS BY PRIORITY & CAP ─────────────────────────────
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations.slice(0, 8);
}
