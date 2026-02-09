"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import SaleForm from "@/components/admin/SaleForm";

export default function VentaPage() {
  const { products, loading } = useProducts();

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-lavender-light hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">Generar Venta</h2>
          <p className="text-xs text-muted-foreground">Registrá una venta seleccionando productos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      ) : (
        <SaleForm products={products} />
      )}
    </div>
  );
}
