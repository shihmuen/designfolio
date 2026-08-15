// Home Hero v4（Figma 892:1996 標題＋894:2325 Switch，Molly 2026-08-15 拍板）
//
//   L1  嗨，我是 Molly Shih
//   L2  一個 [咖啡杯滑動 Switch]
//   L3  ｛ 變數 ｝的 身分
//
//   ｛變數｝在「以前的我 ⇄ 現在的我」之間每 1.5 秒循環，兩個模式各一組：
//     ☕ WORK  { 不會寫 code }    ⇄ { 用 POC 說話 }      的產品設計師 · Playlist Light
//     🥛 FUN   { 只停留在 Figma } ⇄ { 自己動手實現創意 }  的產品建造者 · Playlist Dark
//   身分（產品設計師／產品建造者）跟著模式走，不參與循環。
//
//   描述換版本 C（HTML 直接改，避免載入瞬間閃舊文案；SPA 重繪由心跳補回）。
//   魚眼照 → my-secret-playlist ?embed 播放器：**不自動播放**，父頁只負責
//   postMessage 換膚，要出聲一律由使用者自己在卡片上點。
//
// 取代 patch-hero-v3.mjs / patch-hero-rotator.mjs（本腳本會順手移除舊 marker）。
import { readFile, writeFile } from 'node:fs/promises';

// SPA 用的 page JSON：不一起改的話 React 會回報 hydration 文字不符（#425），
// 而且重繪時會把舊文案貼回來（雖然心跳補得回來，但會閃一下）
const JSON_INDEX = { zh: '34ddc871-1935-46fd-93e3-c2eb6d531cbb', en: '41561a94-f7b9-4c5f-b246-737709e61165' };

const PAGES = ['', 'nav', 'about-me', 'works', 'pomo-ecosystem', 'nfc-claming', 'clovis-mvp', 'token-generate-event', 'memory-gallery'];
const FILES = [];
for (const lang of ['zh', 'en']) {
  for (const p of PAGES) FILES.push({ lang, path: new URL(`../dist/${lang}/${p ? p + '/' : ''}index.html`, import.meta.url).pathname });
}
const MARKER = 'molly-hero-v4';
const OLD_MARKERS = ['molly-hero-v3', 'molly-hero-rotator'];

// ── 描述改版（版本 C）：HTML 內是純文字 <p>，直接換掉三個 breakpoint 的副本 ──
const DESC = {
  zh: {
    from: '嗨，我是 Molly，現居台北。我在新創公司累積了超過 5 年的設計經驗，習慣直指用戶需求的核心，跨團隊協作尋找最適合的解決方案，並在快速變動的環境中全力投入設計。這些年的歷練與探索讓我越來越清楚一件事：我希望有一天能打造一個真正屬於我的產品 —— 一個能真正解決問題、同時帶有情感厚度的產品。',
    to: '現居台北，做了五年產品設計。以前我的創意只能停在設計稿上，等人來實現；現在我可以自己動手，把它做成可以點、可以用、真的存在的東西。這件事改變了我看設計的方式 —— 我想做的不只是好看的介面，而是一個真正解決問題、又帶著溫度的產品。'
  },
  en: {
    from: 'Hi, I’m Molly, based in Taipei. With over 5 years of design experience in the startup, I’m used to getting to the core of user needs, collaborating across teams to find the most fitting solutions, and bringing my full design energy into fast-moving environments. These years of experience and exploration have made one thing clearer to me: I hope to one day create a product I can fully devote myself to—one that truly solves real problems and carries emotional depth.',
    to: 'Based in Taipei, five years into product design. My ideas used to stop at the mockup, waiting for someone else to build them; now I build them myself — into something you can click, use, and actually hold. That changed how I see design: I don’t just want a beautiful interface, I want a product that solves a real problem and still has warmth to it.'
  }
};

