// Mirror both Figma Sites (zh + en) into dist/{zh,en}/ with shared root assets.
// Language is served by cookie-based rewrites (vercel.json) so visible URLs stay
// clean (/, /works …) and the Figma runtime hydrates/animates exactly like the
// original sites.
// ⚠️ 2026-07-05 起已「脫鈎」：Vercel 版（dist/）是唯一正本，Figma Sites 不再迭代。
// 重跑本腳本會用 Figma 的舊發佈內容「蓋掉 dist 裡所有手動修改」（例如 AI 協作系統卡）。
// 除非 Molly 明確說要重新從 Figma 匯入，否則不要執行。必要時加 --force 才會跑。
if (!process.argv.includes('--force')) {
  console.error('⚠️ 已脫鈎：dist/ 為正本，重跑會蓋掉手動修改。確定要從 Figma 重新匯入請加 --force。');
  process.exit(1);
}
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('../dist', import.meta.url).pathname; // 輸出到 repo 的 dist/，部署：cd dist && vercel deploy --prod
const SITES = {
  zh: 'https://mollyshihdesignfolio-zh.figma.site',
  en: 'https://mollyshihdesignfolio.figma.site',
};
const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const ASSET_RE = /\/_(?:assets|components|json|runtimes|woff)\/[A-Za-z0-9._\/-]+/g;
const TEXT_EXT = ['.css', '.js', '.json', '.svg', '.html'];

const injectSnippet = await readFile(new URL('./inject.html', import.meta.url), 'utf8');

const downloaded = new Set();
const queueByOrigin = new Map(); // origin -> Set of asset paths

function enqueue(origin, refs) {
  if (!queueByOrigin.has(origin)) queueByOrigin.set(origin, new Set());
  for (const r of refs) {
    const clean = r.split('?')[0].split('#')[0];
    if (!downloaded.has(clean)) queueByOrigin.get(origin).add(clean);
  }
}

