// Home Hero 標題改「我是｛形容詞｝的產品設計師」＋形容詞輪播（Molly 08-13 拍板：A 組用字、不留括號）
// 參考：Molly 08-13 給的 Pinterest ARKETYPE 動態（括號夾住輪播字、寬度跟著字伸縮）。
// 注入全部 9 個 zh 頁（SPA 換頁不重載 HTML）；網址門檻＝首頁；心跳保活。
// 形容詞清單改 WORDS 一行即可。用法：node scripts/patch-hero-rotator.mjs（可重複執行）
import { readFile, writeFile } from 'node:fs/promises';

const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = PAGES.map((p) => new URL(`../dist/zh/${p ? p + '/' : ''}index.html`, import.meta.url).pathname);
const MARKER = 'molly-hero-rotator';

const SNIPPET = `<script id="${MARKER}">
(function () {
  // A 組（Molly 08-13 拍板）。「善用 AI 」尾端帶空格＝AI 與「的」之間的字距，
  // 純中文詞不加（瀏覽器不會自動幫 CJK/Latin 加間距）
  var WORDS = ['善用 AI ', '直指核心', '動手實作', '帶有溫度'];
  var BASE = '我是一名產品設計師';           // 原句（用來找目標 h2）
  var HOLD = 2400, SLIDE = 450;             // 停留／滑動毫秒
  var EASE = 'cubic-bezier(.215,.61,.355,1)'; // 站上原生 OUT_CUBIC

  function onHome() {
    return /^\\/((zh|en)\\/)?$/.test(location.pathname);
  }

  function findTarget() {
    var hs = document.querySelectorAll('h2');
    for (var i = 0; i < hs.length; i++) {
      var t = (hs[i].textContent || '').trim();
      if (t === BASE || hs[i].getAttribute('data-molly-rot') === 'gone') return hs[i];
    }
    return null;
  }

  function build(h2) {
    h2.setAttribute('data-molly-rot', 'on');
    h2.textContent = '';
    var frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode('我是'));
    var box = document.createElement('span');
    box.className = 'molly-rot';
    box.style.cssText = 'display:inline-flex;position:relative;overflow:hidden;vertical-align:bottom;' +
      'transition:width ' + SLIDE + 'ms ' + EASE + ';white-space:nowrap;';
    var track = document.createElement('span');
    track.className = 'molly-rot-track';
    track.style.cssText = 'display:flex;flex-direction:column;transition:transform ' + SLIDE + 'ms ' + EASE + ';';
    WORDS.concat(WORDS[0]).forEach(function (w) {   // 尾端補第一個字，循環時無縫
      var s = document.createElement('span');
      s.textContent = w;
      s.style.cssText = 'display:block;white-space:nowrap;';
      track.appendChild(s);
    });
    box.appendChild(track);
    frag.appendChild(box);
    frag.appendChild(document.createTextNode('的產品設計師'));
    h2.appendChild(frag);
    return box;
  }

  function measure(box) {
    var kids = box.querySelector('.molly-rot-track').children;
    var widths = [], h = 0;
    for (var i = 0; i < kids.length; i++) {
      widths.push(kids[i].getBoundingClientRect().width);
      h = Math.max(h, kids[i].getBoundingClientRect().height);
    }
    return { widths: widths, h: h };
  }

  var state = window.__mollyRotState = window.__mollyRotState || { idx: 0 };

  function apply() {
    if (!onHome()) return;
    if (document.querySelector('.molly-rot')) return;
    var h2 = findTarget();
    if (!h2) return;
    var box = build(h2);
    var m = measure(box);
    if (!m.h || !m.widths[0]) { h2.textContent = BASE; h2.removeAttribute('data-molly-rot'); return; } // 字型未就緒，留給心跳
    box.style.height = m.h + 'px';
    box.__m = m;
    var track = box.querySelector('.molly-rot-track');
    // 還原目前進度（SPA 重繪後接續）
    track.style.transition = 'none';
    box.style.transition = 'none';
    box.style.width = m.widths[state.idx] + 'px';
    track.style.transform = 'translateY(' + (-state.idx * m.h) + 'px)';
    void box.offsetWidth;
    track.style.transition = '';
    box.style.transition = '';
  }

  function tick() {
    var box = document.querySelector('.molly-rot');
    if (!box || !box.__m) return;
    var m = box.__m;
    var track = box.querySelector('.molly-rot-track');
    var next = state.idx + 1;
    box.style.width = m.widths[next] + 'px';
    track.style.transform = 'translateY(' + (-next * m.h) + 'px)';
    if (next === WORDS.length) {           // 滑到複製的第一個字 → 動畫結束後瞬間跳回 0
      state.idx = 0;
      setTimeout(function () {
        var b2 = document.querySelector('.molly-rot');
        if (!b2) return;
        var t2 = b2.querySelector('.molly-rot-track');
        t2.style.transition = 'none';
        t2.style.transform = 'translateY(0)';
        void t2.offsetWidth;
        t2.style.transition = '';
      }, SLIDE + 50);
    } else {
      state.idx = next;
    }
  }

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function boot() {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(apply, 50); });
    apply();
    new MutationObserver(function () { try { apply(); } catch (e) {} })
      .observe(document.documentElement, { childList: true, subtree: true });
    setInterval(function () { try { apply(); } catch (e) {} }, 700);
    if (!reduced && !window.__mollyRotTimer) {
      window.__mollyRotTimer = setInterval(function () { try { tick(); } catch (e) {} }, HOLD);
    }
    // 視窗縮放後字寬會變，重新量
    window.addEventListener('resize', function () {
      var box = document.querySelector('.molly-rot');
      if (!box) return;
      var m = measure(box); box.__m = m;
      box.style.transition = 'none';
      box.style.height = m.h + 'px';
      box.style.width = m.widths[state.idx] + 'px';
      box.querySelector('.molly-rot-track').style.transform = 'translateY(' + (-state.idx * m.h) + 'px)';
      void box.offsetWidth;
      box.style.transition = '';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;

{
  const inner = SNIPPET.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  new Function(inner);
}
const existing = new RegExp('<script id="' + MARKER + '">[\\s\\S]*?</' + 'script>');
for (const file of FILES) {
  let html = await readFile(file, 'utf8');
  if (existing.test(html)) html = html.replace(existing, SNIPPET);
  else html = html.replace('</head>', SNIPPET + '\n</head>');
  await writeFile(file, html);
}
console.log(`hero rotator applied to ${FILES.length} zh pages`);
