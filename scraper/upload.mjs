#!/usr/bin/env node
/**
 * Belle Parfumerie — Upload scraped images to Cloudinary + update Firebase
 *
 * Reads results.json + local images, uploads each to Cloudinary,
 * then updates the "imagen" field in Firebase for each perfume.
 *
 * Usage:
 *   node upload.mjs                  # upload all with status "ok"
 *   node upload.mjs --dry-run        # preview without uploading
 *   node upload.mjs --skip-uploaded  # skip already uploaded (has cloudinary URL)
 *   node upload.mjs --limit=5        # only process first N
 *
 * Requires .env.local in the BO project root with:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
 *   NEXT_PUBLIC_FIREBASE_* vars
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sleep, rand, loadEnv } from "./helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SKIP_UPLOADED = args.includes("--skip-uploaded");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

// ── Load env ─────────────────────────────────────────────────
loadEnv(path.join(__dirname, "..", ".env.local"));

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error("❌ Faltan variables de Cloudinary en .env.local:");
  console.error("   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  console.error("   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
  process.exit(1);
}

// ── Paths ────────────────────────────────────────────────────
const IMAGES_DIR = path.join(__dirname, "images");
const RESULTS_PATH = path.join(__dirname, "results.json");
const UPLOAD_LOG_PATH = path.join(__dirname, "upload-log.json");

if (!fs.existsSync(RESULTS_PATH)) {
  console.error("❌ No se encontró results.json. Ejecutá primero: node scrape.mjs");
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf-8"));

// Load or create upload log (tracks what's been uploaded)
let uploadLog = {};
if (fs.existsSync(UPLOAD_LOG_PATH)) {
  uploadLog = JSON.parse(fs.readFileSync(UPLOAD_LOG_PATH, "utf-8"));
}

function saveUploadLog() {
  fs.writeFileSync(UPLOAD_LOG_PATH, JSON.stringify(uploadLog, null, 2));
}

// ── Firebase setup ───────────────────────────────────────────
let db = null;
try {
  const { initializeApp, getApps } = await import("firebase/app");
  const { getDatabase } = await import("firebase/database");

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (config.databaseURL) {
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getDatabase(app);
    console.log("✅ Firebase conectado");
  }
} catch (err) {
  console.error("⚠️  Firebase no disponible:", err.message);
}

if (!db) {
  console.error("❌ Firebase es requerido para actualizar los perfumes");
  process.exit(1);
}

const { ref, update } = await import("firebase/database");

// ── Upload to Cloudinary ─────────────────────────────────────
async function uploadToCloudinary(filePath, perfumeId) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("file", blob, `${perfumeId}.jpg`);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("cloud_name", CLOUD_NAME);
  formData.append("folder", "belle-parfumerie/perfumes");
  formData.append("public_id", perfumeId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.secure_url;
}

// ── Update Firebase ──────────────────────────────────────────
async function updateFirebaseImage(perfumeId, imageUrl) {
  await update(ref(db, `perfumes/${perfumeId}`), { imagen: imageUrl });
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // Get all entries with status "ok" (successfully scraped)
  const entries = Object.entries(results)
    .filter(([, v]) => v.status === "ok")
    .slice(0, LIMIT);

  console.log(`\n🚀 ${entries.length} imágenes para subir${DRY_RUN ? " (DRY RUN)" : ""}...\n`);

  let success = 0, failed = 0, skipped = 0;

  for (let i = 0; i < entries.length; i++) {
    const [perfumeId, data] = entries[i];
    const tag = `[${i + 1}/${entries.length}]`;
    const localFile = path.join(IMAGES_DIR, data.file);

    console.log(`\n${tag} 📤 ${perfumeId}`);
    console.log(`   📁 ${data.file} → Fragrantica: ${data.fragrantica}`);

    // Skip if already uploaded
    if (SKIP_UPLOADED && uploadLog[perfumeId]?.cloudinaryUrl) {
      console.log(`   ⏭️  Ya subida: ${uploadLog[perfumeId].cloudinaryUrl}`);
      skipped++;
      continue;
    }

    // Check local file exists
    if (!fs.existsSync(localFile)) {
      console.log(`   ⚠️  Archivo no encontrado: ${localFile}`);
      failed++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`   🏜️  Dry run — subiría ${data.file} a Cloudinary y actualizaría Firebase`);
      continue;
    }

    try {
      // 1. Upload to Cloudinary
      console.log(`   ☁️  Subiendo a Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(localFile, perfumeId);
      console.log(`   ✅ Cloudinary: ${cloudinaryUrl}`);

      // 2. Update Firebase
      console.log(`   🔥 Actualizando Firebase...`);
      await updateFirebaseImage(perfumeId, cloudinaryUrl);
      console.log(`   ✅ Firebase actualizado`);

      // 3. Log success
      uploadLog[perfumeId] = {
        cloudinaryUrl,
        fragrantica: data.fragrantica,
        uploadedAt: new Date().toISOString(),
      };
      saveUploadLog();
      success++;

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      uploadLog[perfumeId] = { error: err.message, attemptedAt: new Date().toISOString() };
      saveUploadLog();
      failed++;
    }

    // Small delay between uploads
    if (i < entries.length - 1) {
      await sleep(rand(500, 1500));
    }
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Subidas: ${success} | ❌ Fallos: ${failed} | ⏭️  Saltadas: ${skipped}`);
  console.log(`📋 Log: ${UPLOAD_LOG_PATH}`);
  console.log(`${"═".repeat(50)}\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
