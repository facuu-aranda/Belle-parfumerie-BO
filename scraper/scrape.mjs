#!/usr/bin/env node
/**
 * Belle Parfumerie — Fragrantica Image Scraper
 *
 * Usage:
 *   node scrape.mjs                  # scrape all
 *   node scrape.mjs --dry-run        # preview without downloading
 *   node scrape.mjs --skip-existing  # skip already downloaded images
 *   node scrape.mjs --headed         # show browser window (debug)
 *   node scrape.mjs --limit=10       # only process first N perfumes
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sleep, rand, downloadImage, loadEnv } from "./helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SKIP_EXISTING = args.includes("--skip-existing");
const HEADED = args.includes("--headed");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

// ── Load perfumes (Firebase → JSON fallback) ─────────────────
async function loadPerfumes() {
  // Try Firebase first
  try {
    loadEnv(path.join(__dirname, "..", ".env.local"));
    const { initializeApp, getApps } = await import("firebase/app");
    const { getDatabase, ref, get } = await import("firebase/database");

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
      const db = getDatabase(app);
      const snapshot = await get(ref(db, "perfumes"));
      if (snapshot.exists()) {
        const list = Object.values(snapshot.val());
        console.log(`✅ Firebase: ${list.length} perfumes`);
        return list;
      }
    }
  } catch (_) {
    /* fall through */
  }

  // Fallback: local JSON
  const jsonPath = path.join(__dirname, "..", "src", "data", "parfums.json");
  if (fs.existsSync(jsonPath)) {
    const list = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    console.log(`📁 JSON local: ${list.length} perfumes`);
    return list;
  }

  console.error("❌ Sin datos. Configurá Firebase o usá parfums.json");
  process.exit(1);
}

// ── Output dirs ──────────────────────────────────────────────
const IMAGES_DIR = path.join(__dirname, "images");
const RESULTS_PATH = path.join(__dirname, "results.json");
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

let results = {};
if (fs.existsSync(RESULTS_PATH)) {
  results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf-8"));
}

function saveResults() {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

// ── Debug dir ────────────────────────────────────────────────
const DEBUG_DIR = path.join(__dirname, "debug");
if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });

// ── Homepage state (avoid reloading every time) ─────────────
let onHomepage = false;