const SNIPPET = `<script id="${MARKER}">
(function () {
  var LANG = document.documentElement.getAttribute('data-molly-lang') || 'zh';
  var CUP = { WORK: '/_assets/custom/hero/cup-work.png', FUN: '/_assets/custom/hero/cup-fun.png' };
  var EASE = 'cubic-bezier(.215,.61,.355,1)';
  var KNOB_EASE = 'cubic-bezier(.32,.72,.28,1)';
  var HOLD = 1500;                       // 每一格停留多久（以前的我 ⇄ 現在的我，持續循環）
  // 設計稿 1280 量到的行距（墨水帶）：L1 181..248 / L2 284..350 / L3 391..457
  // → L1底→L2頂 36、L2底→L3頂 41、L3底→描述頂 150。用 L3 字級的倍數存，跟著縮放走。
  // ⚠️ 舊值 36/41/150 是量「舊的」設計稿節點（892:1996），不是現行的 792:622。
  //    重量之後行距明顯偏小，Molly 回報「垂直 padding 太少」就是這個原因。
  //    以下是 792:622 三個 frame 的實測墨帶間距（Figma px，絕對值不是比例
  //    —— 桌機與平板的間距其實幾乎一樣，並沒有跟著字級縮）。
  //   設計稿墨帶間距： 桌機 48/55/153 ｜ 平板 55/53/153 ｜ 手機 24/26/46
  //   但這裡設的是「盒子的 margin」，比墨帶間距小（差的是行高的上下留白）。
  //   桌機的 36/41/150 是 Molly 已核可的手感，反推差值＝ 12 / 14 / 3，
  //   平板與手機套用同一組差值，桌機因此完全不動。
  var GAPS = [{ bp: 1024, l2: 36, l3: 41, desc: 150 },   // 🔒 已定案，勿動
              { bp: 600,  l2: 43, l3: 39, desc: 150 },
              { bp: 0,    l2: 12, l3: 12, desc: 43  }];
  function gapSpec() {
    var vw = document.documentElement.clientWidth;
    for (var i = 0; i < GAPS.length; i++) if (vw >= GAPS[i].bp) return GAPS[i];
    return GAPS[GAPS.length - 1];
  }
  // ── 播放器尺寸：完全不縮放 ──
  // ⚠️ 這裡刻意不做任何 transform:scale()。之前試過兩種縮法都出事：
  //    ① 縮在 iframe 內部 → Safari 把卡片的 border-radius 光柵化錯掉（同一個 76px
  //       圓角，左上正常、右上變成一個巨大圓弧把卡片切掉）
  //    ② 縮整個 <iframe> → 內部 fitStage() 會在 innerWidth 還是 0 時算出負數縮放
  //    所以現在讓 widget 用原生尺寸渲染（?natural=1），外面也不縮——
  //    走的是跟「單獨開啟 widget」完全相同的路徑，那個路徑實測是乾淨的。
  //    代價：卡片是原生的 420，比設計稿的 359 大一些。
  // 各 breakpoint 的卡片寬與對齊方式（Figma 792:622 逐一量到）
  //   1280 → 354 ≈ 360（Molly 已定案，維持 360）、右對齊
  //    800 → 316、右對齊
  //    375 → 235、置中
  var SIZES = [{ bp: 1024, card: 360, align: 'right' },
               { bp: 600,  card: 316, align: 'right' },
               { bp: 0,    card: 235, align: 'center' }];
  function sizeFor() {
    var vw = document.documentElement.clientWidth;
    for (var i = 0; i < SIZES.length; i++) if (vw >= SIZES[i].bp) return SIZES[i];
    return SIZES[SIZES.length - 1];
  }
  var CARD = 360;                        // 目前使用的卡片寬（由 sizeFor() 決定）

  var CFG = LANG === 'en' ? {
    hi: "Hi, I'm ", a: 'a ',
    modes: {
      WORK: { intro: "|can't-code|", word: '|POC-shipping|', role: ' product designer',
              label: 'slide to build something FUN', theme: 'light' },
      FUN:  { intro: '|Figma-only|',  word: '|hands-on|',     role: ' product builder',
              label: 'slide to get back to WORK', theme: 'dark' }
    },
    descHead: 'Based in Taipei, five years into product design.'
  } : {
    hi: '嗨，我是 ', a: '一個 ',
    modes: {
      WORK: { intro: '不會寫 |code|',   word: '用 |POC| 說話',  role: ' 的產品設計師',
              label: '滑過來，做點好玩的', theme: 'light' },
      FUN:  { intro: '只停留在 |Figma|', word: '自己動手實現創意', role: ' 的產品建造者',
              label: '滑回去，繼續工作', theme: 'dark' }
    },
    descHead: '現居台北，做了五年產品設計。'
  };

  // Switch 皮膚：WORK 淺米色軌道＋黑咖啡在左，FUN 深咖啡軌道＋拿鐵在右
  var SKIN = {
    WORK: { track: '#dfdacd', ink: '#625d45', at: 0, shadow: '2px 2px 8px rgba(0,0,0,.26)' },
    FUN:  { track: '#514539', ink: '#ebe9df', at: 1, shadow: '-2px -2px 8px rgba(0,0,0,.26)' }
  };

  var mode = window.__mollyHero4 = window.__mollyHero4 || { m: 'WORK' };
  var phaseTimer = null;
  var phase = 0;                         // 0＝以前的我（intro）、1＝現在的我（word）

  function byId(i) { return document.getElementById(i); }
  function onHome() { return /^\\/((zh|en)\\/)?$/.test(location.pathname); }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function q(sel, txt) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      if ((els[i].textContent || '').trim() === txt) return els[i];
    }
    return null;
  }
  function cursiveFF() {
    var c = q('h2', 'olly Shih');
    return c ? getComputedStyle(c).fontFamily : 'inherit';
  }
  // |...| 包起來的字段用手寫體（Figma Hand）
  function wordHTML(w, ff) {
    return w.split('|').map(function (seg, i) {
      if (!seg) return '';
      return i % 2 === 1
        ? '<span style="font-family:' + ff + ';font-weight:400;white-space:pre;">' + seg + '</span>'
        : '<span style="white-space:pre;">' + seg + '</span>';
    }).join('');
  }

  // ── 字槽：換字時做 MoMA 式上滾出／下滾入，槽寬高跟著新字補間 ──
  // ── 變數槽位寬度鎖定 ───────────────────────────────────────────────────
  // 兩句變數長度不同（例：只停留在 Figma／自己動手實現創意），若槽位跟著當前字
  // 走，每 1.5 秒換字時大括號與後面的身分都會左右位移。改成鎖定「同一模式兩句
  // 的較寬者」——換字時整行不動，只有模式切換才會重新量。
  var SLOTW = 0;
  function measureWord(html) {
    var w = byId('mh4-word');
    if (!w || !w.parentElement || !w.parentElement.parentElement) return 0;
    var host = w.parentElement.parentElement;      // 槽位的父層＝標題行，字型才會對
    var m = byId('mh4-measure');
    if (!m || m.parentElement !== host) {
      if (m && m.parentElement) m.parentElement.removeChild(m);
      m = document.createElement('span');
      m.id = 'mh4-measure';
      m.setAttribute('aria-hidden', 'true');
      m.style.cssText = 'position:absolute;left:-9999px;top:0;' +
        'white-space:nowrap;visibility:hidden;pointer-events:none;';
      host.appendChild(m);
    }
    m.innerHTML = html;
    return m.offsetWidth;
  }
  function lockSlotWidth() {
    var cfg = CFG.modes[mode.m], ff = cursiveFF();
    var a = measureWord(wordHTML(cfg.intro, ff));
    var b = measureWord(wordHTML(cfg.word, ff));
    if (a || b) SLOTW = Math.max(a, b);
  }

  function fit(slot, word, animate) {
    if (!slot || !word) return;
    if (!animate) slot.style.transition = 'none';
    // offsetWidth/Height 不受 transform 影響——換字瞬間舊動畫的 scaleY 還掛在字上，
    // getBoundingClientRect 會量到壓縮後的高度，把槽設矮就裁掉新字
    var fixed = (slot.id === 'mh4-slot' && SLOTW) ? SLOTW : word.offsetWidth;
    // ⚠️ 變寬要立即、變窄才走過渡。槽位有 overflow:hidden，換模式時新的字已經在
    //    裡面了，若讓寬度花 0.3 秒才長到位，這段期間字會被左右裁掉。
    var now = parseFloat(slot.style.width) || 0;
    if (fixed > now) {
      var keep = slot.style.transition;
      slot.style.transition = 'none';
      slot.style.width = fixed + 'px';
      void slot.offsetWidth;
      slot.style.transition = animate ? (keep || 'width .3s ' + EASE) : 'none';
    } else {
      slot.style.width = fixed + 'px';
    }
    slot.style.height = word.offsetHeight + 'px';
    if (!animate) { void slot.offsetWidth; slot.style.transition = 'width .3s ' + EASE; }
  }
  function roll(slot, word, html, onIn) {
    if (!slot || !word) return;
    word.getAnimations().forEach(function (a) { try { a.cancel(); } catch (e) {} });
    function settle() {
      word.innerHTML = html;
      fit(slot, word, true);
    }
    // ⚠️ 分頁／預覽窗格被判定 hidden 時 WAAPI 不推進，finished 永遠不 resolve，
    //    而 fill:forwards 會把字釘在 opacity:0 → 直接不演，寧可硬切也不要空白
    if (reduced() || document.visibilityState === 'hidden') {
      settle(); if (onIn) onIn(); return;
    }
    var swapped = false, out = null;
    function swap() {
      if (swapped) return;
      swapped = true;
      if (out) { try { out.cancel(); } catch (e) {} }
      settle();
      var inA = word.animate(
        [{ transform: 'translateY(105%) scaleY(.45)', opacity: 0 },
         { transform: 'translateY(45%) scaleY(.6)', opacity: .5 },
         { transform: 'translateY(0) scaleY(1)', opacity: 1 }],
        { duration: 300, easing: EASE, fill: 'forwards' });
      // 進場動畫的第一格就是 opacity:0，卡住的話字會整個消失 → 逾時強制收尾
      setTimeout(function () { try { inA.cancel(); } catch (e) {} }, 900);
      if (onIn) onIn();
    }
    out = word.animate(
      [{ transform: 'translateY(0) scaleY(1)', opacity: 1 },
       { transform: 'translateY(-55%) scaleY(.55)', opacity: .4 },
       { transform: 'translateY(-105%) scaleY(.45)', opacity: 0 }],
      { duration: 210, easing: 'cubic-bezier(.5,.05,.75,.4)', fill: 'forwards' });
    out.finished.then(swap).catch(swap);
    setTimeout(swap, 430);          // finished 沒來就自己接手
  }

  // ── 標題尺寸：設計稿 1280 的標題是 48px，線上是 80px（ABOUT ME 按鈕
  //    兩邊都 200x70，確認同比例）。不縮的話 FUN 模式那行會換行。
  //    每次都「先清 inline 再讀」，才不會在 breakpoint 變動時越縮越小。
  // 各 breakpoint 的標題字級（Figma 792:622 量「一個＋Switch」那一行的墨高比得出：
  //   桌機 40.7 / 平板 31.1 / 手機 26.3 → 1 / .764 / .646，乘桌機的 48）
  // 存「設計稿字級」而不是縮放比：執行時除以站台原生字級，站台字級改了也會自動跟上。
  //   1280 原生 80 → 48/80 = .6（與原本的 TSCALE 相同）｜375 原生 44 → 31/44 = .705
  // 字級用「L3 整行墨寬比」推算——字串完全相同，比墨高可靠（墨高會被細筆畫的
  // 大括號拉偏）：桌機 734.8=48px、平板 576.9 → 37.7。
  // 手機另有一個硬性驗證：設計稿的「嗨，我是 Molly Shih」是**兩行**，
  // 27px 會擠成一行、31px 才會斷 —— 以斷行行為定案 31。
  // Molly 08-16：網頁版（桌機）這段再放大 1.5% → 48 × 1.015 = 48.72
  // Switch 的寬高是以 em 計，會跟著一起放大，整塊維持同比例
  var TFONT = [{ bp: 1024, size: 48 * 1.015, center: true },
               { bp: 600,  size: 37.5, center: true },
               { bp: 0,    size: 31,   center: false }];  // 手機版設計稿是靠左，不置中
  function titleSpec() {
    var vw = document.documentElement.clientWidth;
    for (var i = 0; i < TFONT.length; i++) if (vw >= TFONT[i].bp) return TFONT[i];
    return TFONT[TFONT.length - 1];
  }
  var TSCALE = 0.6;
  // 基準字級只記一次。hi／「一個」是我新建的節點，清掉 inline 後會繼承到
  // 16px（不是 class 的 80px），所以它們的基準在建立當下就寫進 data 屬性。
  function baseOf(el) {
    if (!el.hasAttribute('data-mh4-bfs')) {
      var fs = el.style.fontSize, lh = el.style.lineHeight;
      el.style.fontSize = ''; el.style.lineHeight = '';
      var cs = getComputedStyle(el);
      el.setAttribute('data-mh4-bfs', parseFloat(cs.fontSize) || 0);
      el.setAttribute('data-mh4-blh', parseFloat(cs.lineHeight) || 0);
      el.style.fontSize = fs; el.style.lineHeight = lh;
    }
    return [parseFloat(el.getAttribute('data-mh4-bfs')), parseFloat(el.getAttribute('data-mh4-blh'))];
  }
  function titleEls() {
    var out = [];
    var hi = document.querySelector('[data-mh4-hi]');
    var l3 = document.querySelector('[data-mh4-line3]');
    var a = document.querySelector('[data-mh4-a]');
    var cur = q('h2', 'olly Shih');
    [hi, a, cur, l3].forEach(function (e) { if (e) out.push(e); });
    return out;
  }
  function scaleTitle() {
    var spec = titleSpec(), s = 1;
    var l3 = document.querySelector('[data-mh4-line3]');
    var lb = l3 && baseOf(l3);
    if (lb && lb[0]) s = spec.size / lb[0];
    titleEls().forEach(function (el) {
      var b = baseOf(el);
      if (!b[0]) return;
      el.style.fontSize = (b[0] * s) + 'px';
      if (b[1]) el.style.lineHeight = (b[1] * s) + 'px';
    });
    // 手寫 M 要一起縮。⚠️ 要縮的是圖外面那層占位 div（含它 -13px 的右 margin），
    // 只縮 <img> 的話盒子還是原寬，M 後面會空一大塊
    var cur = q('h2', 'olly Shih');
    var img = cur && cur.parentElement.parentElement.querySelector('img');
    var box = img && img.parentElement;
    if (img && box) {
      if (!box.hasAttribute('data-mh4-bw')) {
        box.style.width = ''; box.style.height = ''; box.style.marginRight = '';
        img.style.width = ''; img.style.height = '';
        var rb = box.getBoundingClientRect();
        box.setAttribute('data-mh4-bw', Math.round(rb.width));
        box.setAttribute('data-mh4-bh', Math.round(rb.height));
        box.setAttribute('data-mh4-bmr', parseFloat(getComputedStyle(box).marginRight) || 0);
      }
      box.style.width = Math.round(box.getAttribute('data-mh4-bw') * s) + 'px';
      box.style.height = Math.round(box.getAttribute('data-mh4-bh') * s) + 'px';
      box.style.marginRight = (box.getAttribute('data-mh4-bmr') * s) + 'px';
      img.style.width = '100%'; img.style.height = '100%';
    }
    groupName();
    centerTitle(spec.center);
  }

  // 設計稿三行標題是置中在「整頁」（中心 640/1280），但標題容器只有 952 寬
  // 且靠左 64 → 先在容器內置中，再補上兩個中心的差距
  // 手寫的 M 是圖片、olly Shih 是文字，兩者是同一列的獨立 flex 項目 →
  // 窄螢幕折行會插在它們中間，變成「嗨，我是 M / olly Shih」。
  // 把它們包成一個群組，折行只會發生在「嗨，我是」與「Molly Shih」之間（＝設計稿的斷法）。
  function groupName() {
    var cur = q('h2', 'olly Shih');
    if (!cur) return;
    var ollyBox = cur.parentElement;                 // .textContents
    if (!ollyBox || !ollyBox.parentElement) return;
    var row = ollyBox.parentElement;
    if (row.getAttribute('data-mh4-namegrp')) {      // 已經包過
      row.style.flexWrap = 'wrap';
      return;
    }
    var mBox = ollyBox.previousElementSibling;
    if (!mBox || !mBox.querySelector('img')) return;
    var grp = document.createElement('div');
    grp.setAttribute('data-mh4-namegrp', '1');
    // ⚠️ 這裡一定要 baseline，不能用 flex-end。整列是 align-items:baseline，
    //    包成群組後若內部用 flex-end，olly Shih 會被貼到 M 圖的底緣、脫離文字基線
    //    —— 實測整組往上跑 16.7px（Molly 回報「名字沒對齊、偏上」）。
    //    用 baseline 則群組內外的對齊方式與原本一模一樣：群組自身的基線＝第一個
    //    項目（M 圖盒）的基線，跟它以前直接掛在列上時相同。
    grp.style.cssText = 'display:flex;align-items:baseline;flex:0 0 auto;';
    row.insertBefore(grp, mBox);
    grp.appendChild(mBox);
    grp.appendChild(ollyBox);
    row.style.flexWrap = 'wrap';
    row.setAttribute('data-mh4-namegrp', '1');
  }

  function centerTitle(on) {
    var l3 = document.querySelector('[data-mh4-line3]');
    var l2 = byId('mh4-line2');
    var cur = q('h2', 'olly Shih');
    var line1 = cur && cur.parentElement.parentElement;
    // groupName() 把 M 與 olly Shih 包了一層，這裡要再往上一層才是「整列」，
    // 否則 justify-content 套在群組上，整行就置中不了
    if (line1 && line1.getAttribute('data-mh4-namegrp')) line1 = line1.parentElement;
    if (!l3) return;
    var host = l3.parentElement;
    var r = host.getBoundingClientRect();
    var shift = on ? Math.round(document.documentElement.clientWidth / 2 - (r.left + r.width / 2)) : 0;
    var tf = shift ? 'translateX(' + shift + 'px)' : '';
    l3.style.textAlign = on ? 'center' : '';
    l3.style.transform = tf;
    if (l2) { l2.style.justifyContent = on ? 'center' : ''; l2.style.transform = tf; }
    if (line1) { line1.style.justifyContent = on ? 'center' : ''; line1.style.transform = tf; }
  }
  // Switch 字級跟著 L3 走：設計稿是 L3 48px 對 switch 文字 20px
  // 三行標題的行距：設計稿比 runtime 預設鬆很多，靠 margin 補
  function spaceTitle() {
    var g = gapSpec();
    var l2 = byId('mh4-line2'), l3 = document.querySelector('[data-mh4-line3]');
    var dw = document.querySelector('[data-mh4-descwrap]');
    if (!l3) return;
    if (l2) l2.style.margin = g.l2 + 'px 0 0';
    l3.style.marginTop = g.l3 + 'px';
    if (dw) {
      // 描述本來就跟標題隔了一段（容器自己的間距），先歸零量出來再補差，
      // 直接設 153 會變成 153 ＋ 原本那段
      dw.style.marginTop = '0px';
      var have = dw.getBoundingClientRect().top - l3.getBoundingClientRect().bottom;
      dw.style.marginTop = Math.max(0, Math.round(g.desc - have)) + 'px';
    }
  }

  function sizeSwitch() {
    var l3 = document.querySelector('[data-mh4-line3]'), sw = byId('mh4-sw'), l2 = byId('mh4-line2');
    if (!l3 || !sw) return;
    var f = parseFloat(getComputedStyle(l3).fontSize) || 48;
    var fs = f * 0.42;
    // Switch 是固定 18.2em 寬的物件：窄螢幕塞不下就等比縮到剛好，
    // 不然它會整條被裁掉（手機版佈局另議，這裡只求不破圖）
    var avail = (l2 && l2.clientWidth) || l3.clientWidth || 0;
    if (avail) fs = Math.min(fs, avail / 18.2);
    sw.style.fontSize = Math.max(9, fs) + 'px';
    if (l2) l2.style.fontSize = f + 'px';
  }

  // ── Switch ──
  var drag = { on: false, moved: false, x0: 0, base: 0, x: 0 };
  function maxX() {
    var sw = byId('mh4-sw'), k = byId('mh4-knob');
    return (sw && k) ? Math.max(0, sw.clientWidth - k.offsetWidth) : 0;
  }
  function paintSwitch() {
    var sw = byId('mh4-sw'), lbl = byId('mh4-lbl'), knob = byId('mh4-knob');
    if (!sw || !lbl || !knob) return;
    var s = SKIN[mode.m], cfg = CFG.modes[mode.m];
    sw.style.background = s.track;
    sw.setAttribute('aria-checked', mode.m === 'FUN' ? 'true' : 'false');
    sw.setAttribute('aria-label', cfg.label);
    knob.style.backgroundImage = 'url("' + CUP[mode.m] + '")';
    knob.style.filter = 'drop-shadow(' + s.shadow + ')';
    if (!drag.on) knob.style.transform = 'translateX(' + (s.at * maxX()) + 'px)';
    lbl.style.color = s.ink;
    // 杯子在哪一側，文字就往另一側讓開
    lbl.style.left = mode.m === 'WORK' ? '3.8em' : '1em';
    lbl.style.right = mode.m === 'WORK' ? '1em' : '3.8em';
    if (!lbl.textContent) { lbl.textContent = cfg.label; lbl.style.opacity = '1'; }
    else if (lbl.textContent !== cfg.label) {
      lbl.style.opacity = '0';
      setTimeout(function () {
        var l = byId('mh4-lbl');
        if (l) { l.textContent = CFG.modes[mode.m].label; l.style.opacity = '1'; }
      }, 170);
    }
  }
  // ── Switch：整組動畫由單一進度值 p 驅動（0＝WORK、1＝FUN）─────────────────
  // 參考 Molly 給的 day/night toggle：滑動時軌道顏色、杯子、文字要「一起連續過渡」，
  // 而不是放開手才整批換掉。舊版拖曳中只有杯子會動，文字還是淡出→換字→淡入的閃爍。
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mix(c1, c2, t) {                       // '#rrggbb' 線性內插
    function ch(c, i) { return parseInt(c.substr(1 + i * 2, 2), 16); }
    var o = [0, 1, 2].map(function (i) { return Math.round(ch(c1, i) + (ch(c2, i) - ch(c1, i)) * t); });
    return 'rgb(' + o[0] + ',' + o[1] + ',' + o[2] + ')';
  }

  function paintSwitchAt(p) {
    var sw = byId('mh4-sw'), kn = byId('mh4-knob');
    if (!sw || !kn) return;
    mode.p = p;
    var W = SKIN.WORK, F = SKIN.FUN;
    sw.style.background = mix(W.track, F.track, p);
    kn.style.transform = 'translateX(' + (p * maxX()) + 'px)';
    // 兩張杯子疊著交叉淡入，換圖不會「跳」
    var kw = byId('mh4-cup-w'), kf = byId('mh4-cup-f');
    if (kw) kw.style.opacity = String(1 - p);
    if (kf) kf.style.opacity = String(p);
    // 影子隨杯子換邊，中間會自然經過「幾乎沒有偏移」
    var d = (2 - 4 * p).toFixed(2);
    kn.style.filter = 'drop-shadow(' + d + 'px ' + d + 'px 8px rgba(0,0,0,.26))';
    // 兩句文字交叉淡入：前後段各留一點純色時間，中間才交會
    var lw = byId('mh4-lbl-w'), lf = byId('mh4-lbl-f');
    var ink = mix(W.ink, F.ink, p);
    if (lw) { lw.style.opacity = String(clamp01(1 - p * 1.9)); lw.style.color = ink; }
    if (lf) { lf.style.opacity = String(clamp01((p - 0.47) * 1.9)); lf.style.color = ink; }
  }

  // 拖曳／點擊放開後，把 p 平滑帶到目標；跨過中點時才真正換模式
  function glideSwitch(to) {
    var from = mode.p == null ? SKIN[mode.m].at : mode.p;
    var fired = false;
    function maybeFire(v) {
      if (fired) return;
      var m = v >= 0.5 ? 'FUN' : 'WORK';
      if (m !== mode.m) { fired = true; enterMode(m, false); }
    }
    if (reduced()) { paintSwitchAt(to); maybeFire(to); return; }
    var done = false;
    function settle() { if (done) return; done = true; maybeFire(to); paintSwitchAt(to); }
    var t = tw(from, to, 460, function (v) { paintSwitchAt(v); maybeFire(v); },
       cb(0.32, 0.72, 0.28, 1), settle);
    if (t) t.sw = 1;
    // rAF 在背景分頁不推進 —— 逾時就直接歸位，別讓杯子卡在半路
    setTimeout(function () { if (!done) { flushSwitchTween(); settle(); } }, 700);
  }

  function buildSwitch(fs) {
    var sw = document.createElement('div');
    sw.id = 'mh4-sw';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('tabindex', '0');
    sw.style.cssText = 'position:relative;box-sizing:border-box;flex:0 0 auto;' +
      'width:18.2em;height:3.35em;border-radius:100px;overflow:hidden;' +
      'cursor:pointer;user-select:none;touch-action:pan-y;' +
      'box-shadow:inset -1px -1px 2px 0 rgba(46,46,46,.22);' +
      'font-size:' + fs + 'px;';      // ⚠️ 背景不再用 CSS transition，改由 p 連續驅動

    function mkLabel(id, side) {
      var e = document.createElement('span');
      e.id = id;
      e.style.cssText = 'position:absolute;top:50%;transform:translateY(-50%);text-align:center;' +
        'font-family:Inter,-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;' +
        'font-size:1em;font-weight:400;line-height:1.5;letter-spacing:-.01em;white-space:nowrap;' +
        'pointer-events:none;' +
        (side === 'right' ? 'left:3.8em;right:1em;' : 'left:1em;right:3.8em;');
      return e;
    }
    var lw = mkLabel('mh4-lbl-w', 'right');   // WORK：杯子在左，字靠右
    var lf = mkLabel('mh4-lbl-f', 'left');    // FUN ：杯子在右，字靠左

    var knob = document.createElement('span');
    knob.id = 'mh4-knob';
    knob.style.cssText = 'position:absolute;left:0;top:0;width:3.3em;height:3.35em;' +
      'pointer-events:none;will-change:transform;';
    [['mh4-cup-w', CUP.WORK], ['mh4-cup-f', CUP.FUN]].forEach(function (c) {
      var e = document.createElement('span');
      e.id = c[0];
      e.style.cssText = 'position:absolute;inset:0;background-repeat:no-repeat;' +
        'background-position:center;background-size:contain;background-image:url("' + c[1] + '");';
      knob.appendChild(e);
    });

    sw.appendChild(lw); sw.appendChild(lf); sw.appendChild(knob);

    sw.addEventListener('pointerdown', function (e) {
      drag.on = true; drag.moved = false; drag.x0 = e.clientX;
      drag.base = mode.p == null ? SKIN[mode.m].at : mode.p;
      flushSwitchTween();
      try { sw.setPointerCapture(e.pointerId); } catch (err) {}
    });
    sw.addEventListener('pointermove', function (e) {
      if (!drag.on) return;
      var dx = e.clientX - drag.x0;
      if (Math.abs(dx) > 5) drag.moved = true;
      var mx = maxX() || 1;
      var p = clamp01(drag.base + dx / mx);
      paintSwitchAt(p);
      // 拖過中點就即時換模式，變數字與 Playlist 明暗會跟著一起走
      var m = p >= 0.5 ? 'FUN' : 'WORK';
      if (m !== mode.m) enterMode(m, false);
    });
    function endDrag() {
      if (!drag.on) return;
      drag.on = false;
      // 沒拖動＝當成點一下切換；有拖動＝過半留在該側，沒過半滑回去
      var to = drag.moved ? (mode.p >= 0.5 ? 1 : 0)
                          : (mode.m === 'WORK' ? 1 : 0);
      glideSwitch(to);
    }
    sw.addEventListener('pointerup', endDrag);
    sw.addEventListener('pointercancel', endDrag);
    sw.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') {
        e.preventDefault();
        glideSwitch(mode.m === 'WORK' ? 1 : 0);
      }
    });
    return sw;
  }

  // 拖曳開始時要把還在跑的滑動補間收掉，否則兩者會互相打架
  function flushSwitchTween() {
    for (var i = TW.length - 1; i >= 0; i--) if (TW[i].sw) TW.splice(i, 1);
  }

  function paintSwitch() {
    var sw = byId('mh4-sw');
    if (!sw) return;
    var cfg = CFG.modes[mode.m];
    sw.setAttribute('aria-checked', mode.m === 'FUN' ? 'true' : 'false');
    sw.setAttribute('aria-label', cfg.label);
    var lw = byId('mh4-lbl-w'), lf = byId('mh4-lbl-f');
    if (lw && lw.textContent !== CFG.modes.WORK.label) lw.textContent = CFG.modes.WORK.label;
    if (lf && lf.textContent !== CFG.modes.FUN.label) lf.textContent = CFG.modes.FUN.label;
    fitSwitchWidth();
    // 拖曳中或補間中不要搶位置，否則會把手指的位置蓋掉
    if (!drag.on && !TW.some(function (o) { return o.sw; })) paintSwitchAt(SKIN[mode.m].at);
  }

  // 藥丸寬度依「較長的那句文字」自動撐開（中文比英文短很多，寫死 18.2em 會空一大塊）
  function fitSwitchWidth() {
    var sw = byId('mh4-sw'), lw = byId('mh4-lbl-w'), lf = byId('mh4-lbl-f');
    if (!sw || !lw || !lf) return;
    var f = parseFloat(getComputedStyle(sw).fontSize) || 16;
    // ⚠️ label 是 left/right 定位的，scrollWidth 量到的是「被藥丸撐開的盒子」而不是
    //    文字本身 → 藥丸永遠縮不回來。用一個離畫面的量測 span 取實際文字寬度。
    var ruler = byId('mh4-ruler');
    if (!ruler) {
      ruler = document.createElement('span');
      ruler.id = 'mh4-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      ruler.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;visibility:hidden;';
      document.body.appendChild(ruler);
    }
    var cs = getComputedStyle(lw);
    ruler.style.font = cs.font;
    ruler.style.letterSpacing = cs.letterSpacing;
    ruler.textContent = lw.textContent;
    var w1 = ruler.getBoundingClientRect().width;
    ruler.textContent = lf.textContent;
    var w2 = ruler.getBoundingClientRect().width;
    var wide = Math.max(w1, w2) / f;
    if (!wide) return;
    var em = Math.max(10, wide + 3.3 + 1.9);      // 杯子 3.3em ＋ 左右留白
    sw.style.width = em.toFixed(2) + 'em';
  }

  function syncTheme() {
    var w = byId('mh4-widget');
    if (!w) return;
    w.classList.toggle('dark', CFG.modes[mode.m].theme === 'dark');
    // canvas 的凹槽底色是 JS 讀 token 畫的，換膚要主動叫它重畫
    if (typeof readTheme === 'function') { readTheme(); draw(); }
  }

  // 兩格輪流播、不停：以前的我 → 現在的我 → 以前的我 →⋯
  // 計時一律從「字滾進來那一刻」起算，每一格才真的被讀滿 HOLD
  function rotate() {
    phase = 1 - phase;
    var cfg = CFG.modes[mode.m];
    roll(byId('mh4-slot'), byId('mh4-word'),
         wordHTML(phase ? cfg.word : cfg.intro, cursiveFF()),
         function () { phaseTimer = setTimeout(rotate, HOLD); });
  }

  function enterMode(m, initial) {
    clearTimeout(phaseTimer);
    mode.m = m;
    lockSlotWidth();                     // 兩句都量過，槽位取較寬者
    phase = 0;                           // 換模式一律從「以前的我」重新演一次
    paintSwitch();
    syncTheme();
    var cfg = CFG.modes[m], ff = cursiveFF();
    var s = byId('mh4-slot'), w = byId('mh4-word');
    var rs = byId('mh4-roleslot'), rw = byId('mh4-role');
    // 使用者開了「減少動態」：翻到「現在的我」就停，不做無止盡的輪播
    var once = reduced();
    function start() {
      phaseTimer = setTimeout(once ? function () {
        phase = 1;
        roll(byId('mh4-slot'), byId('mh4-word'), wordHTML(CFG.modes[mode.m].word, cursiveFF()));
      } : rotate, HOLD);
    }
    if (initial) {
      if (w) { w.innerHTML = wordHTML(cfg.intro, ff); fit(s, w, false); }
      if (rw) { rw.innerHTML = wordHTML(cfg.role, ff); fit(rs, rw, false); }
      start();
    } else {
      roll(s, w, wordHTML(cfg.intro, ff), start);
      roll(rs, rw, wordHTML(cfg.role, ff));
    }
  }

  // ── 描述：HTML 已改成版本 C，這裡只負責 SPA 重繪後補回來 ──
  function setDesc() {
    var d = document.querySelector('[data-mh4-desc]');
    if (!d) {
      var ps = document.querySelectorAll('p');
      for (var i = 0; i < ps.length; i++) {
        var t = (ps[i].textContent || '').trim();
        if (t.indexOf(CFG.descHead) === 0) { d = ps[i]; d.setAttribute('data-mh4-desc', '1'); break; }
        if (t.indexOf('嗨，我是 Molly，現居台北') === 0 || t.indexOf('Molly, based in Taipei') > 0) {
          d = ps[i]; d.setAttribute('data-mh4-desc', '1');
          d.textContent = window.__MH4_DESC || t;
          break;
        }
      }
    }
    return d;
  }

  function apply() {
    if (!onHome()) return;
    setDesc();
    // ⚠️ 標題只建一次，但「插入播放器」必須每次心跳都能重試：
    //    照片節點常常比標題晚就緒，早期版本在這裡直接 return，
    //    只要那一次沒抓到照片，widget 就永遠不會被補上（實測會整個消失）。
    if (!byId('mh4-line2')) buildTitle();
    buildWidget();
    syncSize();
    // widget 改成絕對定位後，位置只在 resize 時重算會卡住（程式化縮放、SPA 重繪、
    // 字體載入後的位移都收不到 resize）。心跳每 700ms 重新釘一次，成本只有幾個
    // getBoundingClientRect，而且值沒變就不會觸發重繪。
    placeWidget();
  }

  function buildTitle() {
    var cursive = q('h2', 'olly Shih');
    var bold = null, based = null;
    var hs = document.querySelectorAll('h2');
    for (var i = 0; i < hs.length; i++) {
      var t = (hs[i].textContent || '').trim();
      if (t === '我是一名產品設計師' || t === 'Product designer') bold = hs[i];
      if (t === 'based in 台北' || t === 'based in Taipei') based = hs[i];
    }
    if (!cursive || !bold || !based) return;   // 還沒就緒，留給心跳

    var ff = getComputedStyle(cursive).fontFamily;
    var boldCls = bold.className;
    var bcs = getComputedStyle(bold);
    // Figma runtime 的 css-* class 是逐節點生成的，掛到新節點吃不到字型，
    // 只能把 computed 抄成 inline（breakpoint 變動時由 resize handler 重抄）
    function fontCopy(el) {
      el.style.fontFamily = bcs.fontFamily;
      el.style.fontSize = bcs.fontSize;
      el.style.fontWeight = bcs.fontWeight;
      el.style.lineHeight = bcs.lineHeight;
      el.style.letterSpacing = bcs.letterSpacing;
      el.style.color = bcs.color;
      el.style.margin = '0';
    }

    // ── L1：在手寫 M 前面補「嗨，我是 」──
    var line1 = cursive.parentElement.parentElement;
    if (!line1.querySelector('[data-mh4-hi]')) {
      var hi = document.createElement('h2');
      hi.className = boldCls;
      fontCopy(hi);
      hi.setAttribute('data-mh4-hi', '1');
      hi.setAttribute('data-mh4-bfs', parseFloat(bcs.fontSize) || 0);
      hi.setAttribute('data-mh4-blh', parseFloat(bcs.lineHeight) || 0);
      hi.textContent = CFG.hi;
      hi.style.whiteSpace = 'pre';
      line1.insertBefore(hi, line1.firstChild);
      line1.style.display = 'flex';
      line1.style.alignItems = 'baseline';
      line1.style.flexWrap = 'wrap';
    }

    // ── L2：一個 [Switch]（整行插在 bold 那行之前，取代 based-in）──
    var boldWrap = bold.closest('.textContents') || bold.parentElement;
    var l2 = document.createElement('div');
    l2.id = 'mh4-line2';
    l2.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:.5em;width:100%;align-self:stretch;';
    var aEl = document.createElement('h2');
    aEl.className = boldCls;
    fontCopy(aEl);
    aEl.textContent = CFG.a.trim();
    aEl.setAttribute('data-mh4-a', '1');
    aEl.setAttribute('data-mh4-bfs', parseFloat(bcs.fontSize) || 0);
    aEl.setAttribute('data-mh4-blh', parseFloat(bcs.lineHeight) || 0);
    l2.appendChild(aEl);
    l2.appendChild(buildSwitch(20));   // 真正尺寸由 sizeSwitch() 依 L3 定
    boldWrap.parentElement.insertBefore(l2, boldWrap);

    // ── L3：｛ 變數 ｝的 身分 ──
    bold.textContent = '';
    bold.setAttribute('data-mh4-line3', '1');
    // justify-content:center —— 槽位鎖成「兩句較寬者」之後，較短的那句若靠左
    // 會在右邊留一段空白（例：只停留在 Figma）。置中才看不出槽位比字寬。
    var slotCSS = 'display:inline-flex;justify-content:center;overflow:hidden;' +
                  'vertical-align:bottom;position:relative;' +
                  'transition:width .3s ' + EASE + ';white-space:nowrap;';
    var braceCSS = 'font-family:' + ff + ';font-weight:400;white-space:pre;';
    function mkSlot(sid, wid) {
      var s = document.createElement('span'); s.id = sid; s.style.cssText = slotCSS;
      var w = document.createElement('span'); w.id = wid;
      w.style.cssText = 'display:block;white-space:nowrap;';
      s.appendChild(w);
      return s;
    }
    var bl = document.createElement('span'); bl.textContent = '{ '; bl.style.cssText = braceCSS;
    var br = document.createElement('span'); br.textContent = ' }'; br.style.cssText = braceCSS;
    bold.appendChild(bl);
    bold.appendChild(mkSlot('mh4-slot', 'mh4-word'));
    bold.appendChild(br);
    bold.appendChild(mkSlot('mh4-roleslot', 'mh4-role'));

    var basedWrap = based.closest('.textContents') || based;
    basedWrap.style.display = 'none';

    scaleTitle();
    sizeSwitch();
    spaceTitle();
    enterMode(mode.m, true);
  }

  // ── 只做桌機（Molly 08-15 指定）：手機／平板是另一組 DOM 節點 ──
  // ── 原生播放器（不用 iframe）──
  // ⚠️ 這一塊原本是嵌 my-secret-playlist 的 iframe，但 Safari 在 iframe 裡會把
  //    卡片的圓角光柵化錯掉（切出一個巨大圓弧），而且 hover 觸發合成時會鋪一層
  //    白底。換過縮放方式、拿掉全部 transform、把尺寸參數化都沒能解決，共同點
  //    就是 iframe 本身，所以改成直接畫在頁面上。尺寸直接以 360 卡片為基準撰寫。
  var TRACKS = [
    { id: 1721843001, artist: 'Nujabes',     title: 'Aruarian Dance',    dur: 250 },
    { id: 6787937401, artist: 'Kupla',       title: 'Owls of the Night', dur: 142 },
    { id: 1513594559, artist: 'L’indécis', title: 'Staying There', dur: 211 },
    { id: 1860643762, artist: 'Jinsang',     title: 'Affection',         dur: 117 },
    { id: 1892684533, artist: 'Idealism',    title: 'controlla',         dur: 108 },
    { id: 1860221675, artist: 'tomppabeats', title: 'Monday Loop',       dur:  92 }
  ];
  var PL = { i: 0, sound: false, audio: null, timer: null, swapping: false, fake: 0 };

  // ── 播放器（2026-08-15 整段重寫）────────────────────────────────────────
  // 沿革：iframe 版 → 原生 DOM 版（overflow:hidden＋border-radius）→ clip-path 版
  //       → 加 mask 版（更糟）→ 拿掉 mask 版。全都在 Safari 出現同一個症狀：
  //       429px 的 CD 畫到視窗外，變成一道大圓弧切過卡片。
  // 已排除：祖先鏈圓角/overflow、殘留疊層、重疊元素、舊照片 hover、四種裁切方式
  //       （並排測試頁在 Safari 全乾淨）。
  // 結論：只要 CD 是一個「靠外層元素裁切」的 DOM 節點，就會踩到瀏覽器的合成層規則。
  // 作法：CD 整個改用 <canvas> 畫。裁切、旋轉、飛入飛出、軸孔全在 canvas 內部完成，
  //       canvas 只是一張圖，沒有子節點可以溢出，也沒有任何外層裁切可以失效。
  //       其餘會圓角的元素（卡片、封面）一律自己帶 border-radius，不靠父層。
  var CARD_R = 65;                       // 卡片圓角
  var WIN_H  = 197;                      // CD 視窗高度（底部橢圓最低點）
  var WIN_Y  = 80;                       // 直邊轉橢圓的接點
  var DISC_R = 214.5;                    // CD 半徑（大於視窗，邊緣永遠不外露）
  var HOLE_R = 22;                       // 軸孔
  var HUB_R  = 36;                       // 標籤環
  // 換片編舞的位移，全部由原版 widget（420 卡片）換算：×360/420 = 0.857
  //   鬆脫 210→180、中繼 -80→-68.6、離場 -290→-248.6、落下中繼 -210→-180
  var EJECT  = 180, MID = -68.6, OUT = -248.6, IN18 = -180;
  // 碟片飛出視窗後不被裁切（原版是另一個 .disc.air 節點），所以畫布要比卡片大
  var AIR_X  = 40, AIR_T = 470, CV_W = 440, CV_H = 870;

  // 所有尺寸都乘 var(--k)（跟 Molly 原版 widget 的 --k 同概念）：
  //   桌機 1280 → 卡片 360、k=1｜平板 800 → 316、k=.878｜手機 375 → 235、k=.653
  var K1 = function (n) { return 'calc(' + n + 'px * var(--k))'; };
  var PLAYER_CSS =
  '#mh4-widget{--k:1;display:flex;flex-direction:column;align-items:center;' +
    'gap:' + K1(22) + ';width:' + K1(360) + ';flex:0 0 auto;}' +
  '#mh4-widget *{box-sizing:border-box;}' +
  '#mh4-widget .mp-card{position:relative;width:' + K1(360) + ';height:' + K1(360) + ';' +
    'border-radius:' + K1(65) + ';z-index:0;' +
    'background:linear-gradient(180deg,var(--mp-hi) 0%,var(--mp-lo) 100%);' +
    'box-shadow:0 26px 52px -16px rgba(0,0,0,.22),0 9px 20px -9px rgba(0,0,0,.10),' +
    'inset 0 1px 0 rgba(255,255,255,.65);' +
    'transition:background .5s ease,box-shadow .5s ease;cursor:pointer;}' +
  // 碟片飛出視窗後不被裁切，所以畫布比卡片大（見 CD.mode）
  '#mh4-widget .mp-cd{position:absolute;left:' + K1(-40) + ';top:' + K1(-470) + ';' +
    'width:' + K1(440) + ';height:' + K1(870) + ';pointer-events:none;z-index:1;}' +
  '#mh4-widget .mp-card.dim .mp-info{opacity:0;transform:translateY(8px);}' +
  // 原版 .cover 有 linear-gradient 打底，圖未載入時仍是實心
  '#mh4-widget .mp-cover{position:absolute;inset:0;border-radius:' + K1(65) + ';z-index:2;' +
    'background-color:#b4b4b3;background-image:linear-gradient(160deg,#c9c9c8 0%,#b4b4b3 100%);' +
    'background-size:cover;background-position:center;opacity:0;transform:scale(1.06);' +
    'pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;' +
    'padding:' + K1(38) + ' ' + K1(41) + ';' +
    'transition:opacity .22s ease .1s,transform .55s cubic-bezier(.32,.72,.28,1);}' +
  '#mh4-widget .mp-card.covered .mp-cover{opacity:1;transform:scale(1);' +
    'transition:opacity .16s ease,transform .55s cubic-bezier(.32,.72,.28,1);}' +
  '#mh4-widget .mp-ca{color:#fff;font-size:' + K1(21) + ';font-weight:800;letter-spacing:.06em;' +
    'text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,.45);line-height:1.15;}' +
  '#mh4-widget .mp-ct{color:rgba(255,255,255,.88);font-size:' + K1(12) + ';font-weight:600;' +
    'letter-spacing:.12em;text-transform:uppercase;margin-top:' + K1(6) + ';' +
    'text-shadow:0 2px 10px rgba(0,0,0,.4);}' +
  '#mh4-widget .mp-info{position:absolute;left:0;right:0;top:57%;z-index:3;display:flex;' +
    'flex-direction:column;align-items:center;gap:' + K1(5) + ';pointer-events:none;' +
    'transition:opacity .2s ease,transform .3s ease;}' +
  '#mh4-widget .mp-card.covered .mp-info{opacity:0;transform:translateY(8px);}' +
  '#mh4-widget .mp-wave{display:flex;align-items:center;gap:' + K1(3) + ';height:' + K1(15) + ';}' +
  '#mh4-widget .mp-wave i{width:' + K1(3) + ';border-radius:' + K1(2) + ';background:var(--mp-wave);' +
    'animation:mpb 1s ease-in-out infinite;}' +
  '#mh4-widget .mp-wave i:nth-child(1){height:' + K1(7)  + ';animation-delay:0s;}' +
  '#mh4-widget .mp-wave i:nth-child(2){height:' + K1(12) + ';animation-delay:.15s;}' +
  '#mh4-widget .mp-wave i:nth-child(3){height:' + K1(15) + ';animation-delay:.3s;}' +
  '#mh4-widget .mp-wave i:nth-child(4){height:' + K1(10) + ';animation-delay:.45s;}' +
  '#mh4-widget .mp-wave i:nth-child(5){height:' + K1(6)  + ';animation-delay:.6s;}' +
  '@keyframes mpb{0%,100%{transform:scaleY(.55);}50%{transform:scaleY(1);}}' +
  '#mh4-widget .mp-card:not(.playing) .mp-wave i{animation-play-state:paused;transform:scaleY(.4);}' +
  '#mh4-widget .mp-artist{font-size:' + K1(16) + ';font-weight:500;color:var(--mp-soft);}' +
  '#mh4-widget .mp-title{font-size:' + K1(20) + ';font-weight:700;color:var(--mp-ink);' +
    'margin-top:' + K1(-3) + ';text-align:center;padding:0 ' + K1(28) + ';}' +
  '#mh4-widget .mp-bar{width:' + K1(57) + ';height:' + K1(3) + ';border-radius:' + K1(2) + ';' +
    'background:var(--mp-bar);overflow:hidden;margin-top:' + K1(2) + ';}' +
  '#mh4-widget .mp-bar b{display:block;height:100%;width:0%;background:var(--mp-barfill);' +
    'border-radius:' + K1(2) + ';transition:width .25s linear;}' +
  '#mh4-widget .mp-time{font-size:' + K1(16) + ';font-weight:600;color:var(--mp-ink);' +
    'font-variant-numeric:tabular-nums;}' +
  '#mh4-widget .mp-time span{color:var(--mp-soft);font-weight:500;}' +
  '#mh4-widget .mp-ctrl{display:flex;align-items:center;gap:max(' + K1(15) + ',12px);}' +
  // ⚠️ 卡片內容跟著 --k 縮是對的（那是一台縮小的播放器），但卡片外的互動元素要有下限：
  //    手機 k=.653 時控制鈕只剩 29px、下載連結只剩 8.5px，都不能用。
  '#mh4-widget .mp-ctrl button{width:max(' + K1(45) + ',44px);height:max(' + K1(45) + ',44px);border-radius:50%;' +
    'border:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;' +
    'background:var(--mp-btn);color:var(--mp-ink);box-shadow:0 3px 9px rgba(0,0,0,.10);' +
    'transition:background .2s ease,transform .2s ease,color .3s ease;}' +
  '#mh4-widget .mp-ctrl button:hover{background:var(--mp-btnhi);transform:translateY(-1px);}' +
  '#mh4-widget .mp-ctrl svg{width:max(' + K1(17) + ',16px);height:max(' + K1(17) + ',16px);stroke:currentColor;' +
    'stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round;}' +
  '#mh4-widget .mp-ctrl button.play svg{fill:currentColor;stroke:none;}' +
  '#mh4-widget .mp-dl{margin-top:calc(' + K1(-8) + ' + 8px);font-size:max(' + K1(13) + ',12px);letter-spacing:.01em;' +
    'color:var(--mp-soft);text-decoration:none;border-bottom:1px solid transparent;' +
    'padding-bottom:1px;transition:color .2s ease,border-color .2s ease;}' +
  '#mh4-widget .mp-dl:hover{color:var(--mp-ink);border-bottom-color:var(--mp-ink);}' +
  '#mh4-widget{--mp-hi:#ececeb;--mp-lo:#d7d6d5;--mp-ink:#1c1c1e;--mp-soft:#a5a5a7;' +
    '--mp-bar:#c9c9c8;--mp-barfill:#1c1c1e;--mp-btn:#e6e6e5;--mp-btnhi:#dcdcdb;--mp-wave:#1c1c1e;}' +
  '#mh4-widget.dark{--mp-hi:#34343c;--mp-lo:#1d1d21;--mp-ink:#f1f0ec;--mp-soft:#8e8e93;' +
    '--mp-bar:#3a3a42;--mp-barfill:#f1f0ec;--mp-btn:#2f2f36;--mp-btnhi:#3a3a42;--mp-wave:#f1f0ec;}' +
  '#mh4-widget.dark .mp-card{box-shadow:0 26px 52px -16px rgba(0,0,0,.55),' +
    '0 9px 20px -9px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.10);}' +
  '@media (prefers-reduced-motion: reduce){#mh4-widget .mp-wave i{animation:none;}}';

  var ICON_PLAY  = '<svg viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/>' +
                   '<rect x="14" y="4" width="4" height="16" rx="1"/></svg>';

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ── CD 繪圖引擎 ──────────────────────────────────────────────────────────
  // 狀態全放在 CD 裡，每一幀依現值重畫。DOM 上沒有任何會動的子節點。
  var CD = { cv: null, ctx: null, img: null, url: '',
             angle: 0, spin: 0, dy: 0, tilt: 0, alpha: 1, hub: 1, scale: 1, mode: 'slot',
             hi: '#ececeb', lo: '#d7d6d5', raf: 0, last: 0, hover: false };
  var TW = [];

  // 要跟原版 widget 的 easing 完全一致，不能用近似 —— 直接解 cubic-bezier
  function bz(u, a, b) { var v = 1 - u; return 3 * v * v * u * a + 3 * v * u * u * b + u * u * u; }
  function dbz(u, a, b) { var v = 1 - u; return 3 * v * v * a + 6 * v * u * (b - a) + 3 * u * u * (1 - b); }
  function cb(x1, y1, x2, y2) {
    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      var u = t, i, e, d;
      for (i = 0; i < 8; i++) {
        e = bz(u, x1, x2) - t; d = dbz(u, x1, x2);
        if (Math.abs(e) < 1e-4 || !d) break;
        u -= e / d;
      }
      return bz(u, y1, y2);
    };
  }
  var E1 = cb(0.3, 0.6, 0.3, 1),      // 鬆脫
      E2 = cb(0.5, 0.05, 0.75, 0.4),  // 拿起
      E4 = cb(0.2, 0.7, 0.25, 1),     // 放下
      E5 = cb(0.25, 0.8, 0.3, 1),     // 吸入
      EH = cb(0.32, 0.72, 0.28, 1);   // hover
  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : +new Date();
  }
  function valAt(kf, p) {
    for (var i = 1; i < kf.length; i++) {
      if (p <= kf[i][0] || i === kf.length - 1) {
        var a = kf[i - 1], b = kf[i], span = b[0] - a[0];
        var q = span > 0 ? (p - a[0]) / span : 1;
        if (q < 0) q = 0;
        if (q > 1) q = 1;
        return a[1] + (b[1] - a[1]) * q;
      }
    }
    return kf[kf.length - 1][1];
  }

  // 一個補間＝一個純數值的 setter，全部由同一個 rAF 迴圈推進
  function twk(kf, dur, set, ease, done, wait) {
    var o = { kf: kf, d: dur, e: 0, w: wait || 0, ez: ease || EH, set: set, done: done };
    TW.push(o); kick(); return o;
  }
  function tw(from, to, dur, set, ease, done, wait) {
    return twk([[0, from], [1, to]], dur, set, ease, done, wait);
  }
  function flush() {                     // 分頁被切走時 rAF 不推進，直接收尾
    while (TW.length) { var o = TW.shift(); o.set(valAt(o.kf, 1)); if (o.done) o.done(); }
  }
  // ⚠️ frame() 開頭會把 CD.raf 歸零，而補間結束時的 done() 就在 frame() 裡面跑，
  //    它建立新補間 → kick() 看到 raf=0 → 又排一個 rAF，frame() 尾端再排一個，
  //    於是每過一拍就多一條並行迴圈，每幀把時間推進好幾次 → 動畫越後面越快。
  //    inFrame 旗標把「正在執行中」也算成已排程。
  function kick() {
    if (CD.raf || CD.inFrame) return;
    CD.last = 0;
    CD.raf = requestAnimationFrame(frame);
  }

  function frame(ts) {
    CD.raf = 0; CD.inFrame = 1;
    var dt = CD.last ? Math.min(64, ts - CD.last) : 16;
    CD.last = ts;
    for (var i = 0; i < TW.length; i++) {
      var o = TW[i];
      o.e += dt;
      if (o.e < o.w) continue;                     // 還在等延遲
      var p = (o.e - o.w) / o.d; if (p > 1) p = 1;
      o.set(valAt(o.kf, o.ez(p)));
      if (p >= 1) { TW.splice(i, 1); i--; if (o.done) o.done(); }
    }
    if (CD.spin) CD.angle += CD.spin * dt;
    draw();
    CD.inFrame = 0;
    if (TW.length || CD.spin) CD.raf = requestAnimationFrame(frame);
    else CD.last = 0;
  }

  function readTheme() {
    var w = byId('mh4-widget'); if (!w) return;
    var cs = getComputedStyle(w);
    var hi = (cs.getPropertyValue('--mp-hi') || '').trim();
    var lo = (cs.getPropertyValue('--mp-lo') || '').trim();
    if (hi) CD.hi = hi;
    if (lo) CD.lo = lo;
    CD.grad = null;                     // 換膚後漸層要重建
  }

  // CD 視窗形狀：上緣＝卡片圓角、兩側直邊、下緣＝半橢圓
  // 圓角與直邊天生相切，不會有接縫硬角
  function winPath(c) {
    c.beginPath();
    c.moveTo(CARD_R, 0);
    c.lineTo(360 - CARD_R, 0);
    c.arc(360 - CARD_R, CARD_R, CARD_R, -Math.PI / 2, 0);
    c.lineTo(360, WIN_Y);
    c.ellipse(180, WIN_Y, 180, WIN_H - WIN_Y, 0, 0, Math.PI);
    c.lineTo(0, CARD_R);
    c.arc(CARD_R, CARD_R, CARD_R, Math.PI, -Math.PI / 2);
    c.closePath();
  }

  function draw() {
    var cv = CD.cv; if (!cv) return;
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var k = CD.k || 1;
    var pw = Math.round(CV_W * k * dpr), ph = Math.round(CV_H * k * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var c = cv.getContext('2d'); if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 只清實際會畫到的範圍（含上一幀），比每幀清 440x870 省很多
    var rr = DISC_R * CD.scale + 4;
    var bx0 = Math.min(-26, 180 - rr) + AIR_X, bx1 = Math.max(386, 180 + rr) + AIR_X;
    var by0 = Math.min(-6, CD.dy - rr) + AIR_T, by1 = Math.max(WIN_H + 40, CD.dy + rr) + AIR_T;
    bx0 *= k; bx1 *= k; by0 *= k; by1 *= k;
    var pv = CD.prev;
    if (pv) { bx0 = Math.min(bx0, pv[0]); by0 = Math.min(by0, pv[1]);
              bx1 = Math.max(bx1, pv[2]); by1 = Math.max(by1, pv[3]); }
    c.clearRect(bx0, by0, bx1 - bx0, by1 - by0);
    // 只記「這一幀自己用到的範圍」，下一幀才知道要一起清掉
    CD.prev = [(Math.min(-26, 180 - rr) + AIR_X) * k, (Math.min(-6, CD.dy - rr) + AIR_T) * k,
               (Math.max(386, 180 + rr) + AIR_X) * k, (Math.max(WIN_H + 40, CD.dy + rr) + AIR_T) * k];
    // 之後全部用 360 基準的「卡片座標」畫，最後整張按 k 縮放
    c.translate(AIR_X * k, AIR_T * k);
    if (k !== 1) c.scale(k, k);

    // 漸層一幀建一次會很吃效能（標籤環 10 個色階、高光 7 個），快取起來。
    // canvas 漸層的座標是在「填色當下的 CTM」解釋的，所以快取後仍會跟著
    // translate/scale/rotate 走，不必每幀重建。
    if (!CD.grad) {
      var rgc = c.createLinearGradient(0, 0, 0, 360);
      rgc.addColorStop(0, CD.hi); rgc.addColorStop(1, CD.lo);
      var dgc = c.createLinearGradient(-DISC_R, -DISC_R, DISC_R, DISC_R);
      dgc.addColorStop(0, '#c9c9c8'); dgc.addColorStop(1, '#b4b4b3');
      var hgc = c.createRadialGradient(0, 0, 0, 0, 0, HUB_R);
      hgc.addColorStop(0,    'rgba(238,238,237,.30)');
      hgc.addColorStop(0.15, 'rgba(238,238,237,.30)');
      hgc.addColorStop(0.16, 'rgba(180,180,180,.60)');
      hgc.addColorStop(0.18, 'rgba(180,180,180,.60)');
      hgc.addColorStop(0.19, 'rgba(244,244,243,.55)');
      hgc.addColorStop(0.42, 'rgba(244,244,243,.55)');
      hgc.addColorStop(0.43, 'rgba(188,188,188,.60)');
      hgc.addColorStop(0.47, 'rgba(188,188,188,.60)');
      hgc.addColorStop(0.48, 'rgba(232,232,231,.45)');
      hgc.addColorStop(1,    'rgba(232,232,231,.45)');
      var hl = 53.1;
      var lgc = c.createRadialGradient(0, 0, 0, 0, 0, hl);
      lgc.addColorStop(0,     'rgba(255,255,255,0)');
      lgc.addColorStop(0.419, 'rgba(255,255,255,0)');
      lgc.addColorStop(0.435, 'rgba(255,255,255,.32)');
      lgc.addColorStop(0.710, 'rgba(255,255,255,.32)');
      lgc.addColorStop(0.726, 'rgba(255,255,255,.12)');
      lgc.addColorStop(0.935, 'rgba(255,255,255,.12)');
      lgc.addColorStop(0.968, 'rgba(255,255,255,0)');
      CD.grad = { recess: rgc, disc: dgc, hub: hgc, hl: lgc, hlR: hl };
    }

    // ① 視窗的投影：只有「碟片還在卡榫裡」才畫。
    //    ⚠️ 原版的陰影是 .discwin 的 filter:drop-shadow，它吃的是容器內容的 alpha
    //    —— 碟片被拿走後容器是空的，陰影就整個消失，卡片變成一塊乾淨的圓角方形。
    //    之前我不分狀態都把視窗形狀填上卡片漸層＋投影，碟片飛走後還是看得到一塊
    //    淺色面板，就變成「CD 好像還在機器裡」。
    if (CD.mode !== 'air') {
      c.save();
      c.shadowColor = 'rgba(0,0,0,.20)'; c.shadowBlur = 19; c.shadowOffsetY = 12;
      c.fillStyle = CD.grad.recess;
      winPath(c); c.fill();
      c.restore();
    }

    // ② CD 本體。在卡榫裡就被視窗裁切；被「拿起來」之後整片浮在卡片上不裁切
    //    （對齊原版 widget 用 .disc / .disc.air 兩個節點的做法）
    c.save();
    if (CD.mode !== 'air') { winPath(c); c.clip(); }

    c.save();
    c.globalAlpha = CD.alpha;
    c.translate(180, CD.dy);
    if (CD.scale !== 1) c.scale(CD.scale, CD.scale);
    c.rotate(CD.angle + CD.tilt);
    c.beginPath(); c.arc(0, 0, DISC_R, 0, Math.PI * 2); c.clip();
    if (CD.img) c.drawImage(CD.img, -DISC_R, -DISC_R, DISC_R * 2, DISC_R * 2);
    else { c.fillStyle = CD.grad.disc; c.fillRect(-DISC_R, -DISC_R, DISC_R * 2, DISC_R * 2); }
    // 內圈高光（原版 .disc::after）
    c.fillStyle = CD.grad.hl;
    c.beginPath(); c.arc(0, 0, CD.grad.hlR, 0, Math.PI * 2); c.fill();
    c.restore();

    // ③ 標籤環（hover 展開封面時淡出）
    if (CD.hub > 0.01 && CD.alpha > 0.01) {
      c.save();
      c.globalAlpha = CD.hub * CD.alpha;
      c.translate(180, CD.dy);
      if (CD.scale !== 1) c.scale(CD.scale, CD.scale);
      c.fillStyle = CD.grad.hub;
      c.beginPath(); c.arc(0, 0, HUB_R, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    // ④ 軸孔：直接把畫好的像素挖掉，露出卡片本身
    if (CD.alpha > 0.01) {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.globalAlpha = CD.alpha;
      c.fillStyle = '#000';
      c.beginPath(); c.arc(180, CD.dy, HOLE_R * CD.scale, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    c.restore();
  }

  function setImg(url) {
    if (CD.url === url) return;
    CD.url = url; CD.img = null;
    if (!url) { draw(); return; }
    var im = new Image();
    im.onload = function () { if (CD.url === url) { CD.img = im; draw(); } };
    im.onerror = function () { if (CD.url === url) draw(); };
    im.src = url;                        // 只畫不讀像素，不需要 crossOrigin
  }

  function spinRate() {
    if (reduced()) return 0;
    // hover 時封面是不透明的、整片蓋住碟片 —— 再轉也看不到，卻要每幀重畫整張
    // canvas。原版的自轉是 CSS animation 跑在合成層上所以無所謂，我這邊要自己省。
    if (CD.hover) return 0;
    var w = byId('mh4-widget'); if (!w) return 0;
    var playing = w.querySelector('.mp-card').classList.contains('playing');
    return playing ? Math.PI * 2 / 9000 : 0;     // 播放中 9 秒一圈
  }
  function syncSpin() { CD.spin = spinRate(); if (CD.spin) kick(); else draw(); }

  // hover：CD 往下滑讓位、標籤環淡出、封面展開
  function setHover(on) {
    var w = byId('mh4-widget'); if (!w) return;
    var card = w.querySelector('.mp-card');
    if (card.classList.contains('swapping')) return;
    if (CD.hover === on) return;
    // 原版：hover 停留超過 350ms 再離開，CD 會從正面重新開始轉（快速掃過不歸零）
    if (on) CD.hoverAt = nowMs();
    else if (nowMs() - (CD.hoverAt || 0) >= 350) CD.angle = 0;
    CD.hover = on;
    card.classList.toggle('covered', on);
    if (reduced()) { CD.dy = on ? EJECT : 0; CD.scale = on ? 1.02 : 1; CD.hub = on ? 0 : 1; draw(); syncSpin(); return; }
    tw(CD.dy, on ? EJECT : 0, 550, function (v) { CD.dy = v; }, EH);
    tw(CD.scale, on ? 1.02 : 1, 550, function (v) { CD.scale = v; }, EH);
    tw(CD.hub, on ? 0 : 1, 300, function (v) { CD.hub = v; }, EH);
    syncSpin();
  }

  function paintTrack() {
    var t = TRACKS[PL.i], w = byId('mh4-widget');
    if (!w) return;
    setImg(t.img || '');
    w.querySelector('.mp-cover').style.backgroundImage = t.img ? 'url("' + t.img + '")' : 'none';
    w.querySelector('.mp-artist').textContent = t.artist;
    w.querySelector('.mp-title').textContent = t.title;
    w.querySelector('.mp-ca').textContent = t.title;
    w.querySelector('.mp-ct').textContent = t.artist;
    paintTime();
  }
  function paintTime() {
    var w = byId('mh4-widget'); if (!w) return;
    var t = TRACKS[PL.i];
    var total = (PL.sound && PL.audio && isFinite(PL.audio.duration)) ? PL.audio.duration : t.dur;
    var cur = PL.sound && PL.audio ? PL.audio.currentTime : PL.fake;
    w.querySelector('.mp-cur').textContent = fmt(cur);
    w.querySelector('.mp-dur').textContent = fmt(total);
    w.querySelector('.mp-bar b').style.width = (total ? (cur / total * 100) : 0) + '%';
  }
  function setPlaying(on) {
    var w = byId('mh4-widget'); if (!w) return;
    w.querySelector('.mp-card').classList.toggle('playing', !!on);
    w.querySelector('.mp-toggle').innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    w.querySelector('.mp-toggle').setAttribute('aria-label', on ? '暫停' : '播放');
    syncSpin();
  }

  function audio() {
    if (!PL.audio) {
      PL.audio = new Audio();
      PL.audio.addEventListener('timeupdate', paintTime);
      PL.audio.addEventListener('loadedmetadata', paintTime);
      // 🔒 播完停在原地，不自動跳下一首（Molly 08-16 指定：換片一律由操作者自己按）
      PL.audio.addEventListener('ended', function () {
        PL.audio.currentTime = 0; PL.fake = 0; setPlaying(false); paintTime();
      });
    }
    return PL.audio;
  }
  // 播放一律要使用者自己點——不自動播放
  function play() {
    var t = TRACKS[PL.i];
    if (!t.preview) return;
    var a = audio();
    if (a.src !== t.preview) { a.src = t.preview; }
    a.play().then(function () { PL.sound = true; setPlaying(true); })
            .catch(function () { setPlaying(false); });
  }
  function pause() { if (PL.audio) PL.audio.pause(); setPlaying(false); }
  function toggle() {
    if (PL.audio && !PL.audio.paused) pause();
    else play();
  }

  // ── 換片編舞：完全對齊 Molly 原本 widget 的「直上直下」──────────────────
  //   鬆脫 → 拿起 → 空拍 → 放下 → 吸入
  //   位移／時間／easing 全部照抄原版（my-playlist/site/index.html 的 change()），
  //   位移值按 360/420 = 0.857 換算。⚠️ 原版沒有任何傾斜，是純粹的上下移動。
  function swap(step) {
    var w = byId('mh4-widget'); if (!w || PL.swapping) return;
    var card = w.querySelector('.mp-card');
    var wasPlaying = !!(PL.audio && !PL.audio.paused);
    PL.swapping = true;
    card.classList.add('swapping');
    card.classList.add('dim');          // 換片時資訊列淡出（原版 infoEl.opacity=0）
    card.classList.remove('covered');
    CD.hover = false;
    if (PL.audio) PL.audio.pause();

    var guard = null, infoBack = null;
    function finish() {
      clearTimeout(guard); clearTimeout(infoBack);
      card.classList.remove('swapping');
      card.classList.remove('dim');
      PL.swapping = false;
      CD.mode = 'slot'; CD.dy = 0; CD.scale = 1; CD.alpha = 1; CD.hub = 1; CD.tilt = 0;
      draw();
      if (wasPlaying) play(); else setPlaying(false);
      if (card.matches && card.matches(':hover')) setHover(true);
    }
    function land() {
      PL.i = (PL.i + step + TRACKS.length) % TRACKS.length;
      PL.fake = 0;
      paintTrack();
      CD.angle = 0;                     // 新片從正面開始轉（原版重置 spin 動畫）
    }
    if (reduced() || document.visibilityState === 'hidden') { land(); finish(); return; }

    CD.hub = 0;                         // 全程不畫標籤環（原版 hubEl.opacity=0）

    // ① 鬆脫：往下退出卡榫，同時縮到 .92
    tw(CD.dy, EJECT, 260, function (v) { CD.dy = v; }, E1);
    tw(CD.scale, 0.92, 260, function (v) { CD.scale = v; }, E1, function () {
      CD.mode = 'air';                 // 離開視窗，整片浮起來（原版切到 .disc.air）

      // ② 拿起：先慢後快往上帶走，最後 40% 才淡出
      twk([[0, EJECT], [0.6, MID], [1, OUT]], 310, function (v) { CD.dy = v; }, E2);
      twk([[0, 1], [0.6, 1], [1, 0]], 310, function (v) { CD.alpha = v; }, E2, function () {

        // ③ 空拍：手上換片的那 150ms，畫面上只有空卡榫
        setTimeout(function () {
          land();

          // ④ 放下：新片從畫面上方直直落到卡榫外緣，前 18% 淡入
          twk([[0, OUT], [0.18, IN18], [1, EJECT]], 310, function (v) { CD.dy = v; }, E4);
          twk([[0, 0], [0.18, 1], [1, 1]], 310, function (v) { CD.alpha = v; }, E4, function () {
            CD.mode = 'slot';           // 回到卡榫，重新受視窗裁切

            // ⑤ 吸入：滑回定位並回復原尺寸；資訊列提前 120ms 回來
            infoBack = setTimeout(function () { card.classList.remove('dim'); }, 120);
            tw(EJECT, 0, 300, function (v) { CD.dy = v; }, E5);
            tw(0.92, 1, 300, function (v) { CD.scale = v; }, E5, finish);
          });
        }, 150);
      });
    });

    // 保險：分頁被切走時 rAF 不推進，逾時直接收尾（總長約 1330ms）
    guard = setTimeout(function () { if (PL.swapping) { flush(); land(); finish(); } }, 2400);
  }

  function hydrate() {
    var ids = TRACKS.map(function (t) { return t.id; }).join(',');
    fetch('https://itunes.apple.com/lookup?id=' + ids + '&country=tw')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var by = {};
        (j.results || []).forEach(function (h) { by[h.trackId] = h; });
        TRACKS.forEach(function (t) {
          var h = by[t.id];
          if (!h) return;
          t.dur = Math.round(h.trackTimeMillis / 1000);
          t.img = (h.artworkUrl100 || '').split('100x100').join('600x600');
          t.preview = h.previewUrl || null;
        });
        paintTrack();
      })['catch'](function () {});
  }

  function buildPlayer() {
    if (!byId('mh4-player-css')) {
      var st = el('style'); st.id = 'mh4-player-css'; st.textContent = PLAYER_CSS;
      document.head.appendChild(st);
    }
    var box = el('div'); box.id = 'mh4-widget';
    var card = el('div', 'mp-card');

    var cv = el('canvas', 'mp-cd');
    cv.setAttribute('aria-hidden', 'true');
    CD.cv = cv;

    var cover = el('div', 'mp-cover');
    cover.appendChild(el('div', 'mp-ca'));
    cover.appendChild(el('div', 'mp-ct'));

    var info = el('div', 'mp-info');
    info.appendChild(el('div', 'mp-wave', '<i></i><i></i><i></i><i></i><i></i>'));
    info.appendChild(el('div', 'mp-artist'));
    info.appendChild(el('div', 'mp-title'));
    info.appendChild(el('div', 'mp-bar', '<b></b>'));
    info.appendChild(el('div', 'mp-time',
      '<span class="mp-cur">0:00</span> <span>/ <span class="mp-dur">0:00</span></span>'));

    card.appendChild(cv);
    card.appendChild(cover);
    card.appendChild(info);

    var ctrl = el('div', 'mp-ctrl');
    var prev = el('button', 'mp-prev', '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>');
    var tog  = el('button', 'mp-toggle play', ICON_PLAY);
    var next = el('button', 'mp-next', '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>');
    [prev, tog, next].forEach(function (b) { b.type = 'button'; ctrl.appendChild(b); });
    prev.setAttribute('aria-label', '上一首');
    next.setAttribute('aria-label', '下一首');
    tog.setAttribute('aria-label', '播放');

    box.appendChild(card);
    box.appendChild(ctrl);

    var dl = el('a', 'mp-dl',
      LANG === 'en' ? 'A CD widget to keep you company \u2197' : '一張陪你工作的 CD Widget \u2197');
    dl.href = 'https://my-secret-playlist.vercel.app/';
    dl.target = '_blank';
    dl.rel = 'noopener';
    dl.addEventListener('click', function (e) { e.stopPropagation(); });
    box.appendChild(dl);

    card.addEventListener('click', toggle);
    card.addEventListener('mouseenter', function () { setHover(true); });
    card.addEventListener('mouseleave', function () { setHover(false); });
    tog.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    prev.addEventListener('click', function (e) { e.stopPropagation(); swap(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); swap(1); });

    if (!CD.wired) {                     // SPA 重繪會再跑一次，listener 只掛一次
      CD.wired = 1;
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') { CD.last = 0; kick(); draw(); }
      });
    }
    return box;
  }

  function buildWidget() {
    var bold = document.querySelector('[data-mh4-line3]');
    if (!bold || byId('mh4-widget')) return;

    var heroRoot = bold;
    for (var i = 0; i < 8 && heroRoot; i++) {
      heroRoot = heroRoot.parentElement;
      if (heroRoot && /ABOUT ME/.test(heroRoot.textContent || '')) break;
    }
    if (!heroRoot) return;

    // hero 內的大圖＝原本的魚眼照：就地取代，不猜容器
    var photos = heroRoot.querySelectorAll('img'), target = null;
    for (var i = 0; i < photos.length; i++) {
      var r = photos[i].getBoundingClientRect();
      if (r.width > 200 && r.height > 200) { target = photos[i]; break; }
    }
    if (!target) return;

    // ⚠️ 絕對不要把 widget 插進魚眼照的容器裡。那個 463x493 的容器會對「子孫」
    //    做橢圓裁切（Safari 才套用，Chromium 查不到），實測從 Molly 的錄影量到：
    //    半徑約 250 CSS、圓心與容器中心只差 5px，整個 widget（含第三顆按鈕）被切掉。
    //    這是「改了六版 widget 內部都沒用」的真正原因——裁切在祖先，不在 widget。
    //    改掛到 breakpoint 容器（overflow 是矩形的 clip，安全），用絕對定位自己擺。
    var host = target.closest('[data-breakpoint]') || heroRoot;
    var box = buildPlayer();
    host.appendChild(box);
    box.style.position = 'absolute';
    target.style.display = 'none';
    paintTrack();
    hydrate();
    syncTheme();

    placeWidget();
    var dsc = setDesc();
    if (dsc) {
      var dw = dsc.closest('.textContents') || dsc;
      dw.style.maxWidth = '749px';   // 設計稿量到 749
      dw.setAttribute('data-mh4-descwrap', '1');
    }
    spaceTitle();
  }

  // breakpoint 換了就重設 --k、卡片寬與畫布；Figma Sites 換 breakpoint 會整棵 DOM 重掛，
  // widget 會被重建，但同一棵樹內縮放視窗也要能跟上
  function syncSize() {
    var w = byId('mh4-widget'); if (!w) return;
    var sz = sizeFor(), k = sz.card / 360;
    // ⚠️ --k 一定要每次都寫。SPA 重繪會把 widget 整個重建成新節點，若這裡因為
    //    「CD.k 沒變」提早 return，新節點就永遠拿不到 --k，卡片會停在 360。
    if (w.style.getPropertyValue('--k') !== String(k)) w.style.setProperty('--k', String(k));
    if (CD.k && Math.abs(CD.k - k) < 0.001 && CD.align === sz.align) return;
    CARD = sz.card;
    CD.k = k;
    CD.align = sz.align;
    CD.prev = null;                      // 畫布尺寸變了，上一幀的清除範圍作廢
    draw();
    placeWidget();
  }

  function pageMargin() {
    var d = document.querySelector('[data-mh4-descwrap]') || document.querySelector('[data-mh4-desc]');
    if (d) {
      var m = Math.round(d.getBoundingClientRect().left);
      if (m > 8 && m < 400) return m;
    }
    return 64;
  }

  function aboutMeBtn() {
    var all = document.querySelectorAll('div,a,button');
    for (var i = 0; i < all.length; i++) {
      if ((all[i].textContent || '').trim() !== 'ABOUT ME') continue;
      var r = all[i].getBoundingClientRect();
      // ⚠️ 尺寸範圍要涵蓋三個 breakpoint：1280 是 200x70、800 是 176x60、375 是 147x46。
      //    原本下限寫 150，手機版差 3px 就抓不到 → placeWidget() 提早 return，
      //    卡片沒有 left/top 就掉回靜態位置（跑到頁面最上面）。
      if (r.width > 100 && r.width < 340 && r.height > 30 && r.height < 120) return all[i];
    }
    return null;
  }

  // 播放器是就地取代照片的，位置得自己補。設計稿（1280）：
  //   ABOUT ME 64..264 / y 833..902、卡片 856..1215 / y 903..1262
  //   → 卡片右緣與頁面左邊距對稱，卡片上緣接在 ABOUT ME 的下緣
  function placeWidget() {
    var w = byId('mh4-widget');
    if (!w) return;
    var host = w.parentElement, am = aboutMeBtn();
    if (!host || !am) return;
    w.style.transform = '';
    var hr = host.getBoundingClientRect(), ar = am.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    // 桌機／平板：卡片右緣與頁面左邊距對稱｜手機：整張置中（設計稿 375 是置中的）
    var left = CD.align === 'center'
      ? (vw - CARD) / 2
      : vw - pageMargin() - CARD;
    w.style.left = Math.round(left - hr.left) + 'px';
    w.style.top  = Math.round(ar.bottom - hr.top) + 'px';
  }

  function refit() {
    scaleTitle();
    sizeSwitch();
    lockSlotWidth();                     // 字級變了要重量
    fit(byId('mh4-slot'), byId('mh4-word'), false);
    fit(byId('mh4-roleslot'), byId('mh4-role'), false);
    paintSwitch();
    spaceTitle();
    placeWidget();
  }

  function boot() {
    // 診斷用：?scroll=<y> 直接捲到指定位置（外部截圖驗證時用，不影響一般瀏覽）
    var qs = location.search, k = qs.indexOf('scroll=');
    if (k > -1) {
      var y = parseInt(qs.slice(k + 7), 10);
      if (y === y) setTimeout(function () { window.scrollTo(0, y); }, 500);
    }
    // 診斷用：?force=hover|spin|swap 強制進入該狀態（外部截圖用）
    if (qs.indexOf('force=hover') > -1) setTimeout(function () { setHover(true); }, 900);
    // 診斷用：?diag=1 把祖先鏈的裁切狀況寫進分頁標題，外部用 AppleScript 讀回
    // （Safari 預設不允許 Apple Events 執行 JS，標題是唯一的回讀管道）
    // 診斷用：?diag=1 持續輪詢祖先鏈（靜態快照會漏掉捲動動畫造成的瞬間裁切），
    // 把「曾經出現過」的裁切狀態寫進分頁標題，外部用 AppleScript 讀回
    if (qs.indexOf('diag=1') > -1) {
      var seen = {}, ticks = 0;
      var poll = setInterval(function () {
        ticks++;
        var ww = byId('mh4-widget'); if (!ww) return;
        var n = ww;
        for (var i = 0; i < 8 && n && n.tagName !== 'BODY'; i++) {
          var c = getComputedStyle(n), bits = [];
          if (c.webkitMaskImage && c.webkitMaskImage !== 'none') bits.push('MASK');
          if (c.maskImage && c.maskImage !== 'none') bits.push('mask');
          if (c.clipPath !== 'none') bits.push('CLIP=' + c.clipPath.slice(0, 30));
          if (c.overflow !== 'visible') bits.push('of=' + c.overflow);
          if (parseFloat(c.borderTopLeftRadius) > 0 || c.borderTopLeftRadius.indexOf('%') > -1)
            bits.push('r=' + c.borderRadius);
          if (bits.length) seen[i + '[' + bits.join(',') + ']'] = 1;
          n = n.parentElement;
        }
        // 來回捲動觸發 Figma 的捲動動畫
        if (ticks === 8)  window.scrollTo(0, 0);
        if (ticks === 20) window.scrollTo(0, 700);
        if (ticks === 32) window.scrollTo(0, 200);
        if (ticks === 44) window.scrollTo(0, 430);
        if (ticks >= 60) {
          clearInterval(poll);
          var ks = [];
          for (var k in seen) if (seen.hasOwnProperty(k)) ks.push(k);
          // 寫進畫面而不是 document.title —— runtime 會把標題蓋回去
          var box = document.getElementById('mh4-diag') || el('div');
          box.id = 'mh4-diag';
          box.setAttribute('style', 'position:fixed;left:0;top:0;right:0;z-index:999999;' +
            'background:#111;color:#0f0;font:600 20px/1.5 ui-monospace,monospace;' +
            'padding:14px 18px;white-space:pre-wrap;word-break:break-all;');
          var pw = byId('mh4-widget'), ptxt = '?';
          if (pw && pw.parentElement) {
            var pr = pw.parentElement.getBoundingClientRect();
            ptxt = Math.round(pr.width) + 'x' + Math.round(pr.height) +
                   ' (' + (pw.parentElement.className || 'no-class').toString().slice(0, 28) + ')';
            var d = 0, q = pw;
            while (q && q.tagName !== 'BODY') { d++; q = q.parentElement; }
            ptxt = 'depth=' + d + ' parent=' + ptxt;
          }
          box.textContent = 'DIAG(' + ticks + ') ' + ptxt + ' || ' + (ks.length ? ks.join('  ') : 'ALL-CLEAN');
          document.body.appendChild(box);
        }
      }, 100);
    }
    // 純測試用：?demo=swap 每 3.5 秒換一次片（間隔夠長，動畫能完整演完）。
    // ⚠️ 不要留在給人看的網址上，否則看起來就像「CD 會自動切換」。
    if (qs.indexOf('demo=swap') > -1) setTimeout(function () {
      swap(1); setInterval(function () { swap(1); }, 3500);
    }, 1200);
    if (qs.indexOf('force=spin') > -1) setTimeout(function () {
      var ww = byId('mh4-widget');
      if (ww) { ww.querySelector('.mp-card').classList.add('playing'); syncSpin(); }
    }, 900);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
      setTimeout(function () { apply(); refit(); }, 60);
    });
    // ⚠️ 第一次呼叫也要包起來：它一拋錯，下面的 MutationObserver 與 setInterval
    //    就都不會註冊，整個功能靜靜死掉，而且連錯誤都留不下來
    function beat() { try { apply(); } catch (e) { window.__mh4err = e; } }
    beat();
    new MutationObserver(beat).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(beat, 700);
    window.addEventListener('resize', refit);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
</script>`;

