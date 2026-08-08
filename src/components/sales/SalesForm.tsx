"use client";

import { useState, type FormEvent } from "react";
import { Product } from "@/lib/products";
import { addSale, NewSale } from "@/lib/sales";
import { supabase } from "@/lib/supabase";

type SalesFormProps = {
  products: Product[];
  onSaleAdded: () => void;
};

export function SalesForm({ products, onSaleAdded }: SalesFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find selected product
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const availableStock = selectedProduct ? Number(selectedProduct.quantity) : 0;
  const unitPrice = selectedProduct ? Number(selectedProduct.price) : 0;

  // Auto-calculated total price
  const parsedQuantity = parseInt(quantity, 10);
  const calculatedTotal =
    selectedProduct && !isNaN(parsedQuantity) && parsedQuantity > 0
      ? unitPrice * parsedQuantity
      : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedProductId || !selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity sold must be greater than 0.");
      return;
    }

    if (parsedQuantity > availableStock) {
      setError(
        `Insufficient stock! Requested ${parsedQuantity} units, but only ${availableStock} units are available for "${selectedProduct.name}".`
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Create sale record
      const newSale: NewSale = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: parsedQuantity,
        total_price: calculatedTotal,
      };

      const { error: saleError } = await addSale(newSale);

      if (saleError) {
        setError(saleError.message || "Failed to record sale.");
        setLoading(false);
        return;
      }

      // 2. Decrease product quantity in Supabase
      const updatedQuantity = availableStock - parsedQuantity;
      const { error: stockError } = await supabase
        .from("products")
        .update({ quantity: updatedQuantity })
        .eq("id", selectedProduct.id);

      if (stockError) {
        setError(
          `Sale was recorded, but updating product stock failed: ${stockError.message}`
        );
        setLoading(false);
        return;
      }

      // 3. Clear form state & display success
      setSelectedProductId("");
      setQuantity("");
      setSuccessMessage(
        `Sale recorded successfully! ${parsedQuantity} unit(s) of "${selectedProduct.name}" sold for ${calculatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB.`
      );

      // 4. Refresh products and sales data in parent
      onSaleAdded();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm">
              💵
            </span>
            Record New Sale
          </h2>
          <p className="text-xs text-muted mt-1">
            Select a product and quantity to log a transaction and update inventory levels automatically.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-brand-green/20 bg-brand-green/5 p-3 text-xs font-medium text-brand-green-dark"
          >
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* Product Selector */}
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="sale-product-select"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Select Product <span className="text-red-500">*</span>
            </label>
            <select
              id="sale-product-select"
              required
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setError(null);
              }}
              disabled={loading || products.length === 0}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
            >
              <option value="">
                {products.length === 0
                  ? "-- No products available --"
                  : "-- Choose a product --"}
              </option>
              {products.map((p) => {
                const stock = Number(p.quantity);
                return (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={stock <= 0}
                  >
                    {p.name} - {Number(p.price).toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB {stock <= 0 ? "(OUT OF STOCK)" : `(In Stock: ${stock})`}
                  </option>
                );
              })}
            </select>
            {selectedProduct && (
              <div className="flex items-center gap-2 text-xs text-muted pt-0.5">
                <span>Unit Price: <strong className="text-foreground font-mono">{unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB</strong></span>
                <span>•</span>
                <span>Stock Available: <strong className={availableStock <= 5 ? "text-amber-600 font-bold" : "text-brand-green font-bold"}>{availableStock} units</strong></span>
              </div>
            )}
          </div>

          {/* Quantity Sold */}
          <div className="space-y-1.5">
            <label
              htmlFor="sale-quantity"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Quantity Sold <span className="text-red-500">*</span>
            </label>
            <input
              id="sale-quantity"
              type="number"
              min="1"
              max={selectedProduct ? availableStock : undefined}
              step="1"
              required
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 2"
              disabled={loading || !selectedProductId}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
            />
          </div>

          {/* Auto-Calculated Total Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
              Total Price (ETB)
            </label>
            <div className="flex h-[42px] w-full items-center justify-between rounded-lg border border-border bg-slate-50 px-3.5 text-sm font-mono font-bold text-foreground">
              <span>
                {calculatedTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-sans text-brand-green font-bold">
                ETB
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !selectedProductId || availableStock <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-green/20 transition-all hover:bg-brand-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
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
                <span>Recording Sale…</span>
              </>
            ) : (
              <>
                <span>Record Sale</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
