#!/usr/bin/env python3
# 情境2「自定義 Skill」內容規範卡（design-prd-spec）
# 內容依 000_Agent/skills/design-prd-spec/{SKILL.md, references/prd-template.md}
# 與 github.com/shihmuen/public-skills 公開版逐條對照，不自行發揮。
#
# 版面（Molly 08-09 最終指定）：寬度與頁面其他內容同寬（滿版，不內縮 51px）、
# 固定高度、內容垂直排列並在卡片內捲動（推翻同日稍早「不可滑動」的三欄版）。
# 表頭與驗收底線固定不動，只有中間內容區捲動；捲軸常駐當作「還有內容」的訊號。
#
# 只改 zh 版供 Molly 確認；確認後再處理 en 與情境3。
# 用法：先 git checkout dist/zh/my-ai-workflow/index.html 還原，再跑這支。
import pathlib

P = pathlib.Path('/Users/shihmuen/Desktop/portfolio-site/dist/zh/my-ai-workflow/index.html')
s = P.read_text()

CSS = '''
  /* 自定義 Skill 內容規範卡（情境2／3）：滿版寬度、固定高度、內容垂直排列可捲動 */
  .aiwf-skillspec { width: 100%; }
  .ss-card {
    background: #FEF3F0; border: 1px solid rgba(0,0,0,.1); border-radius: 16px;
    overflow: hidden; height: 560px; display: flex; flex-direction: column;
    transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
  }
  .ss-card { cursor: zoom-in; }
  .ss-card:hover { transform: scale(1.1); box-shadow: 0 10px 24px rgba(153,110,94,.12); }
  .ss-card:focus-visible { outline: 2px solid rgba(153,110,94,.9); outline-offset: 3px; }

  /* Lightbox：點卡片放大檢視，內容不再受固定高度限制 */
  .ss-lb { position: fixed; inset: 0; z-index: 2147483000; display: none; }
  .ss-lb.open { display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
  .ss-lb-bd {
    position: absolute; inset: 0; background: rgba(65,51,46,.55);
    -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
    opacity: 0; transition: opacity .25s ease;
  }
  .ss-lb.shown .ss-lb-bd { opacity: 1; }
  .ss-lb-panel {
    position: relative; width: min(980px, 100%); max-height: 88vh; overflow-y: auto;
    background: #FEF3F0; border: 1px solid rgba(0,0,0,.1); border-radius: 16px;
    box-shadow: 0 24px 60px rgba(65,51,46,.28);
    opacity: 0; transform: scale(.96);
    transition: opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1);
  }
  .ss-lb.shown .ss-lb-panel { opacity: 1; transform: none; }
  .ss-lb-close {
    position: absolute; top: 12px; right: 12px; z-index: 3; width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center; padding: 0;
    border: none; border-radius: 100px; background: rgba(65,51,46,.08); cursor: pointer;
    color: rgba(0,0,0,.6); transition: background .2s ease;
  }
  .ss-lb-close:hover { background: rgba(65,51,46,.16); }
  /* 放大檢視裡：解除固定高度與內部捲動，改由 panel 整體捲動 */
  .ss-card.in-lb { height: auto; border: none; border-radius: 0; background: transparent; cursor: default; }
  .ss-card.in-lb:hover { transform: none; box-shadow: none; }
  .ss-card.in-lb .ss-scroll { display: block; }
  .ss-card.in-lb .ss-scroll::after { display: none; }
  .ss-card.in-lb .ss-body { overflow: visible; }
  .ss-card.in-lb .ss-head { padding-right: 60px; }
  .ss-card.in-lb .ss-trigger { margin-left: 0; }  /* panel 較窄會折行，靠右會看起來斷開 */

  .ss-head {
    flex: 0 0 auto; padding: 20px 28px 18px; border-bottom: 1px solid rgba(0,0,0,.08);
    display: flex; align-items: baseline; gap: 16px 20px; flex-wrap: wrap;
  }
  .ss-eyebrow { font-size: 14px; font-weight: 500; letter-spacing: .08em; color: rgba(0,0,0,.36); }
  .ss-id { display: flex; align-items: baseline; gap: 10px; }
  .ss-head .aiwf-skillpill { font-size: 18px; }  /* 卡內 pill（Molly 08-09 拍板 18px） */
  /* 情境2「自定義 Skill」列的 pill 也收到 18px（情境3 維持 22px 未動） */
  .aiwf-specs .row.skill.prd .aiwf-skillpill { font-size: 18px; }
  .ss-id .ss-name { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
  .ss-trigger { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; margin-left: auto; }
  .ss-k { flex: 0 0 auto; font-size: 14px; font-weight: 500; color: rgba(0,0,0,.36); line-height: 1.9; }
  .ss-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .ss-chips em {
    font-style: normal; font-size: 14px; font-weight: 500; color: rgba(0,0,0,.58);
    background: rgba(153,110,94,.13); border-radius: 100px; padding: 3px 10px; line-height: 1.4;
  }

  /* 內容區：唯一會捲動的地方。macOS 的捲軸是隱藏式的（量測 gutter=0），
     所以另外用底部漸層當「下面還有」的訊號，捲到底自動淡出 */
  .ss-scroll { position: relative; flex: 1 1 auto; min-height: 0; display: flex; }
  .ss-scroll::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 52px;
    pointer-events: none; opacity: 1; transition: opacity .25s ease;
    background: linear-gradient(to bottom, rgba(254,243,240,0) 0%, rgba(254,243,240,.92) 78%, #FEF3F0 100%);
  }
  .ss-scroll.at-end::after { opacity: 0; }
  .ss-body { flex: 1 1 auto; min-width: 0; overflow-y: auto; overscroll-behavior: contain; }
  /* 不能寫 scrollbar-width／scrollbar-color：一旦指定，Chrome 會忽略下面的
     ::-webkit-scrollbar 自訂樣式，落回 macOS 的隱藏式捲軸，等於沒有捲動訊號 */
  .ss-body::-webkit-scrollbar { width: 12px; }
  .ss-body::-webkit-scrollbar-track { background: rgba(153,110,94,.07); }
  .ss-body::-webkit-scrollbar-thumb {
    background: rgba(153,110,94,.34); border-radius: 100px; border: 3px solid #FEF3F0;
  }
  .ss-body::-webkit-scrollbar-thumb:hover { background: rgba(153,110,94,.55); }

  .ss-col { padding: 22px 28px 24px; }
  .ss-col + .ss-col { border-top: 1px solid rgba(0,0,0,.08); }
  .ss-col > * { max-width: 900px; }   /* 滿版下限制行長，維持可讀的字行寬度 */
  .ss-col h4 {
    font-size: 16px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em;
    margin-bottom: 14px; display: flex; align-items: baseline; gap: 8px;
  }
  .ss-col h4 i { font-style: normal; font-size: 13px; font-weight: 500; color: rgba(0,0,0,.36); }
  .ss-num {
    font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
    font-size: 13px; font-weight: 600; color: rgba(153,110,94,.95); line-height: 1.7;
  }

  .ss-steps { display: flex; flex-direction: column; gap: 11px; }
  .ss-steps li { display: grid; grid-template-columns: 26px 1fr; gap: 1px 8px; align-content: start; }
  .ss-steps b { font-size: 16px; font-weight: 600; color: var(--ink); line-height: 1.45; }
  .ss-steps p { grid-column: 2; font-size: 14px; font-weight: 500; line-height: 1.5; color: rgba(0,0,0,.55); }

  .ss-chapters { display: flex; flex-direction: column; gap: 7px; }
  .ss-chapters li { display: flex; gap: 8px; align-items: baseline; font-size: 15px; font-weight: 500; color: rgba(0,0,0,.72); line-height: 1.45; }
  .ss-chapters .req {
    flex: 0 0 auto; font-size: 11px; font-weight: 600; border-radius: 3px;
    padding: 2px 5px; line-height: 1.35; letter-spacing: .02em;
  }
  .ss-chapters .req.must { background: #41332E; color: #F4E3DD; }
  .ss-chapters .req.opt { background: rgba(153,110,94,.2); color: rgba(0,0,0,.5); }

  .ss-rules { display: flex; flex-direction: column; gap: 9px; }
  .ss-rules li { display: grid; grid-template-columns: 26px 1fr; gap: 8px; align-content: start; }
  .ss-rules p { font-size: 14px; font-weight: 500; line-height: 1.5; color: rgba(0,0,0,.55); }
  .ss-rules b { font-weight: 600; color: var(--ink); margin-right: 6px; }

  .ss-floor {
    flex: 0 0 auto; padding: 14px 28px 16px; border-top: 1px solid rgba(0,0,0,.08);
    background: rgba(153,110,94,.07); display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap;
  }
  .ss-floor p { flex: 1; min-width: 260px; font-size: 14px; font-weight: 500; line-height: 1.55; color: rgba(0,0,0,.55); }
'''

