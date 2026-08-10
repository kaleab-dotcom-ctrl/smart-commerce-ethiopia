"use client";

import { useState, type FormEvent } from "react";
import { addProduct, NewProduct } from "@/lib/products";
import { getSession } from "@/lib/auth";

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
};

const CATEGORY_SUGGESTIONS = [
  "Electronics",
  "Clothing & Apparel",
  "Food & Beverages",
  "Agriculture & Fresh Produce",
  "Home & Kitchen",
  "Health & Beauty",
  "Construction & Hardware",
  "Office Supplies",
  "General Merchandise",
];

export function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
}: AddProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);

    if (!trimmedName) {
      setError("Product Name is required.");
      return;
    }

    if (!trimmedCategory) {
      setError("Category is required.");
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Price must be a valid positive number in ETB.");
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError("Quantity must be a valid non-negative integer.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData } = await getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        setError("You must be logged in to add products.");
        setLoading(false);
        return;
      }

      const newProduct: NewProduct = {
        name: trimmedName,
        category: trimmedCategory,
        price: parsedPrice,
        quantity: parsedQuantity,
        user_id: userId,
      };

      const { error: insertError } = await addProduct(newProduct);

      if (insertError) {
        setError(insertError.message || "Failed to add product.");
        setLoading(false);
        return;
      }

      // Reset form
      setName("");
      setCategory("");
      setPrice("");
      setQuantity("");

      // Trigger UI refresh & close modal
      onProductAdded();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm font-bold">
                +
              </span>
              Add New Product
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Add a new item to your isolated store catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-foreground transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Product Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="modal-product-name"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Teff Grain (100kg)"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="modal-product-category"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-product-category"
                type="text"
                list="modal-category-suggestions"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or type category"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
              />
              <datalist id="modal-category-suggestions">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Price (ETB) */}
            <div className="space-y-1.5">
              <label
                htmlFor="modal-product-price"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Price (ETB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="modal-product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-3.5 pr-12 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  ETB
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label
                htmlFor="modal-product-quantity"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground"
              >
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-product-quantity"
                type="number"
                min="0"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-green-dark disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-white"
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
                  <span>Saving Product…</span>
                </>
              ) : (
                <span>Save Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
