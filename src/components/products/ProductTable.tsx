"use client";

import { useState, type FormEvent } from "react";
import {
  Product,
  deleteProduct,
  updateProduct,
  getStockStatus,
  getStockStatusLabel,
  StockStatus,
} from "@/lib/products";

type ProductTableProps = {
  products: Product[];
  onProductDeleted?: () => void;
  onProductUpdated?: () => void;
};

type SortOption =
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "quantity-asc"
  | "quantity-desc";

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

export function ProductTable({
  products,
  onProductDeleted,
  onProductUpdated,
}: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Extract unique categories for filtering
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(
    Boolean
  );

  // 1. Filter products by search term (case-insensitive on name) and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // 2. Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return Number(a.price) - Number(b.price);
      case "price-desc":
        return Number(b.price) - Number(a.price);
      case "quantity-asc":
        return Number(a.quantity) - Number(b.quantity);
      case "quantity-desc":
        return Number(b.quantity) - Number(a.quantity);
      default:
        return 0;
    }
  });

  const hasActiveFilters =
    searchTerm !== "" || categoryFilter !== "ALL" || sortBy !== "name-asc";

  function clearAllFilters() {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setSortBy("name-asc");
  }

  function triggerRefresh() {
    onProductUpdated?.();
    onProductDeleted?.();
  }

  async function handleDelete(id: string, name: string) {
    setDeleteError(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}" from inventory?`
    );

    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await deleteProduct(id);
      if (error) {
        setDeleteError(error.message || "Failed to delete product.");
        return;
      }
      triggerRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An error occurred while deleting.";
      setDeleteError(msg);
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditPrice(product.price.toString());
    setEditQuantity(product.quantity.toString());
    setEditError(null);
    setEditSuccess(null);
  }

  function handleCloseEdit() {
    setEditingProduct(null);
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleSaveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;

    setEditError(null);
    setEditSuccess(null);

    const trimmedName = editName.trim();
    const trimmedCategory = editCategory.trim();
    const parsedPrice = parseFloat(editPrice);
    const parsedQuantity = parseInt(editQuantity, 10);

    if (!trimmedName) {
      setEditError("Product Name is required.");
      return;
    }

    if (!trimmedCategory) {
      setEditError("Category is required.");
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditError("Price must be a valid positive number in ETB.");
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setEditError("Quantity must be a valid non-negative integer.");
      return;
    }

    setEditLoading(true);

    try {
      const { error } = await updateProduct(editingProduct.id, {
        name: trimmedName,
        category: trimmedCategory,
        price: parsedPrice,
        quantity: parsedQuantity,
      });

      if (error) {
        setEditError(error.message || "Failed to update product.");
        setEditLoading(false);
        return;
      }

      setEditSuccess("Product updated successfully!");
      triggerRefresh();

      setTimeout(() => {
        handleCloseEdit();
      }, 800);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-border bg-surface">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Inventory Catalog
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-muted">
                {sortedProducts.length}{" "}
                {sortedProducts.length === 1 ? "item" : "items"}
              </span>
            </h3>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:underline self-start sm:self-auto"
            >
              <span>✕ Reset Filters</span>
            </button>
          )}
        </div>

        {/* Search, Filter & Sort Controls Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative sm:col-span-1 lg:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product by name..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted/60 transition-colors focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              🔍
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                title="Clear Search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-medium"
            >
              <option value="name-asc">Sort: Name (A → Z)</option>
              <option value="name-desc">Sort: Name (Z → A)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
              <option value="quantity-asc">Sort: Quantity (Low → High)</option>
              <option value="quantity-desc">Sort: Quantity (High → Low)</option>
            </select>
          </div>
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
      {sortedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-muted">
            📋
          </div>
          <h4 className="mt-4 text-sm font-bold text-foreground">
            {products.length === 0
              ? "No products added yet"
              : "No matching products found"}
          </h4>
          <p className="mt-1 max-w-sm text-xs text-muted">
            {products.length === 0
              ? "Use the form above to add your first product to Smart Commerce Ethiopia."
              : "No items match your search or filter criteria."}
          </p>
          {products.length > 0 && hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 rounded-lg bg-brand-green px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        /* Responsive Table */
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="py-3.5 pl-6 pr-4">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Category
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Price (ETB)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Quantity
                </th>
                <th scope="col" className="py-3.5 pl-4 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {sortedProducts.map((product) => {
                const isDeleting = deletingId === product.id;
                const status = getStockStatus(product.quantity);
                const statusLabel = getStockStatusLabel(status);
                const badgeStyle: string = {
                  out_of_stock: "bg-red-100 text-red-800 border border-red-200",
                  low_stock: "bg-amber-100 text-amber-800 border border-amber-200",
                  in_stock: "bg-emerald-100 text-emerald-800 border border-emerald-200",
                }[status];

                return (
                  <tr
                    key={product.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    {/* Product Name */}
                    <td className="py-4 pl-6 pr-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                          {product.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-muted">
                            ID: {product.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {product.category}
                      </span>
                    </td>

                    {/* Price (ETB) */}
                    <td className="px-4 py-4 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                      {Number(product.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-xs text-brand-green font-sans font-bold">
                        ETB
                      </span>
                    </td>

                    {/* Quantity & Stock Status Indicator */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
                      >
                        <span>{statusLabel}</span>
                        <span>•</span>
                        <span>{product.quantity} units</span>
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          title="Edit Product"
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                        >
                          ✏️ Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={isDeleting}
                          title="Delete Product"
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm">
                    ✏️
                  </span>
                  Edit Product
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Update inventory details for &quot;{editingProduct.name}&quot;.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {editError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
                >
                  <span>⚠️</span>
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-brand-green/20 bg-brand-green/5 p-3 text-xs font-medium text-brand-green-dark"
                >
                  <span>✅</span>
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Product Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor="edit-product-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-product-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={editLoading}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label
                    htmlFor="edit-product-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-product-category"
                    type="text"
                    list="edit-category-suggestions"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={editLoading}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
                  />
                  <datalist id="edit-category-suggestions">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Price (ETB) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-product-price"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-product-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    disabled={editLoading}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-product-quantity"
                    className="block text-xs font-semibold uppercase tracking-wider text-foreground"
                  >
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-product-quantity"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    disabled={editLoading}
                    className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-brand-green focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={editLoading}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-green-dark disabled:opacity-60"
                >
                  {editLoading ? (
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
                      <span>Saving Changes…</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
