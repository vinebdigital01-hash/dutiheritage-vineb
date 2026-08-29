import { config } from "dotenv";
import path from "path";
import fs from "fs";

let loaded = false;

/**
 * Load env like Next.js (.env then .env.local), but skip empty
 * overrides so blank placeholders in .env.local don't wipe .env values.
 */
export function loadTestEnv() {
  if (loaded) return;
  const root = process.cwd();
  const files = [
    path.resolve(root, ".env"),
    path.resolve(root, ".env.local"),
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const parsed = config({ path: file, override: false }).parsed || {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value != null && String(value).trim() !== "") {
        process.env[key] = String(value);
      }
    }
  }
  loaded = true;
}

export function baseUrl(): string {
  loadTestEnv();
  return (process.env.TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function firebaseApiKey(): string {
  loadTestEnv();
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBDkLX0B1RJ4dAXgzzu5y_ecdv7hssSBiE"
  );
}
