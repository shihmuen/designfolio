// About Me 改版（2026-08-05，Figma node 808:2442）runtime 部分：
//   1. Focus Mode 資料夾在兩張 CD 前置中插入 FocusFlight app icon（hover 上浮＋放大，點擊依 OS 導商店）
//   2. zh 手寫標題補 emoji（❤️‍🔥😎／⭐🔑）——文字型 Apple emoji；en 標題 hash 不同、選不到，自動只作用 zh
// 靜態部分（計數、Focus Mode 改名、書封/縮圖換檔）在 patch-aboutme-2026-texts.py 與 _assets 覆蓋，不在此。
// 注入 zh+en 全部 18 頁（SPA 換頁不重載 HTML）；網址門檻＋心跳保活。
// 用法：node scripts/patch-aboutme-2026.mjs（可重複執行，會替換舊版）
import { readFile, writeFile } from 'node:fs/promises';

const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = [];
for (const lang of ['zh', 'en']) {
  for (const p of PAGES) FILES.push(new URL(`../dist/${lang}/${p ? p + '/' : ''}index.html`, import.meta.url).pathname);
}
const MARKER = 'molly-aboutme-2026-patch';

const SNIPPET = `<script id="${MARKER}">
(function () {
  // 三個斷點（desktop/tablet/mobile）各用不同的資產 hash，全都要列
  var CD_HASHES = [
    '20d3f5bd9641090d38b9eb04e3e41abfda74535c', '6950054b2f02abe5d405cd72a398d307b5ecd4ac', // desktop
    'b0ed64c847a6b8c12df574244af67f3028935581', 'f51aa0dc98c8121feac2860315c0ad898848a7bd', // tablet
    'd731e89cbdbe7dc294c726d2dc810f4f00617817', '6ce4fe73aa81352535d8e6720309788fc59e0393'  // mobile
  ];
  var ICON = '/_assets/custom/aboutme/focus-mode-icon.png';
  // FocusFlight 下載頁：Android 導 Google Play，其餘（iOS／iPadOS／桌機）導 App Store
  var STORE_IOS = 'https://apps.apple.com/tw/app/focusflight-%E7%82%BA%E9%9B%A3%E4%BB%A5%E5%B0%88%E6%B3%A8%E7%9A%84%E4%BA%BA%E8%80%8C%E8%A8%AD%E8%A8%88/id6648771147';
  var STORE_ANDROID = 'https://play.google.com/store/apps/details?id=com.focus.focusflight&hl=zh_TW';

  function storeUrl() {
    var ua = navigator.userAgent || '';
    // Android 平板/手機（排除 Windows Phone 舊字串）
    if (/Android/i.test(ua) && !/Windows Phone/i.test(ua)) return STORE_ANDROID;
    return STORE_IOS;
  }
  var HEART = '\\u2764\\uFE0F\\u200D\\uD83D\\uDD25\\uD83D\\uDE0E';
  var STARKEY = '\\u2B50\\uD83D\\uDD11';
  // mode line2：emoji 放在手寫字第二行行尾（xf＝行二字尾佔全寬比例）；
  // mode right：接在單行字尾（backoff＝SVG 尾端空白畫布比例）
  var EMOJI = [
    { hash: '5cfc09942ddf7193a01ed210815749b2821262d6', text: HEART, mode: 'line2', xf: 0.005 },  // desktop 關於（第二行全空）
    { hash: 'bb9d8681bdfadc3421fc4dfc34e8587763bda7d8', text: HEART, mode: 'line2', xf: 0.19 },   // tablet 關於（行二＝師？）
    { hash: 'af7466011c1cef8a8a4cfdb4e6fbf15ff3165921', text: HEART, mode: 'line2', xf: 0.19 },   // mobile 關於（行二＝師？）
    { hash: '67e20112313a0761b9de0db8347d2df542d7e032', text: STARKEY, mode: 'right', fsf: 0.78, backoff: 0.105 }, // desktop 學到（單行、尾端 ~12% 空白）
    { hash: '432a375384f3f962a188239253143c66b7c9e813', text: STARKEY, mode: 'line2', xf: 0.005 },                 // tablet 學到（emoji 獨立第二行、靠左）
    { hash: '7ac184bb23e8f7ab9ba9881b41540bb722f7097e', text: STARKEY, mode: 'right', fsf: 0.50, backoff: -0.02, dyf: 0.25 } // mobile 學到（單行、字滿版、字身偏上）
  ];

  function onAboutMe() {
    return /^\\/((zh|en)\\/)?about-me\\/?$/.test(location.pathname);
  }

  function ensureIconStyle() {
    if (document.getElementById('molly-focus-icon-style')) return;
    var st = document.createElement('style');
    st.id = 'molly-focus-icon-style';
    // 參數沿用站上原生按鈕 hover：OUT_CUBIC(.215,.61,.355,1) 0.3s
    st.textContent = '[data-molly-focus-icon]{transition:transform .3s cubic-bezier(.215,.61,.355,1) !important;}' +
      '[data-molly-focus-icon]:hover{transform:translateY(-4px) scale(1.05) !important;}';
    document.head.appendChild(st);
  }

  function applyIcon() {
    ensureIconStyle();
    // 每個 breakpoint 的 focus 資料夾各有一對 CD 圖；以共同父層配對
    var cds = [];
    CD_HASHES.forEach(function (h) {
      document.querySelectorAll('img[src*="' + h + '"]').forEach(function (im) { cds.push(im); });
    });
    var byParent = {};
    cds.forEach(function (im) {
      // CD 圖各自包在 data-isimage 容器裡，往上找兩張共同的祖先
      var p = im.parentElement;
      for (var i = 0; i < 4 && p; i++) {
        if (!p.__mollyKey) { p.__mollyKey = Math.random().toString(36).slice(2); }
        (byParent[p.__mollyKey] = byParent[p.__mollyKey] || { el: p, imgs: [] }).imgs.push(im);
        p = p.parentElement;
      }
    });
    Object.keys(byParent).forEach(function (k) {
      var g = byParent[k];
      if (g.imgs.length !== 2 || g.el.querySelector('[data-molly-focus-icon]')) return;
      // 只在「最深的」共同祖先動手：兩張圖都在其中且高度可量測
      var r1 = g.imgs[0].getBoundingClientRect();
      var r2 = g.imgs[1].getBoundingClientRect();
      if (r1.width < 40 || r2.width < 40) return; // 版面未就緒，留給心跳
      // 檢查是不是最深：子層裡若還有同樣包含兩張圖的容器就跳過
      var deeper = false;
      Array.prototype.forEach.call(g.el.children, function (c) {
        if (c.contains(g.imgs[0]) && c.contains(g.imgs[1])) deeper = true;
      });
      if (deeper) return;
      var host = g.el.getBoundingClientRect();
      var left = Math.min(r1.left, r2.left) - host.left;
      var top = Math.min(r1.top, r2.top) - host.top;
      var w = Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left);
      var cdH = Math.max(r1.height, r2.height);
      // icon 寬 ≈ CD 的 0.44（0.55 再縮 20%，Molly 08-05 拍板）、水平置中於兩張 CD、垂直中心在 CD 高度的 38%
      // （CD 下半被資料夾標籤帶蓋住，置中於整張圖會壓到標題）
      var size = Math.round(r1.width * 0.44);
      if (getComputedStyle(g.el).position === 'static') g.el.style.position = 'relative';
      var ic = document.createElement('a');
      ic.href = storeUrl();
      ic.target = '_blank';
      ic.rel = 'noopener noreferrer';
      ic.setAttribute('aria-label', 'FocusFlight');
      ic.setAttribute('data-molly-focus-icon', '1');
      var icImg = document.createElement('img');
      icImg.src = ICON;
      icImg.alt = 'FocusFlight';
      icImg.style.cssText = 'width:100%;height:100%;display:block;';
      ic.appendChild(icImg);
      // 不能 append 在容器最後也不能加 z-index：資料夾「前蓋」是 CD 之後的兄弟節點，
      // 靠 DOM 順序蓋住 CD 下半部；icon 要插在最後一張 CD 之後、前蓋之前，才會一起被夾住
      // icon 是 FocusFlight 下載入口：用真正的 <a>（window.open 會被彈窗阻擋器擋掉，
      // 且 <a> 才支援長按／中鍵開新分頁）；pointer-events:auto 才 hover／點擊得到
      ic.style.cssText = 'position:absolute;display:block;pointer-events:auto;cursor:pointer;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'left:' + Math.round(left + w / 2 - size / 2) + 'px;' +
        'top:' + Math.round(top + cdH * 0.38 - size / 2 + 24) + 'px;' +  // +24px：Molly 08-05 三次微調往下移
        'filter:drop-shadow(0 6px 14px rgba(0,0,0,.28));';
      var lastWrap = null;
      Array.prototype.forEach.call(g.el.children, function (c) {
        if (c.contains(g.imgs[0]) || c.contains(g.imgs[1])) lastWrap = c;
      });
      if (lastWrap) g.el.insertBefore(ic, lastWrap.nextSibling);
      else g.el.appendChild(ic);
    });
  }

  function applyEmoji() {
    EMOJI.forEach(function (cfg) {
      document.querySelectorAll('img[src*="' + cfg.hash + '"]').forEach(function (im) {
        var host = im.parentElement;
        if (!host || host.querySelector('[data-molly-emoji]')) return;
        var r = im.getBoundingClientRect();
        if (r.width < 40) return; // 未就緒
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        var hr = host.getBoundingClientRect();
        var sp = document.createElement('span');
        sp.setAttribute('data-molly-emoji', '1');
        sp.textContent = cfg.text;
        // 以「圖的實際位置」定位，不能用 host 的 100%（host 可能比字寬）
        var fs, pos;
        if (cfg.mode === 'line2') {
          fs = Math.round(r.height * 0.42);
          pos = 'left:' + Math.round(r.left - hr.left + r.width * cfg.xf) + 'px;' +
                'top:' + Math.round(r.bottom - hr.top - r.height * 0.46) + 'px;';
        } else {
          fs = Math.round(r.height * (cfg.fsf || 0.78));
          pos = 'left:' + Math.round(r.right - hr.left - r.width * cfg.backoff) + 'px;' +
                'top:' + Math.round(r.top - hr.top + r.height / 2 - fs / 2 - r.height * (cfg.dyf || 0)) + 'px;';
        }
        sp.style.cssText = 'position:absolute;z-index:5;pointer-events:none;white-space:nowrap;' +
          'font-family:"Apple Color Emoji","Segoe UI Emoji",sans-serif;line-height:1;' +
          'font-size:' + fs + 'px;' + pos;
        host.appendChild(sp);
      });
    });
  }

  function apply() {
    if (!onAboutMe()) return;
    try { applyIcon(); } catch (e) {}
    try { applyEmoji(); } catch (e) {}
  }

  function boot() {
    apply();
    new MutationObserver(function () { try { apply(); } catch (e) {} })
      .observe(document.documentElement, { childList: true, subtree: true });
    setInterval(function () { try { apply(); } catch (e) {} }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;

// 守門：輸出前驗證 snippet 語法（template literal 吃反斜線的老坑）
{
  const inner = SNIPPET.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  new Function(inner);
}
const existing = new RegExp('<script id="' + MARKER + '">[\\s\\S]*?</' + 'script>');
for (const file of FILES) {
  let html = await readFile(file, 'utf8');
  if (existing.test(html)) {
    html = html.replace(existing, SNIPPET);
  } else {
    html = html.replace('</head>', SNIPPET + '\n</head>');
  }
  await writeFile(file, html);
}
console.log(`aboutme-2026 patch applied to ${FILES.length} pages (zh+en)`);
