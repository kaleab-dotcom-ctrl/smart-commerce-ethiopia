"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { getProducts, Product } from "@/lib/products";
import { getSales, Sale } from "@/lib/sales";
import { SalesForm } from "@/components/sales/SalesForm";
import { SalesTable } from "@/components/sales/SalesTable";
import { SalesStats } from "@/components/sales/SalesStats";

export default function SalesPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch products and sales from Supabase
  const loadData = useCallback(async () => {
    setFetchError(null);
    setLoadingData(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        getProducts(),
        getSales(),
      ]);

      if (productsRes.error) {
        setFetchError(productsRes.error.message || "Failed to load products.");
      } else {
        setProducts(productsRes.data || []);
      }

      if (salesRes.error) {
        setFetchError((prev) =>
          prev ? `${prev} | ${salesRes.error.message}` : salesRes.error.message || "Failed to load sales."
        );
      } else {
        setSales(salesRes.data || []);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setFetchError(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Auth check and initial data load
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
                  className="rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green transition-colors"
                >
                  Sales
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-slate-100 transition-colors"
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

      {/* Main Content */}
      <main className="py-8">
        <Container className="space-y-8">
          {/* Title & Header Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-foreground">Sales</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Sales Management
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Record customer transactions, track total revenue in ETB, and manage sales history.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loadingData}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:opacity-60"
            >
              <span className={loadingData ? "animate-spin" : ""}>🔄</span>
              <span>{loadingData ? "Refreshing…" : "Refresh Data"}</span>
            </button>
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

          {/* Stats Summary */}
          <SalesStats sales={sales} />

          {/* Record Sale Form */}
          <SalesForm products={products} onSaleAdded={loadData} />

          {/* Sales History Table */}
          {loadingData ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
              <p className="mt-4 text-xs font-medium text-muted">
                Fetching latest sales records…
              </p>
            </div>
          ) : (
            <SalesTable sales={sales} onSaleDeleted={loadData} />
          )}
        </Container>
      </main>
    </div>
  );
}
