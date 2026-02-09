"use client";

import { useState, useMemo, useCallback } from "react";
import { ref, update, push, set as fbSet } from "firebase/database";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { Search } from "lucide-react";
import type { Product, VentaItem } from "@/types/product";
import { useAdminStore } from "@/store/useAdminStore";
import SaleProductRow from "./SaleProductRow";
import ConfirmDialog from "./ConfirmDialog";
import SuccessDialog from "./SuccessDialog";

interface SaleFormProps {
  products: Product[];
}

export default function SaleForm({ products }: SaleFormProps) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmSale, setConfirmSale] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const {
    saleCart,
    addToSaleCart,
    removeFromSaleCart,
    updateSaleCartQty,
    clearSaleCart,
    getSaleTotal,
  } = useAdminStore();

  const total = getSaleTotal();

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products
      .filter(
        (p) =>
          (p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q)) &&
          p.stock > 0 &&
          !saleCart.some((item) => item.product.id === p.id)
      )
      .slice(0, 8);
  }, [search, products, saleCart]);

  const handleAddProduct = (product: Product) => {
    addToSaleCart(product);
    setSearch("");
    setShowDropdown(false);
  };

  const handleFinalizeSale = useCallback(async () => {
    setConfirmSale(false);
    setProcessing(true);
    setError("");

    try {
      // Validate stock
      for (const item of saleCart) {
        const currentProduct = products.find((p) => p.id === item.product.id);
        if (!currentProduct || currentProduct.stock < item.cantidad) {
          setError(`Stock insuficiente para "${item.product.nombre}". Disponible: ${currentProduct?.stock ?? 0}`);
          setProcessing(false);
          return;
        }
      }

      // Atomic stock update
      const updates: Record<string, number> = {};
      saleCart.forEach((item) => {
        const currentProduct = products.find((p) => p.id === item.product.id);
        if (currentProduct) {
          updates[`perfumes/${item.product.id}/stock`] = currentProduct.stock - item.cantidad;
        }
      });
      await update(ref(db), updates);

      // Register sale
      const session = getSession();
      const ventaItems: VentaItem[] = saleCart.map((item) => ({
        productId: item.product.id,
        nombre: item.product.nombre,
        marca: item.product.marca,
        cantidad: item.cantidad,
        precioUnitario: item.product.precios?.unitario ?? 0,
        subtotal: (item.product.precios?.unitario ?? 0) * item.cantidad,
      }));

      const ventaRef = push(ref(db, "ventas"));
      await fbSet(ventaRef, {
        id: ventaRef.key,
        fecha: new Date().toISOString(),
        items: ventaItems,
        total,
        vendedor: session?.username ?? "desconocido",
      });

      setShowSuccess(true);
      clearSaleCart();
    } catch (err) {
      console.error("Error procesando venta:", err);
      setError("Error al procesar la venta. Intentá de nuevo.");
    }

    setProcessing(false);
  }, [saleCart, products, total, clearSaleCart]);

  return (
    <div>
      {/* Product search */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar producto para agregar..."
            className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-violet"
          />
        </div>

        {/* Dropdown results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-lavender-light/50"
              >
                <div>
                  <span className="block text-sm font-medium text-foreground">{product.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.marca} · Stock: {product.stock}
                  </span>
                </div>
                <span className="text-sm font-medium text-violet">
                  ${product.precios?.unitario ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sale cart table */}
      {saleCart.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Producto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Cantidad</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Subtotal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {saleCart.map((item) => (
                  <SaleProductRow
                    key={item.product.id}
                    product={item.product}
                    cantidad={item.cantidad}
                    onUpdateQty={(qty) => updateSaleCartQty(item.product.id, qty)}
                    onRemove={() => removeFromSaleCart(item.product.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Total + Finalize */}
          <div className="mt-6 flex flex-col items-end gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total de la venta</p>
              <p className="text-2xl font-bold text-foreground">${total}</p>
            </div>

            {error && (
              <p className="w-full rounded-lg bg-danger-light px-3 py-2 text-xs font-medium text-danger">
                {error}
              </p>
            )}

            <button
              onClick={() => setConfirmSale(true)}
              disabled={processing || saleCart.length === 0}
              className="rounded-xl bg-btn-primary px-8 py-3 text-sm font-semibold text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:opacity-50"
            >
              {processing ? "Procesando..." : "Finalizar venta"}
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Buscá y agregá productos para generar una venta
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmSale}
        title="Confirmar venta"
        message={`¿Confirmar la venta por $${total}? (${saleCart.length} producto${saleCart.length !== 1 ? "s" : ""})`}
        onConfirm={handleFinalizeSale}
        onCancel={() => setConfirmSale(false)}
        confirmLabel="Confirmar venta"
      />

      <SuccessDialog
        open={showSuccess}
        message="Venta registrada correctamente"
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
