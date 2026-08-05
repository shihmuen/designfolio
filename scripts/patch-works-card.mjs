// 臨時補丁：在 zh Works 頁最上方插入「設計我的 AI 協作系統」[2026] 卡片。
// 背景：卡片已做在 Figma Sites 編輯器但尚未 Publish，Molly 要先在 Vercel 版看到。
// 用法：node scripts/mirror.mjs 之後跑 node scripts/patch-works-card.mjs，再部署。
// ⚠️ Figma Sites 發佈正式版之後：重跑 mirror 即可，「不要」再跑本腳本（會出現重複卡片）。
// 封面圖：dist/_assets/custom/ai-collab-cover.jpg（來源 Downloads/設計我的AI協作系統-Cover.png）
import { readFile, writeFile } from 'node:fs/promises';

// 注入所有 zh 頁面：站內換頁是 SPA（不重載 HTML），監聽器必須從任何入口頁就開始跑
const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = PAGES.map((p) => new URL(`../dist/zh/${p ? p + '/' : ''}index.html`, import.meta.url).pathname);
const MARKER = 'molly-ai-card-patch';

const SNIPPET = `<script id="${MARKER}">
(function () {
  var CARD_ID = 'molly-ai-collab-card';
  var NEW = {
    title: '設計我的 AI 協作系統',
    desc: '沒有 coding 背景的我，用 UX 方法把 Claude 設計成協作系統：幫我打造 POC 對齊團隊、把討論轉成開發文件、依驗收標準執行設計稿。',
    img: '/_assets/custom/ai-collab-cover.jpg'
  };
  var TAG_MAP = { 'Product Design': 'Claude', 'B2B Backend System': 'AI Workflow', 'B2C Frontend Interface': 'UX for AI' };

  // 找「整張 POMO 卡」：先找含 [2024]+POMO 標題的最深容器，
  // 再往上爬到包含 tags 與圖的完整卡片（一碰到其他卡的內容就停）。
  function containsOtherCards(el) {
    var t = el.textContent || '';
    return t.indexOf('[2025]') !== -1 || t.indexOf('NFC') !== -1 ||
           t.indexOf('Clovis') !== -1 || t.indexOf('旅行回憶錄') !== -1;
  }
  function findCard() {
    var nodes = document.querySelectorAll('div,section,article,li');
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], t = el.textContent || '';
      if (t.indexOf('[2024]') !== -1 && t.indexOf('POMO 生態系統') !== -1 && !containsOtherCards(el)) {
        if (!best || best.contains(el)) best = el; // 越深越準
      }
    }
    if (!best) return null;
    while (best.parentElement && best.parentElement !== document.body &&
           !containsOtherCards(best.parentElement)) {
      best = best.parentElement;
    }
    return best.querySelector('img') ? best : null;
  }

  function build(card) {
    var clone = card.cloneNode(true);
    clone.id = CARD_ID;
    var inner = clone.querySelectorAll('[id]');
    for (var k = 0; k < inner.length; k++) inner[k].removeAttribute('id');
    var walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var s = n.nodeValue.trim();
      if (s === '[2024]') n.nodeValue = '[2026]';
      else if (s.indexOf('POMO 生態系統') === 0) n.nodeValue = NEW.title;
      else if (s.indexOf('POMO Network') === 0) n.nodeValue = NEW.desc;
      else if (TAG_MAP[s]) n.nodeValue = TAG_MAP[s];
      else if (s.indexOf('image generate') !== -1) n.nodeValue = ''; // 原卡的 AI 產圖註記不適用
    }
    // 圖片留到插入 DOM 後再處理（fixImages）：detached 節點量不到尺寸，
    // 而「箭頭 icon／封面主層／hover 展開層」要靠尺寸區分。
    // 進場動畫是 runtime 控制的，clone 不會被接手：清掉複製當下殘留的
    // opacity/transform inline 樣式，讓新卡直接以完成狀態顯示。
    var all = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
    for (var m = 0; m < all.length; m++) {
      var st = all[m].style;
      if (!st) continue;
      if (st.opacity !== '' && parseFloat(st.opacity) < 1) st.opacity = '1';
      if (st.transform && st.transform !== 'none') st.transform = 'none';
    }
    // 整張卡導向詳情頁（攔下繼承自原卡的舊行為，改為自己的連結）
    clone.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      window.location.href = '/my-ai-workflow';
    }, true);
    clone.style.cursor = 'pointer';
    return clone;
  }

  // 原卡有三張圖：20px 箭頭 icon（保留）、hover 展開的完整層（最高的那張，
  // 換成新封面）、預設裁切層（隱藏，靜態卡只需一層）。以「原卡」的實測尺寸
  // 判斷角色，再按相同順序套用到 clone。
  function fixImages(clone, card, attempt) {
    var oImgs = card.querySelectorAll('img');
    var cImgs = clone.querySelectorAll('img');
    var n = Math.min(oImgs.length, cImgs.length);
    var bigIdx = [], maxH = 0, coverIdx = -1;
    for (var i = 0; i < n; i++) {
      var r = oImgs[i].getBoundingClientRect();
      if (r.width < 100) continue; // icon：不動
      bigIdx.push(i);
      if (r.height > maxH) { maxH = r.height; coverIdx = i; }
    }
    if (!bigIdx.length && (attempt || 0) < 10) {
      // 原卡可能還沒排版完成，稍後重量一次
      setTimeout(function () { fixImages(clone, card, (attempt || 0) + 1); }, 400);
      return;
    }
    for (var j = 0; j < bigIdx.length; j++) {
      var k = bigIdx[j], im = cImgs[k];
      if (k === coverIdx) {
        im.removeAttribute('srcset');
        im.removeAttribute('sizes');
        im.src = NEW.img;
        im.alt = NEW.title;
        im.style.objectFit = 'cover';
        // 圖框比例改 716:461（Molly 指定；即原圖 1600×1030 的原比例，不裁切）。
        // 高度 718 是 class 給的：relative 圖框改 aspect-ratio、內層改 100% 跟隨。
        im.style.width = '100%';
        im.style.height = '100%';
        var absBox = im.parentElement;
        if (absBox) { absBox.style.width = '100%'; absBox.style.height = '100%'; }
        var relBox = absBox && absBox.parentElement;
        if (relBox) {
          relBox.style.height = 'auto';
          relBox.style.aspectRatio = '716 / 461';
          relBox.style.overflow = 'hidden';
          relBox.setAttribute('data-molly-cover-box', '1');
        }
        im.style.transform = ''; // 清 inline 殘留，讓樣式表的 scale(1.06) 生效
        im.setAttribute('data-molly-cover', '1');
      } else {
        (im.parentElement || im).style.display = 'none';
      }
    }
  }


  // Read Story 按鈕標記（hover 反色用）：從文字節點往上爬到含箭頭 icon 的外框
  function tagReadStory(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.trim() === 'Read Story') {
        var btn = n.parentElement;
        for (var d = 0; d < 4 && btn && !btn.querySelector('img'); d++) btn = btn.parentElement;
        if (btn) btn.setAttribute('data-molly-btn', '1');
        return;
      }
    }
  }

  // 出場動畫：對齊原生卡的捲動淡入上移
  function entrance(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(120px)';
    el.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)';
    function show() { el.style.opacity = '1'; el.style.transform = 'none'; }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { requestAnimationFrame(show); io.disconnect(); } });
      }, { threshold: 0.1 });
      io.observe(el);
      setTimeout(function () { if (el.style.opacity === '0' && innerHeight > 0 && el.getBoundingClientRect().top < innerHeight) show(); }, 3000);
    } else { show(); }
  }

  function mount() {
    // 補丁注入在所有頁面（SPA 換頁不會重新執行各頁的 script），
    // 只在 Works 頁的網址下動作
    if (!/^\\/(zh\\/)?works\\/?$/.test(location.pathname)) return;
    if (document.getElementById(CARD_ID)) return;
    var card = findCard();
    if (!card || !card.parentElement) return;
    var clone = build(card);
    tagReadStory(clone);
    card.parentElement.insertBefore(clone, card);
    fixImages(clone, card);
    entrance(clone);
  }

  var scheduled = false;
  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; mount(); }, 150);
  }
  function ensureHoverStyle() {
    if (document.getElementById('molly-card-hover-style')) return;
    var st = document.createElement('style');
    st.id = 'molly-card-hover-style';
    st.textContent = 'img[data-molly-cover]{transform:scale(1.06) !important;transition:transform .6s cubic-bezier(.16,1,.3,1) !important;}' +
        '[data-molly-cover-box]{overflow:hidden;}' +
        '#molly-ai-collab-card:hover img[data-molly-cover],#molly-aiwf-section [data-molly-card]:hover img[data-molly-cover]{transform:scale(1) !important;}' +
        '[data-molly-btn]{transition:background-color .35s,border-color .35s;}' +
        '[data-molly-btn]:hover{background-color:#111 !important;}' +
        '[data-molly-btn]:hover *{color:#fff !important;}' +
        '[data-molly-btn]:hover img{filter:invert(1);}';
    document.head.appendChild(st);
  }

  function boot() {
    ensureHoverStyle();
    mount();
    new MutationObserver(scheduleMount).observe(document.documentElement, { childList: true, subtree: true });
    [500, 1500, 3000].forEach(function (t) { setTimeout(mount, t); });
    setInterval(ensureHoverStyle, 1400);
    // SPA 轉場會把整棵 DOM 換掉，掛在舊樹上的 MutationObserver 會靜默死亡；
    // setInterval 掛在 window 上不受影響，當常駐心跳補掛（mount 有網址門檻＋
    // 已存在檢查，未命中時成本趨近於零）。
    setInterval(function () { try { mount(); } catch (e) {} }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;


// 守門：輸出前驗證 snippet 語法，壞版本直接中止（見 memory: poc-verify-cache-and-syntax）
{
  const inner = SNIPPET.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  new Function(inner); // SyntaxError 會直接 throw、退出非零
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
console.log(`AI-collab card patch applied to ${FILES.length} zh pages`);
