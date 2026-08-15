// Local static server that mimics the vercel.json cookie-based language rewrites.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('../dist', import.meta.url).pathname;
const PORT = 4173;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
};

function resolveFile(rel) {
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) return null;
  if (existsSync(file)) {
    const st = statSync(file);
    if (st.isFile()) return file;
    if (st.isDirectory() && existsSync(path.join(file, 'index.html'))) return path.join(file, 'index.html');
  }
  return null;
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const cookie = req.headers.cookie || '';
  const lang = /(?:^|;\s*)molly-lang=en(?:;|$)/.test(cookie) ? 'en' : 'zh';

  // 1. filesystem first (assets, direct /zh|/en visits)
  let file = resolveFile(urlPath);
  // 2. cookie rewrite fallback
  if (!file) file = resolveFile(path.posix.join('/', lang, urlPath));
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const body = await readFile(file);
  // ⚠️ 一定要送 no-store：本來完全沒有快取標頭，Safari 會自己啟發式快取，
  //    改了程式碼卻看到舊版，會讓「修好了沒」的判斷全部失準。
  res.writeHead(200, {
    'content-type': MIME[path.extname(file)] || 'application/octet-stream',
    'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
    'pragma': 'no-cache',
    'expires': '0',
  });
  res.end(body);
}).listen(PORT, () => console.log(`dev server on http://localhost:${PORT} (root: ${ROOT})`));
