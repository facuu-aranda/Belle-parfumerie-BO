"use client";

import { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/product";
import ConfirmDialog from "./ConfirmDialog";

interface BulkActionsProps {
  selected: Set<string>;
  products: Product[];
  onDone: (msg: string) => void;
}

export default function BulkActions({ selected, products, onDone }: BulkActionsProps) {
  const count = selected.size;
  const [action, setAction] = useState<string | null>(null);

  // Bulk field values
  const [bulkLabel, setBulkLabel] = useState("");
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState("");
  const [bulkDiscountLabel, setBulkDiscountLabel] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedProducts = products.filter((p) => selected.has(p.id));

  const handleBulkLabel = async () => {
    const updates: Record<string, string | null> = {};
    for (const p of selectedProducts) {
      updates[`perfumes/${p.id}/label`] = bulkLabel || null;
    }
    await update(ref(db), updates);
    setBulkLabel("");
    setAction(null);
    onDone(`Label "${bulkLabel || "—"}" aplicado a ${count} productos`);
  };

  const handleBulkDiscount = async () => {
    const pct = parseInt(bulkDiscountPercent);
    if (!pct || pct <= 0 || pct > 100) return;
    const updates: Record<string, unknown> = {};
    for (const p of selectedProducts) {
      updates[`perfumes/${p.id}/oferta`] = {
        activa: true,
        precioOferta: null,
        porcentajeDesc: pct,
        etiqueta: bulkDiscountLabel || `${pct}% OFF`,
        desde: null,
        hasta: null,
      };
    }
    await update(ref(db), updates);
    setBulkDiscountPercent("");
    setBulkDiscountLabel("");
    setAction(null);
    onDone(`Descuento ${pct}% aplicado a ${count} productos`);
  };

  const handleBulkRemoveDiscount = async () => {
    const updates: Record<string, null> = {};
    for (const p of selectedProducts) {
      updates[`perfumes/${p.id}/oferta`] = null;
    }
    await update(ref(db), updates);
    setAction(null);
    onDone(`Oferta removida de ${count} productos`);
  };

  const handleBulkStock = async () => {
    const stock = parseInt(bulkStock);
    if (isNaN(stock) || stock < 0) return;
    const updates: Record<string, number> = {};
    for (const p of selectedProducts) {
      updates[`perfumes/${p.id}/stock`] = stock;
    }
    await update(ref(db), updates);
    setBulkStock("");
    setAction(null);
    onDone(`Stock actualizado a ${stock} en ${count} productos`);
  };

  const handleBulkActivate = async (active: boolean) => {
    const updates: Record<string, boolean> = {};
    for (const p of selectedProducts) {
      updates[`perfumes/${p.id}/active`] = active;
    }
    await update(ref(db), updates);
    setAction(null);
    onDone(`${count} productos ${active ? "activados" : "desactivados"}`);
  };

  const handleBulkDelete = async () => {
    setConfirmDelete(false);
    const promises = selectedProducts.map((p) => remove(ref(db, `perfumes/${p.id}`)));
    await Promise.all(promises);
    setAction(null);
    onDone(`${count} productos eliminados`);
  };

  if (count === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-violet/30 bg-violet/5 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {count} seleccionado{count !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">·</span>

          <button type="button" onClick={() => setAction(action === "label" ? null : "label")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-lavender-light">
            Label
          </button>
          <button type="button" onClick={() => setAction(action === "discount" ? null : "discount")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-lavender-light">
            Descuento
          </button>
          <button type="button" onClick={handleBulkRemoveDiscount}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-lavender-light">
            Quitar oferta
          </button>
          <button type="button" onClick={() => setAction(action === "stock" ? null : "stock")}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-lavender-light">
            Stock
          </button>
          <button type="button" onClick={() => handleBulkActivate(true)}
            className="rounded-lg border border-success px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success-light">
            Activar
          </button>
          <button type="button" onClick={() => handleBulkActivate(false)}
            className="rounded-lg border border-warning px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning-light">
            Desactivar
          </button>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-danger px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light">
            Eliminar
          </button>
        </div>

        {/* Inline forms for bulk actions */}
        {action === "label" && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bulkLabel}
              onChange={(e) => setBulkLabel(e.target.value)}
              placeholder="Ej: Nuevo, Bestseller (vacío para quitar)"
              className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-violet"
            />
            <button type="button" onClick={handleBulkLabel}
              className="h-9 rounded-lg bg-violet px-4 text-xs font-semibold text-btn-primary-text">
              Aplicar
            </button>
          </div>
        )}

        {action === "discount" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bulkDiscountPercent}
              onChange={(e) => setBulkDiscountPercent(e.target.value)}
              placeholder="% descuento"
              min={1}
              max={100}
              className="h-9 w-24 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-violet"
            />
            <input
              type="text"
              value={bulkDiscountLabel}
              onChange={(e) => setBulkDiscountLabel(e.target.value)}
              placeholder="Etiqueta (opcional)"
              className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-violet"
            />
            <button type="button" onClick={handleBulkDiscount}
              className="h-9 rounded-lg bg-violet px-4 text-xs font-semibold text-btn-primary-text">
              Aplicar
            </button>
          </div>
        )}

        {action === "stock" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              placeholder="Nuevo stock"
              min={0}
              className="h-9 w-28 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-violet"
            />
            <button type="button" onClick={handleBulkStock}
              className="h-9 rounded-lg bg-violet px-4 text-xs font-semibold text-btn-primary-text">
              Aplicar
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar productos en lote"
        message={`¿Eliminar ${count} producto${count !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmLabel="Eliminar todos"
        variant="danger"
      />
    </>
  );
}
