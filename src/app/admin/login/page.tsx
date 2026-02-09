"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Belle Parfumerie
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel de Administración
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
