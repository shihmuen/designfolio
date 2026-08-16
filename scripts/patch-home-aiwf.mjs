// 首頁「AI Workflow」區塊補丁（依 Figma 設計稿 WVaawWlrGsjWH25AIrptms node 792:622）。
// 做法：clone 首頁的 Selected Works 區塊 → 標題改 AI Workflow、只留一張卡並改寫成
// 「設計我的 AI 協作系統」[2026]、移除 VIEW ALL 按鈕 → 插到原區塊前面。
// 用法：node scripts/patch-home-aiwf.mjs（可重複執行，會替換舊版）
// 2026-08-16：原本只套中文版，英文版首頁因此完全沒有這個區塊（Molly 回報）。
// 現在 zh + en 都注入，文案與比對錨點由 runtime 依 data-molly-lang 決定（見 COPY）。
import { readFile, writeFile } from 'node:fs/promises';

// 注入所有頁面：站內換頁是 SPA（不重載 HTML），監聽器必須從任何入口頁就開始跑
const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = [];
for (const lang of ['zh', 'en']) {
  for (const p of PAGES) FILES.push(new URL(`../dist/${lang}/${p ? p + '/' : ''}index.html`, import.meta.url).pathname);
}
const MARKER = 'molly-home-aiwf-patch';

const SNIPPET = `<script id="${MARKER}">
(function () {
  var SECTION_ID = 'molly-aiwf-section';
  var LANG = document.documentElement.getAttribute('data-molly-lang') === 'en' ? 'en' : 'zh';
  // 英文標題與描述沿用 /en/my-ai-workflow 頁上已有的官方版本，不另外翻譯
  var COPY = {
    zh: {
      title: '設計我的 AI 協作系統',
      desc: '沒有 coding 背景的我，用 UX 方法把 Claude 設計成協作系統——幫我打造 POC 對齊團隊、把討論轉成開發文件、依驗收標準執行設計稿。',
      cardTitle: 'POMO 生態系統',      // 要被取代的原卡標題開頭
      quote: '對我來說'                 // 設計哲學金句開頭（不屬於這個區塊，要移除）
    },
    en: {
      title: 'Designing My AI Collaboration System',
      desc: 'Without a coding background, I used UX methods to turn Claude into a collaboration system \u2014 building POCs to align the team, turning discussions into dev docs, and executing design files to my acceptance standards.',
      cardTitle: 'POMO Ecosystem',
      quote: 'For me, design is'
    }
  };
  var NEW = {
    heading: 'AI Workflow',            // 區塊標題兩版都是英文
    title: COPY[LANG].title,
    desc: COPY[LANG].desc,
    img: '/_assets/custom/ai-collab-cover.jpg'
  };
  var TAG_MAP = { 'Product Design': 'Claude', 'B2B Backend System': 'AI Workflow', 'B2C Frontend Interface': 'UX for AI' };

  function txt(el) { return (el.textContent || '').replace(/\\s+/g, ' ').trim(); }

  // 每個 [20xx] 年份標記往上爬出它的卡片容器（含 Read Story、不含第二張卡）
  function cardRoots(scope) {
    var years = [];
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (/^\\[20\\d\\d\\]$/.test(n.nodeValue.trim())) years.push(n.parentElement);
    }
    var roots = [];
    for (var i = 0; i < years.length; i++) {
      var el = years[i];
      while (el.parentElement && el.parentElement !== scope) {
        var p = el.parentElement;
        var marks = (p.textContent.match(/\\[20\\d\\d\\]/g) || []).length;
        if (marks > 1) break;
        el = p;
      }
      if (roots.indexOf(el) === -1 && /Read Story/.test(el.textContent)) roots.push(el);
    }
    return roots;
  }

  function findParts() {
    // Selected Works 標題（最深的那個元素）
    var heading = null;
    var all = document.querySelectorAll('div,h1,h2,h3,p,span');
    for (var i = 0; i < all.length; i++) {
      if (txt(all[i]) === 'Selected Works' && (!heading || heading.contains(all[i]))) heading = all[i];
    }
    if (!heading) return null;
    var cards = cardRoots(document.body);
    var pomo = null;
    for (var j = 0; j < cards.length; j++) if (/POMO/.test(cards[j].textContent)) pomo = cards[j];
    if (!pomo) return null;
    // 區塊 = 同時包含標題與 POMO 卡的最低共同祖先
    var section = heading;
    while (section.parentElement && !section.contains(pomo)) section = section.parentElement;
    if (!section || section === document.body) return null;
    return { section: section, pomo: pomo };
  }

  function rewriteCard(clone, originalCard) {
    var walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var s = n.nodeValue.trim();
      if (/^\\[20\\d\\d\\]$/.test(s)) n.nodeValue = '[2026]';
      else if (s.indexOf(COPY[LANG].cardTitle) === 0) n.nodeValue = NEW.title;
      else if (s.indexOf('POMO Network') === 0) n.nodeValue = NEW.desc;
      else if (TAG_MAP[s]) n.nodeValue = TAG_MAP[s];
      else if (s.indexOf('image generate') !== -1) n.nodeValue = '';
    }
    // 圖片：以原卡實測尺寸分角色（icon 不動／最高層換封面／其餘層隱藏）
    var oImgs = originalCard.querySelectorAll('img');
    var cImgs = clone.querySelectorAll('img');
    var m = Math.min(oImgs.length, cImgs.length);
    var bigIdx = [], maxH = 0, coverIdx = -1;
    for (var i = 0; i < m; i++) {
      var r = oImgs[i].getBoundingClientRect();
      if (r.width < 100) continue;
      bigIdx.push(i);
      if (r.height > maxH) { maxH = r.height; coverIdx = i; }
    }
    for (var j = 0; j < bigIdx.length; j++) {
      var k = bigIdx[j], im = cImgs[k];
      if (k === coverIdx) {
        im.removeAttribute('srcset');
        im.removeAttribute('sizes');
        im.src = NEW.img;
        im.alt = NEW.title;
        im.style.objectFit = 'cover';
        im.style.width = '100%';
        im.style.height = '100%';
        var absBox = im.parentElement;
        if (absBox) { absBox.style.width = '100%'; absBox.style.height = '100%'; }
        var relBox = absBox && absBox.parentElement;
        if (relBox) {
          relBox.style.height = 'auto'; relBox.style.aspectRatio = '716 / 461';
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

  function build(parts) {
    var clone = parts.section.cloneNode(true);
    clone.id = SECTION_ID;
    var ids = clone.querySelectorAll('[id]');
    for (var i = 0; i < ids.length; i++) ids[i].removeAttribute('id');
    // 標題改字
    var walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.trim() === 'Selected Works') { n.nodeValue = NEW.heading; break; }
    }
    // 只留 POMO 卡（改寫成 AI 協作系統卡），其餘卡與 VIEW ALL 移除
    var cards = cardRoots(clone);
    var keep = null;
    for (var j = 0; j < cards.length; j++) {
      if (/POMO/.test(cards[j].textContent) && !keep) keep = cards[j];
      else cards[j].parentNode && cards[j].parentNode.removeChild(cards[j]);
    }
    if (!keep) return null;
    rewriteCard(keep, parts.pomo);
    var els = clone.querySelectorAll('*');
    for (var v = els.length - 1; v >= 0; v--) {
      if (/^VIEW ALL/i.test(txt(els[v])) && !els[v].querySelector('img')) {
        var box = els[v];
        while (box.parentElement && box.parentElement !== clone && /^VIEW ALL/i.test(txt(box.parentElement))) box = box.parentElement;
        box.parentNode && box.parentNode.removeChild(box);
        break;
      }
    }
    // 設計哲學金句也住在同一個區塊容器裡，但不屬於 AI Workflow 區塊（設計稿只有標題＋卡片）
    var els2 = clone.querySelectorAll('*');
    for (var q = els2.length - 1; q >= 0; q--) {
      var qt = txt(els2[q]);
      if (qt.indexOf(COPY[LANG].quote) === 0) {
        var qbox = els2[q];
        while (qbox.parentElement && qbox.parentElement !== clone && txt(qbox.parentElement) === qt) qbox = qbox.parentElement;
        qbox.parentNode && qbox.parentNode.removeChild(qbox);
        break;
      }
    }
    // 清進場動畫殘留（clone 不受 runtime 動畫接管）
    var all = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
    for (var s2 = 0; s2 < all.length; s2++) {
      var st = all[s2].style;
      if (!st) continue;
      if (st.opacity !== '' && parseFloat(st.opacity) < 1) st.opacity = '1';
      if (st.transform && st.transform !== 'none') st.transform = 'none';
    }
    // 卡片區導向詳情頁（標題帶的區塊不攔，維持區塊標題無互動的慣例）
    clone.addEventListener('click', function (e) {
      var card = keep;
      if (card && card.contains(e.target)) {
        e.preventDefault(); e.stopPropagation();
        window.location.href = '/my-ai-workflow';
      } else {
        e.preventDefault(); e.stopPropagation();
      }
    }, true);
    if (keep) { keep.style.cursor = 'pointer'; keep.setAttribute('data-molly-card', '1'); }
    return clone;
  }


  // Read Story 按鈕標記（hover 反色用）：從文字節點往上爬到含箭頭 icon 的外框
  function tagReadStory(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.trim() === 'Read Story') {
        var btn = n.parentElement;
        for (var d = 0; d < 4 && btn && !btn.querySelector('img'); d++) btn = btn.parentElement;
        if (btn) {
          btn.setAttribute('data-molly-btn', '1');
          if (!btn.__mollyMag) {
            btn.__mollyMag = true;
            // 縮放中心跟著游標：產生「按鈕跟著滑鼠微微移動」的原生手感
            btn.addEventListener('mousemove', function (e) {
              var r = btn.getBoundingClientRect();
              btn.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
            });
            btn.addEventListener('mouseleave', function () { btn.style.transformOrigin = '50% 50%'; });
          }
        }
        return;
      }
    }
  }

  // 出場動畫：參數照 works.json 的 appear（0.8s INOUT_CUBIC，入視窗淡入上移）。
  // 完成後清掉 inline 樣式並掛 .molly-in，讓卡片層級的 hover/press CSS 接手。
  function entrance(el, hoverTarget) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(140px)';
    el.style.transition = 'opacity .8s cubic-bezier(.215,.61,.355,1), transform .8s cubic-bezier(.215,.61,.355,1)'; // Home 原生 appear=OUT_CUBIC
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      el.style.transition = ''; el.style.transform = ''; el.style.opacity = '';
      (hoverTarget || el).classList.add('molly-in');
    }
    function show() { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; setTimeout(finish, 850); }
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
    // 只在首頁網址下動作
    if (!/^\\/((zh|en)\\/?)?$/.test(location.pathname)) return;
    if (document.getElementById(SECTION_ID)) return;
    var parts = findParts();
    if (!parts) return;
    var clone = build(parts);
    if (!clone) return;
    tagReadStory(clone);
    parts.section.parentElement.insertBefore(clone, parts.section);
    entrance(clone, clone.querySelector('[data-molly-card]'));
  }

  var scheduled = false;
  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; mount(); }, 150);
  }
  function ensureHoverStyle() {
    if (document.getElementById('molly-hover-home')) return;
    var st = document.createElement('style');
    st.id = 'molly-hover-home';
    st.textContent = '#molly-aiwf-section img[data-molly-cover]{transition:transform .55s cubic-bezier(.34,1.45,.64,1),opacity .3s ease !important;}' +
        '#molly-aiwf-section [data-molly-cover-box]{overflow:hidden;}' +
        '#molly-aiwf-section [data-molly-cover-box]:hover img[data-molly-cover]{transform:scale(.95) !important;opacity:.9 !important;}' +
        '#molly-aiwf-section [data-molly-btn]{transition:transform .3s cubic-bezier(.215,.61,.355,1) !important;}' +
        '#molly-aiwf-section [data-molly-btn]:hover{transform:scale(.9) !important;}';
    document.head.appendChild(st);
  }

  function boot() {
    ensureHoverStyle();
    mount();
    new MutationObserver(scheduleMount).observe(document.documentElement, { childList: true, subtree: true });
    [500, 1500, 3000, 5000].forEach(function (t) { setTimeout(mount, t); });
    setInterval(ensureHoverStyle, 1400);
    // SPA 轉場會把整棵 DOM 換掉，掛在舊樹上的 MutationObserver 會靜默死亡；
    // setInterval 掛在 window 上不受影響，當常駐心跳補掛。
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
console.log(`home AI Workflow patch applied to ${FILES.length} pages (zh + en)`);