CSS_900 = '''    .ss-card { height: 520px; }
    .ss-trigger { margin-left: 0; }
'''

CSS_560 = '''    /* 手機：表頭與底線本身就吃掉不少高度，卡片拉高並壓縮兩端，
       才留得下可用的捲動視窗（440px 時只剩 70px，等於不能讀） */
    .ss-card { height: 640px; }
    .ss-head { padding: 16px 20px 14px; gap: 10px 12px; }
    .ss-eyebrow { font-size: 13px; }
    .ss-head .aiwf-skillpill, .ss-id .ss-name { font-size: 16px; }
    .ss-col { padding-left: 20px; padding-right: 20px; }
    .ss-floor { padding: 12px 20px 14px; }
    .ss-chips em { font-size: 13px; padding: 2px 8px; }
    .ss-floor p { font-size: 13px; line-height: 1.5; }
    /* 跑版修正：.row.skill 原本 align-items:center，單欄後變成水平置中，
       與其他靠左的 row 不一致（情境2／3 同樣受惠） */
    .aiwf-specs .row.skill { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px 10px; }
    .aiwf-specs .row.skill .k { flex: 0 0 100%; }
    .aiwf-more { margin-left: 0; }
'''

BLOCK = '''      <div class="aiwf-skillspec">
        <div class="ss-card" role="button" tabindex="0" aria-label="放大檢視 design-prd-spec 內容規範">
          <header class="ss-head">
            <p class="ss-eyebrow">SKILL 內容規範</p>
            <div class="ss-id">
              <span class="aiwf-skillpill">design-prd-spec</span>
              <span class="ss-name">設計規格文件生成</span>
            </div>
            <div class="ss-trigger">
              <span class="ss-k">觸發</span>
              <span class="ss-chips">
                <em>幫我寫設計規格</em><em>寫 PRD</em><em>產出設計 spec</em><em>開給工程師的文件</em>
              </span>
            </div>
          </header>

          <div class="ss-scroll">
          <div class="ss-body">
            <section class="ss-col">
              <h4>執行流程</h4>
              <ol class="ss-steps">
                <li><span class="ss-num">01</span><b>資料收集</b>
                  <p>先問四項必填：功能名稱、需求位置、需求類型、功能概述。選填 Figma 連結、任務單號、負責人、時程。</p></li>
                <li><span class="ss-num">02</span><b>拆解需求</b>
                  <p>有 Figma 就直接讀設計稿，按六個維度識別：頁面／區塊清單、元件規格、排序邏輯、互動行為、Edge Case、API 相關。</p></li>
                <li><span class="ss-num">03</span><b>產出草稿</b>
                  <p>依模板生成 Markdown 存進文件資料夾，同時在對話中完整輸出讓我先看過。</p></li>
                <li><span class="ss-num">04</span><b>確認後發佈</b>
                  <p>我點頭才送出，透過 MCP 建立或更新 Confluence／Notion 頁面。</p></li>
              </ol>
            </section>

            <section class="ss-col">
              <h4>文件模板 <i>v1.1．12 個區塊</i></h4>
              <ul class="ss-chapters">
                <li><span class="req must">必填</span>版本記錄</li>
                <li><span class="req must">必填</span>需求資訊</li>
                <li><span class="req opt">依需求</span>零　核心名詞說明</li>
                <li><span class="req must">必填</span>一　功能簡介與設計目標</li>
                <li><span class="req must">必填</span>二　資訊架構（IA）</li>
                <li><span class="req must">必填</span>三　頁面／功能區塊規格</li>
                <li><span class="req opt">依需求</span>四　排序／顯示邏輯</li>
                <li><span class="req opt">依需求</span>五　狀態機／多狀態規則</li>
                <li><span class="req opt">依需求</span>六　通知規格</li>
                <li><span class="req must">必填</span>七　Edge Case 彙整</li>
                <li><span class="req opt">依需求</span>八　Phase 規劃</li>
                <li><span class="req opt">依需求</span>九　API Contract</li>
              </ul>
            </section>

            <section class="ss-col">
              <h4>寫作規範 <i>寫得對，也要寫得能被開發直接用</i></h4>
              <ol class="ss-rules">
                <li><span class="ss-num">01</span><p><b>表格優先</b>元件規格、Edge Case、API 決策一律用表格，不寫成散文。</p></li>
                <li><span class="ss-num">02</span><p><b>欄位固定三欄</b>區塊名稱／內容與規格／備註，備註放的是規則說明，不是廢話。</p></li>
                <li><span class="ss-num">03</span><p><b>排序要寫 fallback 鏈</b>1 → 2 → 3 用縮排表示層級，含無資料時的邊界處理。</p></li>
                <li><span class="ss-num">04</span><p><b>Edge Case 獨立成表</b>情境／行為兩欄，不混進元件規格裡。</p></li>
                <li><span class="ss-num">05</span><p><b>用語要精準</b>隱藏寫 Hide；顯示量寫「預設 N 筆，click 再載入 N 筆」；搜尋要交代觸發方式、範圍與 match 邏輯。</p></li>
                <li><span class="ss-num">06</span><p><b>API 只記決策</b>寫產品層面確認的規格（分頁機制、資料來源、搜尋方式），技術實作留給 backend 收斂。</p></li>
                <li><span class="ss-num">07</span><p><b>語言</b>繁體中文為主，技術名詞保留英文（Tab、CTA、Banner、API、endpoint）。</p></li>
              </ol>
            </section>
          </div>
          </div>

          <footer class="ss-floor">
            <span class="ss-k">驗收底線</span>
            <p>有 Figma 一定先讀設計稿，不憑空假設　・　Edge Case 至少涵蓋空資料、搜尋無結果、錯誤狀態　・　有排序邏輯就要列出完整 fallback 鏈</p>
          </footer>
        </div>
      </div>
      <script>
        (function () {
          var host = document.currentScript.previousElementSibling;
          var card = host.querySelector('.ss-card');
          var wrap = host.querySelector('.ss-scroll');
          if (!card || !wrap) return;
          var body = wrap.querySelector('.ss-body');

          // 底部漸層：捲到底就淡出
          function sync() {
            var atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
            wrap.classList.toggle('at-end', atEnd || body.scrollHeight <= body.clientHeight + 4);
          }
          body.addEventListener('scroll', sync, { passive: true });
          window.addEventListener('resize', sync);
          sync();
          setTimeout(sync, 600);   // 字型載入後行高會變，重算一次

          // Lightbox：點卡片放大檢視
          var lb = null, lastFocus = null;
          function build() {
            lb = document.createElement('div');
            lb.className = 'ss-lb';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', 'design-prd-spec 內容規範');
            var bd = document.createElement('div');
            bd.className = 'ss-lb-bd';
            var panel = document.createElement('div');
            panel.className = 'ss-lb-panel';
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'ss-lb-close';
            close.setAttribute('aria-label', '關閉');
            close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
            var clone = card.cloneNode(true);
            clone.classList.add('in-lb');
            clone.removeAttribute('role');
            clone.removeAttribute('tabindex');
            clone.removeAttribute('aria-label');
            panel.appendChild(close);
            panel.appendChild(clone);
            lb.appendChild(bd);
            lb.appendChild(panel);
            document.body.appendChild(lb);
            bd.addEventListener('click', hide);
            close.addEventListener('click', hide);
          }
          function show() {
            if (!lb) build();
            lastFocus = document.activeElement;
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function () { lb.classList.add('shown'); });
            lb.querySelector('.ss-lb-close').focus();
          }
          function hide() {
            if (!lb) return;
            lb.classList.remove('shown');
            document.body.style.overflow = '';
            setTimeout(function () { lb.classList.remove('open'); }, 250);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
          }
          card.addEventListener('click', show);
          card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
          });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lb && lb.classList.contains('open')) hide();
          });
        })();
      </script>'''

