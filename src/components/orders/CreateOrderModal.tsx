"use client";

import { useState, useMemo } from "react";
import { Product } from "@/lib/products";
import { Customer, createCustomer } from "@/lib/customers";
import {
  NewOrderItem,
  OrderStatus,
  calculateOrderTotal,
  createOrder,
} from "@/lib/orders";

type CreateOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onOrderCreated: () => void;
};

export function CreateOrderModal({
  isOpen,
  onClose,
  products,
  customers,
  onOrderCreated,
}: CreateOrderModalProps) {
  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("new");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Order status
  const [status, setStatus] = useState<OrderStatus>("completed");

  // Line item adder state
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Added draft order items
  const [draftItems, setDraftItems] = useState<NewOrderItem[]>([]);

  // Submission / error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Currently selected product metadata
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Grand total calculation
  const grandTotal = useMemo(
    () => calculateOrderTotal(draftItems),
    [draftItems]
  );

  if (!isOpen) return null;

  // Add line item to draft
  function handleAddItem() {
    setErrorMsg(null);
    if (!selectedProduct) {
      setErrorMsg("Please select a product to add.");
      return;
    }

    if (itemQuantity <= 0) {
      setErrorMsg("Quantity must be at least 1.");
      return;
    }

    if (itemQuantity > selectedProduct.quantity) {
      setErrorMsg(
        `Requested quantity (${itemQuantity}) exceeds available stock (${selectedProduct.quantity}) for "${selectedProduct.name}".`
      );
      return;
    }

    // Check if item already exists in draft
    const existingIndex = draftItems.findIndex(
      (item) => item.product_id === selectedProduct.id
    );

    const price = Number(selectedProduct.price);

    if (existingIndex >= 0) {
      const existing = draftItems[existingIndex];
      const newQty = existing.quantity + itemQuantity;

      if (newQty > selectedProduct.quantity) {
        setErrorMsg(
          `Total quantity in order (${newQty}) exceeds available stock (${selectedProduct.quantity}) for "${selectedProduct.name}".`
        );
        return;
      }

      const updated = [...draftItems];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * price,
      };
      setDraftItems(updated);
    } else {
      setDraftItems((prev) => [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          unit_price: price,
          quantity: itemQuantity,
          subtotal: itemQuantity * price,
        },
      ]);
    }

    // Reset line item selection
    setSelectedProductId("");
    setItemQuantity(1);
  }

  // Remove line item from draft
  function handleRemoveItem(index: number) {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (draftItems.length === 0) {
      setErrorMsg("Please add at least one product to the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      let customerId: string | null = null;

      // 1. If adding new customer
      if (selectedCustomerId === "new") {
        if (!newCustomerName.trim()) {
          setErrorMsg("Please enter a customer name.");
          setIsSubmitting(false);
          return;
        }

        const { data: newCust, error: custErr } = await createCustomer({
          name: newCustomerName,
          email: newCustomerEmail || null,
          phone: newCustomerPhone || null,
        });

        if (custErr || !newCust) {
          setErrorMsg(custErr?.message || "Failed to create customer record.");
          setIsSubmitting(false);
          return;
        }

        customerId = newCust.id;
      } else if (selectedCustomerId) {
        customerId = selectedCustomerId;
      }

      // 2. Create the order
      const { error: orderErr } = await createOrder(
        {
          customer_id: customerId,
          status,
          total_amount: grandTotal,
        },
        draftItems
      );

      if (orderErr) {
        setErrorMsg(orderErr.message || "Failed to create order.");
        setIsSubmitting(false);
        return;
      }

      // Done! Reset state and refresh
      setDraftItems([]);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      onOrderCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green text-sm">
                🛍️
              </span>
              Create New Order
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Select customer, add products, and generate sales order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-50 text-muted hover:bg-slate-100 hover:text-foreground text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-center justify-between">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="font-bold underline text-red-800 text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section 1: Customer & Order Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="new">+ Add New Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Order Status */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="completed">Completed (Deduct Inventory Now)</option>
                <option value="pending">Pending (Reserve/Fulfill Later)</option>
              </select>
            </div>
          </div>

          {/* New Customer Form Fields */}
          {selectedCustomerId === "new" && (
            <div className="rounded-lg border border-border bg-slate-50/60 p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                New Customer Details
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-brand-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0911234567"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-brand-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. abebe@gmail.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-brand-green focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Add Line Items */}
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Add Products to Order
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
              {/* Select Product */}
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Select Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-brand-green focus:outline-none"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={p.quantity <= 0}
                    >
                      {p.name} ({p.quantity} in stock) - {Number(p.price).toFixed(2)} ETB
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.quantity : 9999}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-brand-green focus:outline-none"
                />
              </div>

              {/* Add Item Button */}
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
                >
                  + Add Item
                </button>
              </div>
            </div>

            {selectedProduct && (
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200 text-muted">
                <span>
                  Available Stock: <strong className="text-foreground">{selectedProduct.quantity} units</strong>
                </span>
                <span>
                  Line Subtotal:{" "}
                  <strong className="text-brand-green font-mono">
                    {(Number(selectedProduct.price) * itemQuantity).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ETB
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Draft Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Order Items ({draftItems.length})</span>
              <span className="text-brand-green font-mono font-bold text-sm">
                Total: {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB
              </span>
            </h3>

            {draftItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted">
                No products added to this order yet. Select a product above.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 font-semibold text-muted uppercase tracking-wider">
                      <th className="py-2.5 pl-4 pr-2">Product</th>
                      <th className="px-2 py-2.5 text-right">Price (ETB)</th>
                      <th className="px-2 py-2.5 text-center">Qty</th>
                      <th className="px-2 py-2.5 text-right">Subtotal</th>
                      <th className="py-2.5 pl-2 pr-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    {draftItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 pl-4 pr-2 font-semibold text-foreground">
                          {item.product_name}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono">
                          {Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-2 py-2.5 text-center font-bold">
                          {item.quantity}
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono font-bold text-brand-green">
                          {Number(item.subtotal).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 pl-2 pr-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                            title="Remove line item"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || draftItems.length === 0}
              className="rounded-lg bg-brand-green px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-dark disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? "Creating Order…" : "Submit Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
