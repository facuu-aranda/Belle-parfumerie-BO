/**
 * Rellena los campos vacíos de parfums.json con datos coherentes
 * basados en el nombre, marca, género y concentración de cada producto.
 *
 * Uso: npx tsx scripts/fill-data.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const filePath = resolve(__dirname, "../src/data/parfums.json");
const products = JSON.parse(readFileSync(filePath, "utf-8"));

// ── Keyword-based note assignment ──
// Maps keywords in product name to olfactory notes
const noteRules: Array<{ keywords: string[]; notas: string }> = [
  // Oud / Ambar / Oriental
  { keywords: ["oud", "aoud"], notas: "Oud, Ámbar, Sándalo — Amaderada Oriental" },
  { keywords: ["amber", "ambar", "ámbar"], notas: "Ámbar, Vainilla, Almizcle — Oriental Ambarado" },
  { keywords: ["sahara", "desert"], notas: "Ámbar, Incienso, Madera de Agar — Oriental Desértico" },
  // Rose / Floral
  { keywords: ["rose", "rosa", "floral", "flower"], notas: "Rosa, Jazmín, Almizcle Blanco — Floral" },
  { keywords: ["peonía", "peony", "bloom"], notas: "Peonía, Magnolia, Almizcle — Floral Fresco" },
  { keywords: ["silky rose", "noble blush"], notas: "Rosa de Damasco, Peonía, Vainilla — Floral Suave" },
  // Fruity / Sweet
  { keywords: ["cherry", "candy", "banoffi", "pistache", "chocolat"], notas: "Frutas Rojas, Vainilla, Caramelo — Gourmand Frutal" },
  { keywords: ["yara", "haya", "eclaire"], notas: "Frutas Tropicales, Vainilla, Almizcle — Frutal Dulce" },
  { keywords: ["mayar"], notas: "Frambuesa, Rosa, Vainilla — Frutal Floral" },
  // Fresh / Aquatic / Citric
  { keywords: ["aqua", "ice", "blue", "dive", "fresh", "fraiche", "eau de montagne"], notas: "Notas Acuáticas, Cítricos, Almizcle — Acuática Fresca" },
  { keywords: ["sport", "ultra"], notas: "Bergamota, Lavanda, Cedro — Aromática Deportiva" },
  { keywords: ["limoni", "citrus", "neroli"], notas: "Limón, Neroli, Vetiver — Cítrica Fresca" },
  // Spicy / Warm
  { keywords: ["noir", "black", "nuit", "night", "dark"], notas: "Especias, Cuero, Oud — Especiada Oscura" },
  { keywords: ["intense", "elixir", "extrait", "extreme"], notas: "Especias Cálidas, Ámbar, Pachulí — Intensa Especiada" },
  { keywords: ["fire", "feu", "flame", "flaming"], notas: "Canela, Azafrán, Ámbar — Especiada Cálida" },
  { keywords: ["rebel", "rage", "tyrant", "combat", "untamed"], notas: "Pimienta Negra, Cuero, Vetiver — Especiada Intensa" },
  // Woody
  { keywords: ["santal", "wood", "brun", "leather", "cuero"], notas: "Sándalo, Cedro, Vetiver — Amaderada" },
  { keywords: ["vetiver", "cedar", "cedro"], notas: "Vetiver, Cedro, Bergamota — Amaderada Verde" },
  // Gourmand
  { keywords: ["khamrah", "bourbon", "qahwa", "dukhan", "coffee"], notas: "Canela, Vainilla, Café — Gourmand Especiado" },
  // Powdery / Elegant
  { keywords: ["gold", "golden", "imperial", "king", "queen", "dynasty", "collector"], notas: "Azafrán, Rosa, Oud — Oriental Lujoso" },
  { keywords: ["velvet", "satin", "silk"], notas: "Iris, Vainilla, Almizcle — Empolvado Elegante" },
  // Aromatic / Classic
  { keywords: ["homme", "man", "men"], notas: "Bergamota, Lavanda, Almizcle — Aromática Masculina" },
  { keywords: ["woman", "femme", "donna", "her"], notas: "Rosa, Peonía, Almizcle Blanco — Floral Femenina" },
  // Generic by concentration
  { keywords: ["edp"], notas: "Notas Amaderadas, Especias, Almizcle — Eau de Parfum" },
  { keywords: ["edt"], notas: "Cítricos, Notas Verdes, Almizcle — Eau de Toilette" },
];

function getNotas(nombre: string, concentracion: string | null, genero: string): string {
  const searchStr = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  for (const rule of noteRules) {
    if (rule.keywords.some((kw) => searchStr.includes(kw.toLowerCase()))) {
      return rule.notas;
    }
  }

  // Fallback by gender
  if (genero === "Femenino") return "Flores Blancas, Vainilla, Almizcle — Floral Oriental";
  if (genero === "Masculino") return "Bergamota, Madera de Cedro, Almizcle — Amaderada Aromática";
  return "Notas Amaderadas, Especias, Almizcle — Oriental Unisex";
}

// ── Temporadas based on concentration and name keywords ──
function getTemporadas(nombre: string, concentracion: string | null, genero: string): string[] {
  const s = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  // Fresh/aquatic → Primavera + Verano
  if (/aqua|ice|blue|dive|fresh|fraiche|sport|ultra|limoni|citrus|montagne/.test(s)) {
    return ["Primavera", "Verano"];
  }
  // Dark/intense/oud → Otoño + Invierno
  if (/noir|black|nuit|night|dark|oud|aoud|elixir|extrait|extreme|khamrah|bourbon|combat|rebel|rage|fire|feu/.test(s)) {
    return ["Otoño", "Invierno"];
  }
  // Floral/fruity → Primavera + Verano
  if (/rose|rosa|floral|cherry|candy|yara|haya|eclaire|mayar|bloom|flower/.test(s)) {
    return ["Primavera", "Verano"];
  }
  // Parfum/Extrait → Otoño + Invierno (heavier)
  if (/parfum|extrait/.test(s)) {
    return ["Otoño", "Invierno"];
  }
  // EDP default → versatile
  if (genero === "Femenino") return ["Primavera", "Otoño"];
  return ["Otoño", "Invierno"];
}

// ── Horarios ──
function getHorarios(nombre: string, concentracion: string | null): string[] {
  const s = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  if (/aqua|ice|blue|dive|fresh|fraiche|sport|ultra|limoni|citrus|montagne/.test(s)) {
    return ["Mañana", "Tarde"];
  }
  if (/noir|black|nuit|night|dark|elixir|extrait|extreme|parfum|combat|rebel|rage|fire/.test(s)) {
    return ["Tarde", "Noche"];
  }
  if (/rose|rosa|floral|cherry|candy|yara|haya|eclaire|mayar/.test(s)) {
    return ["Mañana", "Tarde"];
  }
  return ["Tarde", "Noche"];
}

// ── Ocasiones ──
function getOcasiones(nombre: string, concentracion: string | null, genero: string): string[] {
  const s = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  if (/sport|ultra|fresh|fraiche|aqua|dive|ice|montagne|limoni/.test(s)) {
    return ["Casual", "Deporte"];
  }
  if (/noir|black|nuit|night|gold|imperial|king|queen|collector|dynasty|combat|extreme/.test(s)) {
    return ["Formal", "Cita"];
  }
  if (/elixir|extrait|parfum/.test(s)) {
    return ["Formal", "Cita", "Fiesta"];
  }
  if (/rose|rosa|candy|cherry|yara|haya|eclaire|mayar/.test(s)) {
    return ["Casual", "Cita"];
  }
  if (genero === "Femenino") return ["Casual", "Cita"];
  return ["Casual", "Trabajo"];
}

// ── Versatilidad (1-5) ──
function getVersatilidad(nombre: string, concentracion: string | null): 1 | 2 | 3 | 4 | 5 {
  const s = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  // Very niche/heavy → low versatility
  if (/extrait|parfum|extreme|collector|combat|oud|aoud/.test(s)) return 2;
  // Fresh/sport → high versatility
  if (/aqua|sport|fresh|fraiche|ultra|dive|ice|montagne|limoni|citrus/.test(s)) return 5;
  // Elixir → medium-low
  if (/elixir|intense|noir|black/.test(s)) return 2;
  // Floral/fruity → medium-high
  if (/rose|rosa|candy|cherry|yara|haya|eclaire|mayar|floral/.test(s)) return 4;
  return 3;
}

// ── Edades ──
function getEdades(nombre: string, concentracion: string | null, genero: string): string[] {
  const s = `${nombre} ${concentracion ?? ""}`.toLowerCase();

  if (/sport|fresh|fraiche|ultra|dive|ice|candy|yara/.test(s)) return ["Juvenil", "Joven"];
  if (/extrait|parfum|extreme|collector|king|queen|dynasty|imperial|combat/.test(s)) return ["Adulto"];
  if (/elixir|noir|black|oud|aoud/.test(s)) return ["Joven", "Adulto"];
  return ["Joven", "Adulto"];
}

// ── Process all products ──
let filled = 0;
for (const p of products) {
  let changed = false;

  if (!p.notas || p.notas === "") {
    p.notas = getNotas(p.nombre, p.concentracion, p.genero);
    changed = true;
  }
  if (!p.temporadas || p.temporadas.length === 0) {
    p.temporadas = getTemporadas(p.nombre, p.concentracion, p.genero);
    changed = true;
  }
  if (!p.horarios || p.horarios.length === 0) {
    p.horarios = getHorarios(p.nombre, p.concentracion);
    changed = true;
  }
  if (!p.ocasiones || p.ocasiones.length === 0) {
    p.ocasiones = getOcasiones(p.nombre, p.concentracion, p.genero);
    changed = true;
  }
  if (p.versatilidad === 3 && changed) {
    p.versatilidad = getVersatilidad(p.nombre, p.concentracion);
  }
  if (p.edades.length === 1 && p.edades[0] === "Todos" && changed) {
    p.edades = getEdades(p.nombre, p.concentracion, p.genero);
  }

  if (changed) filled++;
}

writeFileSync(filePath, JSON.stringify(products, null, 2), "utf-8");

console.log(`✅ ${filled} productos actualizados con datos completos.`);
console.log(`   Total: ${products.length} productos en parfums.json`);
