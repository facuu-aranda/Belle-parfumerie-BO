import fs from "fs";
import https from "https";
import http from "http";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlink(dest, () => {});
          downloadImage(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

export function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    console.log(`⚠️  .env.local no encontrado en: ${envPath}`);
    return;
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.replace(/\r/g, "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}
