"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { validateCredentials, saveSession } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const user = validateCredentials(username, password);
    if (!user) {
      setError("Usuario o contraseña incorrectos");
      setLoading(false);
      return;
    }

    saveSession(user);
    router.push("/admin/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground">
          Usuario
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresá tu usuario"
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-violet"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-muted-foreground">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresá tu contraseña"
            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm text-foreground outline-none transition-colors focus:border-violet"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-btn-primary py-3 text-sm font-semibold text-btn-primary-text transition-all duration-300 hover:bg-btn-primary-hover hover:shadow-lg disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