# 1. 插入 CSS（接在 .aiwf-figure .ph 規則之後）
anchor = """    aspect-ratio: 824 / 424; background: #DCCCC7; border-radius: 8px;
  }
"""
assert s.count(anchor) == 1, f'anchor count {s.count(anchor)}'
s = s.replace(anchor, anchor + CSS)

# 2. 響應式
a900 = "    .aiwf-figure .ph { left: 24px; right: 24px; }\n"
assert s.count(a900) == 1
s = s.replace(a900, a900 + CSS_900)

a560 = "    .aiwf-specs .v { font-size: 18px; }\n"
assert s.count(a560) == 1
s = s.replace(a560, a560 + CSS_560)

# 3. 用規範卡取代情境2 的灰色 placeholder
ph2 = '      <div class="aiwf-figure"><div class="ph" data-slot="design-docs-demo"><!-- 素材待補：Design Docs Demo --></div></div>'
assert s.count(ph2) == 1
s = s.replace(ph2, BLOCK)

# 4. 進場動畫納入
sel = "'.sc-head', '.aiwf-figure', '.aiwf-specs .row', '.aiwf-prompts .bubble',"
assert s.count(sel) == 1
s = s.replace(sel, "'.sc-head', '.aiwf-figure', '.aiwf-skillspec', '.aiwf-specs .row', '.aiwf-prompts .bubble',")

P.write_text(s)
print('zh/my-ai-workflow: skill spec block inserted (full-width, 3-col)')

# 5. 情境2「自定義 Skill」列加 .prd（pill 18px）＋ 卡片 hover 納入 reduced-motion 停用
old_row = '''        <div class="row skill">
          <span class="k">自定義 Skill</span><span class="bar"></span>
          <span class="aiwf-skillpill">design-prd-spec</span>'''
s2 = P.read_text()
assert s2.count(old_row) == 1
s2 = s2.replace(old_row, old_row.replace('class="row skill"', 'class="row skill prd"'))
old_rm = "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover { transform: none; }"
assert s2.count(old_rm) == 1
s2 = s2.replace(old_rm, "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover, .ss-card:hover { transform: none; }\n    .ss-lb-panel { transition: none; }")
P.write_text(s2)
print('row class + reduced-motion applied')