async function goHome(page) {
  await page.goto("https://www.fragrantica.es/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(rand(1500, 2500));
  // Accept cookies once
  try {
    const btn = await page.$("button#onetrust-accept-btn-handler, .accept-cookies, [aria-label='Aceptar']");
    if (btn) { await btn.click(); await sleep(500); }
  } catch (_) {}
  onHomepage = true;
}

// ── Scrape one perfume ───────────────────────────────────────
async function scrapePerfume(page, perfume, index, total) {
  const { id, nombre, marca } = perfume;
  const tag = `[${index + 1}/${total}]`;
  const fileName = `${id}.jpg`;
  const filePath = path.join(IMAGES_DIR, fileName);

  console.log(`\n${tag} 🔍 ${marca} — ${nombre}`);

  if (SKIP_EXISTING && fs.existsSync(filePath)) {
    console.log(`   ⏭️  Ya existe, saltando`);
    return;
  }

  if (DRY_RUN) {
    console.log(`   🏜️  Dry run — buscaría: "${nombre}"`);
    return;
  }

  try {
    // 1. Ensure we're on the Fragrantica homepage
    if (!onHomepage) await goHome(page);

    // 2. Click the search bar to open the search MODAL overlay
    //    The bar has placeholder "Buscar perfumes, artículos, diseñadores..."
    //    Clicking it opens a full-screen modal (URL does NOT change)
    const searchBar = await page.$("input[placeholder*='Buscar']");
    if (searchBar) {
      await searchBar.click();
    } else {
      // Fallback: use Ctrl+K keyboard shortcut
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyK");
      await page.keyboard.up("Control");
    }
    await sleep(rand(800, 1500));

    // 3. Now the modal overlay is open with its own input field
    //    Find the visible/focused input inside the modal and type
    const searchQuery = nombre; // just the perfume name works best
    let modalInput = null;

    // Try multiple strategies to find the modal's input
    const candidates = await page.$$("input[placeholder*='Buscar'], input[type='search'], input:focus");
    for (const inp of candidates) {
      const box = await inp.boundingBox();
      if (box && box.width > 100) { modalInput = inp; break; }
    }

    if (!modalInput) {
      await page.screenshot({ path: path.join(DEBUG_DIR, `${id}_no_input.png`) });
      console.log(`   ⚠️  No se encontró input del modal (debug: debug/${id}_no_input.png)`);
      results[id] = { status: "error", error: "modal input not found" };
      saveResults();
      onHomepage = false;
      return;
    }

    // Clear previous text and type the perfume name
    await modalInput.click({ clickCount: 3 });
    await modalInput.press("Backspace");
    await sleep(200);
    await modalInput.type(searchQuery, { delay: rand(50, 100) });
    console.log(`   ⌨️  Buscando "${searchQuery}"...`);

    // 4. Wait for autocomplete dropdown to render
    //    It shows sections: PERFUMES / DESIGNERS / ARTICLES
    //    Each perfume result is a link like /perfume/Brand/Name-12345.html
    await sleep(rand(2500, 4500));

    // 5. Click the first perfume link in the AUTOCOMPLETE DROPDOWN only
    //    The dropdown is a container that appears over the page after typing.
    //    We must NOT click links from the background page (sidebar, reviews, etc.)
    //    Strategy: find the topmost visible overlay/modal, then look for /perfume/ links inside it.
    let clickedUrl = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      clickedUrl = await page.evaluate(() => {
        // Find all containers that could be the autocomplete dropdown:
        // They sit on top (high z-index or position fixed/absolute) and contain "PERFUMES" text
        // Look for any element containing the heading "PERFUMES" (the section title in the dropdown)
        const allEls = document.querySelectorAll("*");
        let dropdownContainer = null;

        for (const el of allEls) {
          // The dropdown section header says "PERFUMES" in caps
          if (el.textContent?.trim() === "PERFUMES" && el.offsetParent !== null) {
            // Walk up to find the dropdown container (the parent that holds all results)
            dropdownContainer = el.closest("[role='dialog'], [role='listbox'], [class*='search'], [class*='modal'], [class*='overlay'], [class*='dropdown']")
              || el.parentElement?.parentElement?.parentElement;
            break;
          }
        }

        if (dropdownContainer) {
          // Look for perfume links ONLY inside the dropdown
          const links = dropdownContainer.querySelectorAll("a[href*='/perfume/']");
          for (const a of links) {
            const href = a.getAttribute("href") || "";
            if (/\/perfume\/[^/]+\/[^/]+-\d+\.html/.test(href)) {
              const fullUrl = a.href || (window.location.origin + href);
              a.click();
              return fullUrl;
            }
          }
        }

        // Fallback: if no container found, try to find links that are in a high z-index layer
        // (visible on top of the page, not in the background)
        const perfumeLinks = document.querySelectorAll("a[href*='/perfume/']");
        for (const a of perfumeLinks) {
          const rect = a.getBoundingClientRect();
          // Must be visible and in the top portion of the viewport (dropdown area)
          if (rect.width > 0 && rect.height > 0 && rect.top > 50 && rect.top < 600) {
            const href = a.getAttribute("href") || "";
            if (/\/perfume\/[^/]+\/[^/]+-\d+\.html/.test(href)) {
              // Check this element is actually on top (not behind the overlay)
              const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              if (a.contains(topEl) || topEl?.closest("a") === a) {
                const fullUrl = a.href || (window.location.origin + href);
                a.click();
                return fullUrl;
              }
            }
          }
        }

        return null;
      });
      if (clickedUrl) break;
      await sleep(1500);
    }

    if (!clickedUrl) {
      await page.screenshot({ path: path.join(DEBUG_DIR, `${id}_autocomplete.png`) });
      const html = await page.content();
      fs.writeFileSync(path.join(DEBUG_DIR, `${id}_autocomplete.html`), html.slice(0, 80000));
      console.log(`   ⚠️  Sin resultados en autocompletado (debug: debug/${id}_autocomplete.png)`);
      results[id] = { status: "not_found", query: searchQuery };
      saveResults();
      await page.keyboard.press("Escape");
      await sleep(500);
      return;
    }

    console.log(`   🔗 Seleccionado: ${clickedUrl}`);

    // 6. Wait for navigation to the perfume detail page
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    await sleep(rand(2000, 3500));
    onHomepage = false; // we navigated away from homepage

    const currentUrl = page.url();
    console.log(`   📄 Página: ${currentUrl}`);

    // 7. Extract the main perfume image (large bottle on the left)
    const imageUrl = await page.evaluate(() => {
      // Strategy 1: itemprop image (most reliable on Fragrantica)
      const itemprop = document.querySelector("img[itemprop='image']");
      if (itemprop?.src) return itemprop.src;

      // Strategy 2: common selectors
      for (const sel of ["#mainpic img", ".perfume-big img", ".perfume_page_photo img", "img.perfume-big"]) {
        const img = document.querySelector(sel);
        if (img?.src) return img.src;
      }

      // Strategy 3: any large image from Fragrantica CDN (fimgs / img.fragrantica)
      for (const img of document.querySelectorAll("img")) {
        const src = img.src || "";
        if ((src.includes("fimgs") || src.includes("img.fragrantica")) && img.width > 100) {
          return src;
        }
      }

      return null;
    });

    if (!imageUrl) {
      await page.screenshot({ path: path.join(DEBUG_DIR, `${id}_detail.png`) });
      console.log(`   ⚠️  No se encontró imagen (debug: debug/${id}_detail.png)`);
      results[id] = { status: "no_image", url: currentUrl };
      saveResults();
      return;
    }

    console.log(`   🖼️  Imagen: ${imageUrl}`);

    // 8. Download the image
    await downloadImage(imageUrl, filePath);
    console.log(`   ✅ Guardada: images/${fileName}`);
    results[id] = { status: "ok", url: imageUrl, file: fileName, fragrantica: currentUrl };
    saveResults();

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    onHomepage = false;
    try { await page.screenshot({ path: path.join(DEBUG_DIR, `${id}_error.png`) }); } catch (_) {}
    results[id] = { status: "error", error: err.message };
    saveResults();
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const perfumes = await loadPerfumes();
  const toProcess = perfumes.slice(0, LIMIT);

  console.log(`\n🚀 Procesando ${toProcess.length} perfumes${DRY_RUN ? " (DRY RUN)" : ""}...\n`);

  const browser = await puppeteer.launch({
    headless: HEADED ? false : "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  // Stealth: hide automation signals
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // Accept cookies if dialog appears
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const before = results[toProcess[i].id]?.status;
    await scrapePerfume(page, toProcess[i], i, toProcess.length);
    const after = results[toProcess[i].id]?.status;

    if (after === "ok") success++;
    else if (before && SKIP_EXISTING) skipped++;
    else if (after && after !== "ok") failed++;

    // Random delay between requests to avoid rate limiting
    if (i < toProcess.length - 1) {
      const delay = rand(3000, 6000);
      process.stdout.write(`   ⏳ Esperando ${(delay / 1000).toFixed(1)}s...\r`);
      await sleep(delay);
    }
  }

  await browser.close();

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Éxito: ${success} | ❌ Fallos: ${failed} | ⏭️  Saltados: ${skipped}`);
  console.log(`📁 Imágenes: ${IMAGES_DIR}`);
  console.log(`📋 Resultados: ${RESULTS_PATH}`);
  console.log(`${"═".repeat(50)}\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
