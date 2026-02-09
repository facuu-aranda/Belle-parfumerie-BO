import type { Product } from "@/types/product";

export function calcPrice(
  value: number | null,
  opts: { fixedProfit: number; marginPercent: number },
): number | null {
  if (value == null) return null;

  const f = Number.isFinite(opts.fixedProfit) ? opts.fixedProfit : 0;
  const m = Number.isFinite(opts.marginPercent) ? opts.marginPercent : 0;

  return Math.round((value + f) * (1 + m / 100));
}

export function calcOfferPrice(product: Product): number | null {
  if (!product.oferta?.activa || product.precios?.unitario == null) return null;

  const now = new Date();
  if (product.oferta.desde && new Date(product.oferta.desde) > now) return null;
  if (product.oferta.hasta && new Date(product.oferta.hasta) < now) return null;

  if (product.oferta.precioOferta != null) return product.oferta.precioOferta;

  if (product.oferta.porcentajeDesc != null) {
    return Math.round(product.precios!.unitario! * (1 - product.oferta.porcentajeDesc / 100));
  }

  return null;
}
