"use client";

import { ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Product } from "@/types/product";
import { calcPrice } from "@/lib/pricing";

export type SortKey = "nombre" | "marca" | "unitario" | "x3" | "x10" | "decant" | "stock";
export type SortState = { key: SortKey | null; asc: boolean };

interface ProductListProps {
  rows: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onSelectAll: () => void;
  sort: SortState;
  onSort: (key: SortKey) => void;
  fixedProfit: number;
  marginPercent: number;
}

export default function ProductList({
  rows,
  loading,
  onEdit,
  selectMode,
  selected,
  onToggleSelected,
  onSelectAll,
  sort,
  onSort,
  fixedProfit,
  marginPercent,
}: ProductListProps) {
  const pricing = { fixedProfit, marginPercent };

  const handleStockChange = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await update(ref(db, "perfumes/" + productId), { stock: newStock });
    } catch (err) {
      console.error("Error actualizando stock:", err);
    }
  };

  const fmtPrice = (v: number | null) => {
    const p = calcPrice(v, pricing);
    return p != null ? `$${p}` : "—";
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort.key !== col) return null;
    return sort.asc
      ? <ChevronUp className="inline h-3 w-3" />
      : <ChevronDown className="inline h-3 w-3" />;
  };

  const thBase = "px-3 py-3 text-xs font-semibold text-muted-foreground select-none cursor-pointer whitespace-nowrap";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              {selectMode && (
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={onSelectAll}
                    className="accent-violet"
                  />
                </th>
              )}
              <th className={thBase} onClick={() => onSort("nombre")}>
                Perfume <SortIcon col="nombre" />
              </th>
              <th className={`${thBase} hidden sm:table-cell`} onClick={() => onSort("marca")}>
                Marca <SortIcon col="marca" />
              </th>
              <th className={thBase} onClick={() => onSort("stock")}>
                Stock <SortIcon col="stock" />
              </th>
              <th className={thBase} onClick={() => onSort("unitario")}>
                Unidad <SortIcon col="unitario" />
              </th>
              <th className={`${thBase} hidden md:table-cell`} onClick={() => onSort("x3")}>
                x3 <SortIcon col="x3" />
              </th>
              <th className={`${thBase} hidden lg:table-cell`} onClick={() => onSort("x10")}>
                x10 <SortIcon col="x10" />
              </th>
              <th className={`${thBase} hidden lg:table-cell`} onClick={() => onSort("decant")}>
                Decant <SortIcon col="decant" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const isSelected = selected.has(product.id);
              return (
                <tr
                  key={product.id}
                  onClick={() => {
                    if (selectMode) {
                      onToggleSelected(product.id);
                    } else {
                      onEdit(product);
                    }
                  }}
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-lavender-light/50 ${
                    isSelected ? "bg-violet/5" : ""
                  } ${!product.active ? "opacity-50" : ""}`}
                >
                  {selectMode && (
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelected(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-violet"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {product.imagen && (
                        <img
                          src={product.imagen}
                          alt={product.nombre}
                          className="h-8 w-8 rounded-lg border border-border object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="block truncate">{product.nombre}</span>
                        <span className="block text-[10px] text-muted-foreground sm:hidden">{product.marca}</span>
                        {product.label && (
                          <span className="text-[10px] font-bold text-violet">{product.label}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{product.marca}</td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min={0}
                      value={product.stock}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                      className={`w-16 rounded-lg border px-2 py-1 text-center text-sm outline-none focus:border-violet ${
                        product.stock === 0
                          ? "border-danger bg-danger-light text-danger"
                          : "border-border bg-background text-foreground"
                      }`}
                    />
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-foreground">
                    {fmtPrice(product.precios?.unitario ?? null)}
                  </td>
                  <td className="hidden px-3 py-3 text-right text-muted-foreground md:table-cell">
                    {fmtPrice(product.precios?.mayorista_3 ?? null)}
                  </td>
                  <td className="hidden px-3 py-3 text-right text-muted-foreground lg:table-cell">
                    {fmtPrice(product.precios?.mayorista_10 ?? null)}
                  </td>
                  <td className="hidden px-3 py-3 text-right text-muted-foreground lg:table-cell">
                    {fmtPrice(product.precios?.decant ?? null)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron productos
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {rows.length} producto{rows.length !== 1 ? "s" : ""}
        {selectMode && selected.size > 0 && ` · ${selected.size} seleccionado${selected.size !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