// 語法先自檢，壞掉的版本不要寫進 18 個檔
{
  const inner = SNIPPET.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
  new Function(inner);
}

const existing = new RegExp('<script id="' + MARKER + '">[\\s\\S]*?</' + 'script>\\n?');
const oldRes = OLD_MARKERS.map(m => new RegExp('<script id="' + m + '">[\\s\\S]*?</' + 'script>\\n?'));

let removedOld = 0, descSwaps = 0;
for (const { lang, path } of FILES) {
  let html = await readFile(path, 'utf8');
  for (const re of oldRes) if (re.test(html)) { html = html.replace(re, ''); removedOld++; }

  const d = DESC[lang];
  if (html.includes(d.from)) { descSwaps += html.split(d.from).length - 1; html = html.split(d.from).join(d.to); }

  // 讓 runtime 知道 SPA 重繪後該補哪一段文字
  const seed = `<script id="${MARKER}-desc">window.__MH4_DESC=${JSON.stringify(d.to)};</` + `script>`;
  const seedRe = new RegExp('<script id="' + MARKER + '-desc">[\\s\\S]*?</' + 'script>\\n?');
  html = seedRe.test(html) ? html.replace(seedRe, seed + '\n') : html.replace('</head>', seed + '\n</head>');

  html = existing.test(html) ? html.replace(existing, SNIPPET + '\n') : html.replace('</head>', SNIPPET + '\n</head>');
  await writeFile(path, html);
}
// page JSON 的描述也要換（characters 與 name 兩處；characterStyleOverrides 是空的，
// 純字串替換不會動到任何位移索引）
let jsonSwaps = 0;
for (const [lang, dir] of Object.entries(JSON_INDEX)) {
  const jp = new URL(`../dist/_json/${dir}/_index.json`, import.meta.url).pathname;
  let j = await readFile(jp, 'utf8');
  const d = DESC[lang];
  if (!j.includes(d.from)) continue;
  jsonSwaps += j.split(d.from).length - 1;
  j = j.split(d.from).join(d.to);
  JSON.parse(j);                       // 壞掉的 JSON 不要寫回去
  await writeFile(jp, j);
}
console.log(`hero v4 → ${FILES.length} pages · 舊 marker 移除 ${removedOld} 處 · 描述換版 HTML ${descSwaps} 處 / JSON ${jsonSwaps} 處`);
