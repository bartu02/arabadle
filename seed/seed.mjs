#!/usr/bin/env node
//
// seed/*.json dosyalarını Supabase'e basar.
//
//   npm run seed
//
// Idempotent: slug ve (pack_id, sort_order) üzerinden upsert eder, tekrar
// tekrar çalıştırılabilir. Hiçbir şey silmez.
//
// Gerekli: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve
// SUPABASE_SECRET_KEY. Secret key gerekiyor çünkü anon rolün yazma
// yetkisi yok (bkz. supabase/migrations/0001_init.sql).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { PHOTOS, photoCredit } from "../lib/photos.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// --- yardımcılar -------------------------------------------------------------

function fail(message) {
  console.error(`\n  hata: ${message}\n`);
  process.exit(1);
}

function readJson(name) {
  const path = join(here, name);
  if (!existsSync(path)) fail(`${name} bulunamadı.`);
  try {
    // Windows editörleri dosyanın başına BOM ekleyebiliyor, JSON.parse ise
    // BOM görünce patlıyor. Varsa kırp.
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
  } catch (error) {
    fail(`${name} okunamadı: ${error.message}`);
  }
}

// dotenv eklemeye değmeyecek kadar küçük bir iş.
function loadEnvFile(path) {
  if (!existsSync(path)) return;

  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);

    if (!(key in process.env)) process.env[key] = value;
  }
}

function assertUniqueSlugs(rows, label) {
  const seen = new Set();
  for (const row of rows) {
    if (!row.slug) fail(`${label}: slug'ı olmayan kayıt var.`);
    if (seen.has(row.slug)) fail(`${label}: "${row.slug}" slug'ı iki kez geçiyor.`);
    seen.add(row.slug);
  }
}

// --- doğrulama ---------------------------------------------------------------

function validate(packs, items, trios) {
  assertUniqueSlugs(packs, "packs.json");
  assertUniqueSlugs(items, "items.json");

  for (const item of items) {
    if (!PHOTOS[item.slug]) {
      fail(`items.json: "${item.slug}" için lib/photos.js'te fotoğraf kaydı yok.`);
    }
  }

  const packSlugs = new Set(packs.map((p) => p.slug));
  const itemSlugs = new Set(items.map((i) => i.slug));
  const seenPositions = new Set();

  for (const [index, trio] of trios.entries()) {
    const where = `trios.json[${index}]`;

    if (!packSlugs.has(trio.pack_slug)) {
      fail(`${where}: "${trio.pack_slug}" paketi packs.json'da yok.`);
    }

    if (!Array.isArray(trio.item_slugs) || trio.item_slugs.length !== 3) {
      fail(`${where}: item_slugs tam olarak 3 slug içermeli.`);
    }

    if (new Set(trio.item_slugs).size !== 3) {
      fail(`${where}: aynı araba üçlüde birden fazla kez geçiyor.`);
    }

    for (const slug of trio.item_slugs) {
      if (!itemSlugs.has(slug)) {
        fail(`${where}: "${slug}" items.json'da yok.`);
      }
    }

    const position = `${trio.pack_slug}#${trio.sort_order}`;
    if (seenPositions.has(position)) {
      fail(`${where}: "${trio.pack_slug}" paketinde sort_order ${trio.sort_order} iki kez kullanılmış.`);
    }
    seenPositions.add(position);
  }
}

// --- ana akış ----------------------------------------------------------------

async function main() {
  loadEnvFile(join(root, ".env.local"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY tanımlı değil.\n" +
        "  .env.local.example dosyasını .env.local olarak kopyalayıp doldur."
    );
  }

  const packs = readJson("packs.json");
  const items = readJson("items.json");
  const trios = readJson("trios.json");

  validate(packs, items, trios);

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // packs
  const packRows = packs.map(({ slug, title, description, sort_order }) => ({
    slug,
    title,
    description: description ?? "",
    sort_order: sort_order ?? 0,
  }));

  const packResult = await supabase
    .from("packs")
    .upsert(packRows, { onConflict: "slug" });
  if (packResult.error) fail(`packs yazılamadı: ${packResult.error.message}`);
  console.log(`  packs   ${packRows.length} kayıt`);

  // items — fotoğraf yolu ve atıf metni lib/photos.js'ten gelir, orası tek kaynak.
  const itemRows = items.map(({ slug, name, year_label }) => ({
    slug,
    name,
    year_label: year_label ?? "",
    image_url: PHOTOS[slug].file,
    image_credit: photoCredit(slug),
  }));

  const itemResult = await supabase
    .from("items")
    .upsert(itemRows, { onConflict: "slug" });
  if (itemResult.error) fail(`items yazılamadı: ${itemResult.error.message}`);
  console.log(`  items   ${itemRows.length} kayıt`);

  // slug -> id eşlemeleri
  const packLookup = await supabase.from("packs").select("id, slug");
  if (packLookup.error) fail(`pack id'leri okunamadı: ${packLookup.error.message}`);

  const itemLookup = await supabase.from("items").select("id, slug");
  if (itemLookup.error) fail(`item id'leri okunamadı: ${itemLookup.error.message}`);

  const packIds = new Map(packLookup.data.map((row) => [row.slug, row.id]));
  const itemIds = new Map(itemLookup.data.map((row) => [row.slug, row.id]));

  // trios
  const trioRows = trios.map((trio) => {
    const [a, b, c] = trio.item_slugs;
    return {
      pack_id: packIds.get(trio.pack_slug),
      item_a_id: itemIds.get(a),
      item_b_id: itemIds.get(b),
      item_c_id: itemIds.get(c),
      sort_order: trio.sort_order ?? 0,
    };
    // trio.pattern yalnızca dosyadaki not; veritabanına gitmez.
  });

  const trioResult = await supabase
    .from("trios")
    .upsert(trioRows, { onConflict: "pack_id,sort_order" });
  if (trioResult.error) fail(`trios yazılamadı: ${trioResult.error.message}`);
  console.log(`  trios   ${trioRows.length} kayıt`);

  console.log("\n  tamam\n");
}

main().catch((error) => fail(error.message));
