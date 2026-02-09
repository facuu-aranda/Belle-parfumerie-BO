/**
 * Script auxiliar: parsea ParfumsData.txt y genera parfums.json
 * con todos los campos requeridos por el type Product.
 *
 * Uso: npx tsx scripts/generate-json.ts
 * Salida: src/data/parfums.json
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { v4 as uuidv4 } from "uuid";

// Read the raw data file
const raw = readFileSync(resolve(__dirname, "../src/data/ParfumsData.txt"), "utf-8");

// Extract the array content between [ and ]
const arrayMatch = raw.match(/\[[\s\S]*\]/);
if (!arrayMatch) {
  console.error("No se encontró el array en ParfumsData.txt");
  process.exit(1);
}

// Use Function constructor to evaluate the array (safe since it's our own data)
const rawProducts: Array<{
  nombre: string;
  genero: string;
  unidad: number | null;
  x3: number | null;
  x10: number | null;
  decant: number | null;
}> = new Function(`return ${arrayMatch[0]}`)();

console.log(`Parseados ${rawProducts.length} productos del archivo fuente.\n`);

// ── Helpers to parse the "nombre" field ──
// Format examples:
//   "Afnan - 9AM Dive | EDP | 100ml"
//   "Calvin Klein - CK One | EDT | 200 ml"
//   "Lattafa - Yara Kit | 4x25ml | EDP |"
//   "Afnan - 9AM Coral Pour Femme"  (no concentration/volume)

function parseNombre(raw: string): {
  marca: string;
  nombre: string;
  concentracion: string | null;
  volumen: string | null;
} {
  const trimmed = raw.trim().replace(/\s*\|\s*$/, ""); // remove trailing pipe

  // Split by " - " to get brand and rest
  const dashIdx = trimmed.indexOf(" - ");
  if (dashIdx === -1) {
    return { marca: "Desconocida", nombre: trimmed, concentracion: null, volumen: null };
  }

  const marca = trimmed.slice(0, dashIdx).trim();
  const rest = trimmed.slice(dashIdx + 3).trim();

  // Split rest by " | "
  const parts = rest.split("|").map((s) => s.trim()).filter(Boolean);

  if (parts.length === 1) {
    // No pipes — just the product name
    return { marca, nombre: parts[0], concentracion: null, volumen: null };
  }

  const nombre = parts[0];
  let concentracion: string | null = null;
  let volumen: string | null = null;

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    // Check if it looks like a volume (contains "ml")
    if (/\d+\s*ml/i.test(p)) {
      volumen = p.replace(/\s+/g, "");
    }
    // Check if it looks like a concentration
    else if (/^(EDP|EDT|Parfum|Extrait|Elixir)/i.test(p)) {
      concentracion = p;
    }
    // Could be a mixed field like "4x25ml"
    else if (/\d+x\d+ml/i.test(p)) {
      volumen = p.replace(/\s+/g, "");
    }
  }

  return { marca, nombre, concentracion, volumen };
}

// Determine estilo based on marca
function getEstilo(marca: string): "Designer" | "Arabe" {
  const arabBrands = [
    "Afnan", "Al Haramain", "Al Wataniah", "Asdaaf", "Lattafa",
    "Rasasi", "Rayhaan", "Zimaya", "French Avenue", "Emper"
  ];
  return arabBrands.some((b) => marca.toLowerCase().startsWith(b.toLowerCase()))
    ? "Arabe"
    : "Designer";
}

// Build the full Product objects
const products = rawProducts.map((raw) => {
  const parsed = parseNombre(raw.nombre);

  return {
    id: uuidv4(),
    nombre: parsed.nombre,
    label: null,
    marca: parsed.marca,
    genero: raw.genero as "Masculino" | "Femenino" | "Unisex",
    estilo: getEstilo(parsed.marca),
    concentracion: parsed.concentracion,
    volumen: parsed.volumen,
    imagen: null,
    notas: "",
    costo: null,
    temporadas: [] as string[],
    horarios: [] as string[],
    ocasiones: [] as string[],
    versatilidad: 3 as 1 | 2 | 3 | 4 | 5,
    edades: ["Todos"] as string[],
    precios: {
      unitario: raw.unidad,
      mayorista_3: raw.x3,
      mayorista_10: raw.x10,
      decant: raw.decant,
    },
    stock: raw.unidad !== null ? 5 : 0, // default stock: 5 if has price, 0 if no price
    oferta: null,
    active: raw.unidad !== null, // active only if it has a unit price
  };
});

const outputPath = resolve(__dirname, "../src/data/parfums.json");
writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");

console.log(`✅ Generado: ${outputPath}`);
console.log(`   ${products.length} productos totales`);
console.log(`   ${products.filter((p) => p.active).length} activos (con precio unitario)`);
console.log(`   ${products.filter((p) => !p.active).length} inactivos (sin precio unitario)`);
