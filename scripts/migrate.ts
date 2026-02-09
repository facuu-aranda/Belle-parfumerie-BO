/**
 * ============================================================================
 * SCRIPT DE MIGRACIÓN — Belle Parfumerie BO
 * ============================================================================
 *
 * ¿QUÉ HACE?
 *   Sube productos a Firebase Realtime Database bajo la ruta "perfumes/{id}".
 *   Cada producto se guarda con la estructura definida en src/types/product.ts.
 *
 * ¿DE DÓNDE SACA LOS DATOS?
 *   Lee el archivo src/data/parfums.json que contiene los 232 productos
 *   reales de Belle Parfumerie con todos los campos completos.
 *
 * ¿CUÁNDO EJECUTARLO?
 *   Solo una vez, para poblar Firebase con los datos iniciales.
 *   Después de ejecutarlo, los productos se gestionan desde el backoffice.
 *
 * USO:
 *   npx tsx scripts/migrate.ts
 *
 * REQUISITOS PREVIOS:
 *   1. Tener un proyecto en Firebase con Realtime Database habilitado
 *   2. Crear el archivo .env.local en la raíz del proyecto con las variables:
 *        NEXT_PUBLIC_FIREBASE_API_KEY=...
 *        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *        NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
 *        NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
 *        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
 *        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
 *        NEXT_PUBLIC_FIREBASE_APP_ID=...
 *
 * ============================================================================
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Carga manual de .env.local (sin dependencia de dotenv) ──
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      process.env[key] = value;
    }
  } catch {
    console.error("❌ No se encontró .env.local — crealo primero con las variables de Firebase.");
    process.exit(1);
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.databaseURL) {
  console.error("❌ Falta NEXT_PUBLIC_FIREBASE_DATABASE_URL en .env.local");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── Leer productos desde parfums.json ──
const jsonPath = resolve(__dirname, "../src/data/parfums.json");
let products: Array<{ id: string; nombre: string; marca: string; active: boolean }>;

try {
  products = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch {
  console.error(`❌ No se pudo leer ${jsonPath}`);
  process.exit(1);
}

async function migrate() {
  const active = products.filter((p) => p.active);
  const inactive = products.filter((p) => !p.active);

  console.log("=".repeat(60));
  console.log("  MIGRACIÓN — Belle Parfumerie BO → Firebase");
  console.log("=".repeat(60));
  console.log("");
  console.log(`  Origen:  src/data/parfums.json`);
  console.log(`  Destino: Firebase Realtime DB → ruta "perfumes/{id}"`);
  console.log(`  DB URL:  ${firebaseConfig.databaseURL}`);
  console.log(`  Total:   ${products.length} productos (${active.length} activos, ${inactive.length} sin precio)`);
  console.log("");

  for (const product of products) {
    const status = product.active ? "✓" : "○";
    console.log(`  ${status} ${product.nombre} (${product.marca}) → perfumes/${product.id}`);
    await set(ref(db, `perfumes/${product.id}`), product);
  }

  console.log("");
  console.log(`  ✅ ${products.length} productos migrados correctamente.`);
  console.log("  Verificá en: https://console.firebase.google.com → Realtime Database");
  console.log("");
  console.log("=".repeat(60));
  console.log("  PRÓXIMOS PASOS:");
  console.log("  1. Ejecutar el backoffice: npm run dev (puerto 3001)");
  console.log("  2. Loguearte con admin/admin123");
  console.log("  3. Verificar que los productos aparecen en Gestionar Productos");
  console.log("  4. Integrar el frontend para leer de Firebase");
  console.log("=".repeat(60));
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Error durante la migración:", err);
  process.exit(1);
});
