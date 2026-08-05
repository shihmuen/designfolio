// memory-gallery 的 NEXT PROJECT 改指向 /my-ai-workflow（Molly 2026-07-06 拍板）。
// 原循環 …→旅行回憶錄→POMO 改為 …→旅行回憶錄→My AI Workflow→POMO→…。
// 做法：就地改寫 runtime 渲染的 NEXT 卡（標題/封面/點擊），心跳保活（SPA 重繪會還原）。
// 用法：node scripts/patch-memory-next.mjs（可重複執行，會替換舊版）
import { readFile, writeFile } from 'node:fs/promises';

const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = PAGES.map((p) => new URL(`../dist/zh/${p ? p + '/' : ''}index.html`, import.meta.url).pathname);
const MARKER = 'molly-memory-next-patch';

const SNIPPET = `<script id="${MARKER}">
(function () {
  var NEW = { title: '設計我的 AI 協作系統', img: '/_assets/custom/ai-collab-cover.jpg', href: '/my-ai-workflow' };

  function findNextCard() {
    // 含「NEXT PROJECT」與 POMO 標題的最深容器
    var nodes = document.querySelectorAll('div,section,a');
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i].textContent || '';
      if (t.indexOf('NEXT PROJECT') !== -1 && t.indexOf('POMO 生態系統') !== -1 &&
          t.indexOf('BACK TO TOP') === -1) {
        if (!best || best.contains(nodes[i])) best = nodes[i];
      }
    }
    return best;
  }

  function findCardByMark() {
    var m = document.querySelector('[data-molly-next-seen="1"]');
    var card = m || findNextCard();
    if (!card) return null;
    // 圖片常在文字容器的外層兄弟節點：往上爬到「含 img 且尚未包含 footer」的容器
    while (!card.querySelector('img') && card.parentElement &&
           (card.parentElement.textContent || '').indexOf('BACK TO TOP') === -1) {
      card = card.parentElement;
    }
    return card.querySelector('img') ? card : (m || card);
  }

  function apply() {
    if (!/^\\/(zh\\/)?memory-gallery\\/?$/.test(location.pathname)) return;
    var card = findCardByMark();
    if (!card || card.getAttribute('data-molly-next') === '1') return;
    card.setAttribute('data-molly-next-seen', '1'); // 標題換掉後仍找得回同一張卡
    // 標題（可能已換過）
    var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.indexOf('POMO 生態系統') !== -1) n.nodeValue = NEW.title;
    }
    // 點擊導向（只掛一次；攔下 runtime 原本往 /pomo-ecosystem 的行為）
    if (!card.__mollyNextClick) {
      card.__mollyNextClick = true;
      card.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        window.location.href = NEW.href;
      }, true);
    }
    // 封面：等圖片可量測才動手；換好才設完成標記（否則下輪重試）
    if (!card.querySelector('img[src*="ai-collab"]')) {
      var imgs = Array.prototype.slice.call(card.querySelectorAll('img'));
      var big = null, maxA = 0;
      imgs.forEach(function (im) {
        var r = im.getBoundingClientRect();
        if (r.width * r.height > maxA) { maxA = r.width * r.height; big = im; }
      });
      if (!big || maxA < 10000) return; // 版面未就緒，留給心跳重試
      imgs.forEach(function (im) {
        if (im === big) {
          im.removeAttribute('srcset');
          im.removeAttribute('sizes');
          im.src = NEW.img;
          im.alt = NEW.title;
          im.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;object-fit:cover;mix-blend-mode:normal;';
        } else if (im.getBoundingClientRect().width > 100) {
          im.style.display = 'none';
        }
      });
    }
    card.setAttribute('data-molly-next', '1');
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

// 守門：輸出前驗證 snippet 語法
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
console.log(`memory-next patch applied to ${FILES.length} zh pages`);
