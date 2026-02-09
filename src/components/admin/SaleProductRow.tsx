"use client";

import { Minus, Plus, X } from "lucide-react";
import type { Product } from "@/types/product";

interface SaleProductRowProps {
  product: Product;
  cantidad: number;
  onUpdateQty: (cantidad: number) => void;
  onRemove: () => void;
}

export default function SaleProductRow({
  product,
  cantidad,
  onUpdateQty,
  onRemove,
}: SaleProductRowProps) {
  const price = product.precios?.unitario ?? 0;
  const subtotal = price * cantidad;

  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3">
        <div>
          <span className="block text-sm font-medium text-foreground">{product.nombre}</span>
          <span className="text-xs text-muted-foreground">{product.marca}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        ${price}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQty(cantidad - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-lavender-light"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="min-w-[24px] text-center text-sm font-medium text-foreground">
            {cantidad}
          </span>
          <button
            onClick={() => onUpdateQty(cantidad + 1)}
            disabled={cantidad >= product.stock}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-lavender-light disabled:opacity-30"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        ${subtotal}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onRemove}
          className="text-muted-foreground transition-colors hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