async function fetchBin(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function save(rel, buf) {
  const file = path.join(ROOT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
}

// 1. Pages
for (const [lang, origin] of Object.entries(SITES)) {
  for (const page of PAGES) {
    const url = `${origin}/${page}`;
    const res = await fetch(url);
    if (!res.ok) { console.error(`SKIP ${res.status} ${url}`); continue; }
    let html = await res.text();
    enqueue(origin, html.match(ASSET_RE) || []);
    // mark the page language for the toggle, then inject it before </head>
    html = html.replace(/<html/i, `<html data-molly-lang="${lang}"`);
    html = html.replace('</head>', injectSnippet + '\n</head>');
    const rel = page ? `${lang}/${page}/index.html` : `${lang}/index.html`;
    await save(rel, html);
    console.log(`page  ${rel} (${html.length}b)`);
  }
}

// 1b. vercel.json — cookie-based language rewrites (fallback = zh, Molly's default)
const vercelConfig = {
  rewrites: [
    { source: '/', has: [{ type: 'cookie', key: 'molly-lang', value: 'en' }], destination: '/en/index.html' },
    { source: '/', destination: '/zh/index.html' },
    { source: '/:path*', has: [{ type: 'cookie', key: 'molly-lang', value: 'en' }], destination: '/en/:path*' },
    { source: '/:path*', destination: '/zh/:path*' },
  ],
};
await save('vercel.json', JSON.stringify(vercelConfig, null, 2) + '\n');
console.log('vercel.json written');

// 2. Assets — iterate until closure (text assets may reference more assets)
let rounds = 0;
while (rounds++ < 10) {
  let pending = [];
  for (const [origin, set] of queueByOrigin) {
    for (const p of set) if (!downloaded.has(p)) pending.push([origin, p]);
    set.clear();
  }
  if (!pending.length) break;
  console.log(`--- round ${rounds}: ${pending.length} assets`);
  const POOL = 8;
  let i = 0;
  async function worker() {
    while (i < pending.length) {
      const [origin, p] = pending[i++];
      if (downloaded.has(p)) continue;
      downloaded.add(p);
      if (!existsSync(path.join(ROOT, p))) {
        try {
          const buf = await fetchBin(origin + p);
          await save(p, buf);
        } catch (e) { console.error(`FAIL ${e.message}`); continue; }
      }
      if (TEXT_EXT.includes(path.extname(p)) || p.includes('/_json/')) {
        try {
          const txt = await readFile(path.join(ROOT, p), 'utf8');
          enqueue(origin, txt.match(ASSET_RE) || []);
        } catch { /* binary, ignore */ }
      }
    }
  }
  await Promise.all(Array.from({ length: POOL }, worker));
}
console.log(`done. ${downloaded.size} assets total`);

// 3. Interaction-time images: page JSON references images by bare hash (imageRef)
// that only load when an interaction fires (hover swaps, photo stacks). They never
// appear as full URLs in the HTML, so fetch them explicitly. Refs missing on the
// live site too (unpublished hidden layers) are skipped.
{
  const { readdir } = await import('node:fs/promises');
  const have = new Set();
  try {
    for (const f of await readdir(path.join(ROOT, '_assets/v11'))) have.add(f.replace(/\.[a-z0-9]+$/, ''));
  } catch {}
  const refs = new Set();
  async function scanDir(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) { await scanDir(p); continue; }
      if (!ent.name.endsWith('.json')) continue;
      const txt = await readFile(p, 'utf8').catch(() => '');
      for (const m of txt.matchAll(/"(?:imageRef|imageHash|videoHash)":"([a-f0-9]{40})"/g)) refs.add(m[1]);
    }
  }
  await scanDir(path.join(ROOT, '_json'));
  const missing = [...refs].filter((h) => !have.has(h));
  console.log(`interaction images: ${refs.size} refs, ${missing.length} missing`);
  const EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.mp4'];
  for (const h of missing) {
    let got = false;
    for (const origin of Object.values(SITES)) {
      for (const ext of EXTS) {
        try {
          const buf = await fetchBin(`${origin}/_assets/v11/${h}${ext}`);
          await save(`_assets/v11/${h}${ext}`, buf);
          console.log(`img   ${h.slice(0, 10)}${ext} (${buf.length}b)`);
          got = true; break;
        } catch { /* try next */ }
      }
      if (got) break;
    }
    if (!got) console.log(`img   ${h.slice(0, 10)} not published on live site — skipped`);
  }
}

// 4. Videos: JSON 用 videoRef 引用，實體在 /_videos/v1/<hash>（無副檔名），
// HTML 掃不到，要另掃 JSON 補抓（2026-07-06 memory-gallery demo 影片漏抓的教訓）。
{
  const { readdir } = await import('node:fs/promises');
  const have = new Set();
  try { for (const f of await readdir(path.join(ROOT, '_videos/v1'))) have.add(f); } catch {}
  const refs = new Set();
  async function scanDir(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) { await scanDir(p); continue; }
      if (!ent.name.endsWith('.json')) continue;
      const txt = await readFile(p, 'utf8').catch(() => '');
      for (const m of txt.matchAll(/"videoRef":"([a-f0-9]{40})"/g)) refs.add(m[1]);
    }
  }
  await scanDir(path.join(ROOT, '_json'));
  const missing = [...refs].filter((h) => !have.has(h));
  console.log(`videos: ${refs.size} refs, ${missing.length} missing`);
  for (const h of missing) {
    let got = false;
    for (const origin of Object.values(SITES)) {
      try {
        const buf = await fetchBin(`${origin}/_videos/v1/${h}`);
        await save(`_videos/v1/${h}`, buf);
        console.log(`video ${h.slice(0, 10)} (${buf.length}b)`);
        got = true; break;
      } catch { /* try next origin */ }
    }
    if (!got) console.log(`video ${h.slice(0, 10)} not found — skipped`);
  }
}

