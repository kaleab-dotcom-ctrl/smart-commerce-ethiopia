"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSession } from "@/lib/auth";

export function DashboardShell() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <span className="text-base font-bold text-foreground">
              Smart Commerce{" "}
              <span className="text-brand-green">Ethiopia</span>
            </span>
            <LogoutButton />
          </div>
        </Container>
      </header>

      <main>
        <Container className="py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome to Smart Commerce Ethiopia
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Your dashboard is ready. Inventory, sales, and business insights will
            appear here as you build out the platform.
          </p>
        </Container>
      </main>
    </div>
  );
}
