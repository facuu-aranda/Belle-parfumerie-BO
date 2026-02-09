"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession, type AuthUser } from "@/lib/auth";
import { LogOut, Sun, Moon } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/admin/login");
    } else {
      setUser(session);
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("bo-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.dataset.theme = isDark ? "dark" : "light";
    localStorage.setItem("bo-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    clearSession();
    router.replace("/admin/login");
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  if (!checked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">Belle Parfumerie</h1>
            <p className="text-xs text-muted-foreground">
              Backoffice · {user.role === "admin" ? "Administrador" : "Vendedor"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-lavender-light hover:text-foreground"
              aria-label="Cambiar tema"
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-danger hover:bg-danger-light hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
