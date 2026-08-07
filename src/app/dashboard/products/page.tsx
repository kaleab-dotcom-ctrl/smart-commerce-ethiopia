"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";
import { getProducts, Product } from "@/lib/products";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductStats } from "@/components/products/ProductStats";

export default function ProductsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch products from Supabase
  const loadProducts = useCallback(async () => {
    setFetchError(null);
    try {
      const { data, error } = await getProducts();
      if (error) {
        setFetchError(error.message || "Failed to load products.");
      } else {
        setProducts(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFetchError(msg);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Auth check and initial data fetch
  useEffect(() => {
    let isMounted = true;

    getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
      loadProducts();
    });

    return () => {
      isMounted = false;
    };
  }, [router, loadProducts]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
          <p className="text-sm font-medium text-muted">Loading inventory…</p>
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
                  className="rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green transition-colors"
                >
                  Inventory Management
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
          {/* Title & Header Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-foreground">Products</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Inventory & Stock Management
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Manage product catalog, prices in ETB, and real-time inventory levels for your business.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loadingProducts}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green disabled:opacity-60"
            >
              <span className={loadingProducts ? "animate-spin" : ""}>🔄</span>
              <span>{loadingProducts ? "Refreshing…" : "Refresh Table"}</span>
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
                onClick={loadProducts}
                className="font-bold underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats Summary */}
          <ProductStats products={products} />

          {/* Add Product Form */}
          <ProductForm onProductAdded={loadProducts} />

          {/* Product List Table */}
          {loadingProducts ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
              <p className="mt-4 text-xs font-medium text-muted">
                Fetching latest products from database…
              </p>
            </div>
          ) : (
            <ProductTable products={products} onProductDeleted={loadProducts} />
          )}
        </Container>
      </main>
    </div>
  );
}
