import { calcPrice } from "@/lib/pricing";
import type { Product } from "@/types/product";

export async function exportAsTxt(params: {
  rows: Product[];
  fixedProfit: number;
  marginPercent: number;
}): Promise<void> {
  const pricing = { fixedProfit: params.fixedProfit, marginPercent: params.marginPercent };
  const txt = params.rows
    .map((p) => {
      const price = calcPrice(p.precios?.unitario ?? null, pricing);
      return `${p.marca} - ${p.nombre} | ${price != null ? `$${price}` : "Sin precio"}`;
    })
    .join("\n");

  await navigator.clipboard.writeText(txt);
}

export function exportAsJpg(params: {
  rows: Product[];
  fixedProfit: number;
  marginPercent: number;
}): void {
  const pricing = { fixedProfit: params.fixedProfit, marginPercent: params.marginPercent };
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const rowH = 30;
  const headerH = 50;
  canvas.width = 900;
  canvas.height = headerH + params.rows.length * rowH + 20;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#9e1906";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Belle Parfumerie — Catálogo", 20, 35);

  ctx.fillStyle = "#000";
  ctx.font = "14px sans-serif";

  let y = headerH + 20;
  for (const p of params.rows) {
    const price = calcPrice(p.precios?.unitario ?? null, pricing);
    ctx.fillText(`${p.marca} - ${p.nombre}`, 20, y);
    ctx.fillText(price != null ? `$${price}` : "—", 600, y);
    y += rowH;
  }

  const a = document.createElement("a");
  a.download = "catalogo-belle.jpg";
  a.href = canvas.toDataURL("image/jpeg", 0.9);
  a.click();
}
