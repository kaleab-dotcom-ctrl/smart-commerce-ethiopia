"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { getProducts, Product } from "@/lib/products";
import { getCustomers, Customer } from "@/lib/customers";
import { getOrders, Order } from "@/lib/orders";
import { OrderStats } from "@/components/orders/OrderStats";
import { OrderTable } from "@/components/orders/OrderTable";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";

export default function OrdersPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load all necessary data from Supabase
  const loadData = useCallback(async () => {
    setFetchError(null);
    setLoadingData(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ]);

      if (ordersRes.error) {
        setFetchError(ordersRes.error.message || "Failed to load orders.");
      } else {
        setOrders(ordersRes.data || []);
      }

      if (customersRes.data) {
        setCustomers(customersRes.data);
      }

      if (productsRes.data) {
        setProducts(productsRes.data);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setFetchError(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Auth check & data fetch
  useEffect(() => {
    let isMounted = true;

    getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
      loadData();
    });

    return () => {
      isMounted = false;
    };
  }, [router, loadData]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
          <p className="text-sm font-medium text-muted">Checking authentication…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xs">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">
                  Smart Commerce{" "}
                  <span className="text-brand-green">Ethiopia</span>
                </span>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/products"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard/sales"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
                >
                  Sales
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green transition-colors"
                >
                  Orders
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content Area */}
      <main className="py-8">
        <Container className="space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-foreground">Orders</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Orders & Fulfillment
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Create customer orders, process sales, and track fulfillment in ETB.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loadingData}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:opacity-60"
              >
                <span className={loadingData ? "animate-spin" : ""}>🔄</span>
                <span>{loadingData ? "Refreshing…" : "Refresh"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-green-dark transition-colors"
              >
                <span>+ Create Order</span>
              </button>
            </div>
          </div>

          {fetchError && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700"
            >
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{fetchError}</span>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="font-bold underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats KPI Section */}
          <OrderStats orders={orders} />

          {/* Orders Table */}
          {loadingData && orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
              <p className="mt-4 text-xs font-medium text-muted">
                Loading orders & customer data…
              </p>
            </div>
          ) : (
            <OrderTable
              orders={orders}
              onOrderUpdated={loadData}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {/* Create Order Modal */}
          <CreateOrderModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            products={products}
            customers={customers}
            onOrderCreated={loadData}
          />
        </Container>
      </main>
    </div>
  );
}
