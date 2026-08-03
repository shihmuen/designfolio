// 首頁「AI Workflow」區塊補丁（依 Figma 設計稿 WVaawWlrGsjWH25AIrptms node 792:622）。
// 做法：clone 首頁的 Selected Works 區塊 → 標題改 AI Workflow、只留一張卡並改寫成
// 「設計我的 AI 協作系統」[2026]、移除 VIEW ALL 按鈕 → 插到原區塊前面。
// 用法：node scripts/patch-home-aiwf.mjs（可重複執行，會替換舊版）
// 目前只套用中文版（dist/zh/index.html）；英文版待 Molly 確認後另加。
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../dist/zh/index.html', import.meta.url).pathname;
const MARKER = 'molly-home-aiwf-patch';

const SNIPPET = `<script id="${MARKER}">
(function () {
  var SECTION_ID = 'molly-aiwf-section';
  var NEW = {
    heading: 'AI Workflow',
    title: '設計我的 AI 協作系統',
    desc: '沒有 coding 背景的我，用 UX 方法把 Claude 設計成協作系統——幫我打造 POC 對齊團隊、把討論轉成開發文件、依驗收標準執行設計稿。',
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
      else if (s.indexOf('POMO 生態系統') === 0) n.nodeValue = NEW.title;
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
        if (relBox) { relBox.style.height = 'auto'; relBox.style.aspectRatio = '716 / 461'; }
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
    // 清進場動畫殘留（clone 不受 runtime 動畫接管）
    var all = [clone].concat(Array.prototype.slice.call(clone.querySelectorAll('*')));
    for (var s2 = 0; s2 < all.length; s2++) {
      var st = all[s2].style;
      if (!st) continue;
      if (st.opacity !== '' && parseFloat(st.opacity) < 1) st.opacity = '1';
      if (st.transform && st.transform !== 'none') st.transform = 'none';
    }
    // Read Story 暫不可點（內頁未完成）
    clone.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
    return clone;
  }

  function mount() {
    if (document.getElementById(SECTION_ID)) return;
    var parts = findParts();
    if (!parts) return;
    var clone = build(parts);
    if (!clone) return;
    parts.section.parentElement.insertBefore(clone, parts.section);
  }

  var scheduled = false;
  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; mount(); }, 150);
  }
  function boot() {
    mount();
    new MutationObserver(scheduleMount).observe(document.documentElement, { childList: true, subtree: true });
    [500, 1500, 3000, 5000].forEach(function (t) { setTimeout(mount, t); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;

let html = await readFile(FILE, 'utf8');
const existing = new RegExp('<script id="' + MARKER + '">[\\s\\S]*?</' + 'script>');
if (existing.test(html)) {
  html = html.replace(existing, SNIPPET);
  console.log('replaced existing home AI Workflow patch');
} else {
  html = html.replace('</head>', SNIPPET + '\n</head>');
  console.log('patched zh/index.html with AI Workflow section');
}
await writeFile(FILE, html);
