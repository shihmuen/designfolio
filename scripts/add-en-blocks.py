#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 英文版 /en/my-ai-workflow 補齊（Molly 08-12 拍板：兩張規範卡翻成英文）
#   ① 情境1 POC 影片（與 zh 同一支素材，中文介面＝工作現場證據，不需翻譯）
#   ② 情境2／3 規範卡英文版（skill 名稱保留原樣＝識別碼；觸發詞跟已翻譯的
#      prompt 泡泡同邏輯，一起翻成英文）
#   ③ 情境1 Background／Purpose 同步 zh 最新文案
#   ④ 兩個 skill 列的 GitHub 連結旁加「Repo in Traditional Chinese」提示，
#      先告知讀者 repo 是中文，而不是為了對齊而讓整張卡讀不懂
#
# ⚠️ CSS 與 Lightbox JS 與 add-skillspec-block.py／add-poc-media.py 相同，
#    改樣式或互動時三支都要一起改。
# 用法：先 git checkout <baseline> -- dist/en/my-ai-workflow/index.html 再跑。
import pathlib

P = pathlib.Path('/Users/shihmuen/Desktop/portfolio-site/dist/en/my-ai-workflow/index.html')
s = P.read_text()

CSS = '''
  /* 自定義 Skill 內容規範卡：滿版寬度、固定高度、內容垂直排列可捲動 */
  .aiwf-skillspec { width: 100%; }
  .ss-card {
    background: #FEF3F0; border: 1px solid rgba(0,0,0,.1); border-radius: 16px;
    overflow: hidden; height: 560px; display: flex; flex-direction: column;
    transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
  }
  .ss-card { cursor: zoom-in; }
  .ss-card:hover { transform: scale(1.05); box-shadow: 0 10px 24px rgba(153,110,94,.12); }
  .ss-card:focus-visible { outline: 2px solid rgba(153,110,94,.9); outline-offset: 3px; }

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
  .ss-card.in-lb { height: auto; border: none; border-radius: 0; background: transparent; cursor: default; }
  .ss-card.in-lb:hover { transform: none; box-shadow: none; }
  .ss-card.in-lb .ss-scroll { display: block; }
  .ss-card.in-lb .ss-scroll::after { display: none; }
  .ss-card.in-lb .ss-body { overflow: visible; }
  .ss-card.in-lb .ss-head { padding-right: 60px; }
  .ss-card.in-lb .ss-trigger { margin-left: 0; }

  .ss-head {
    flex: 0 0 auto; padding: 20px 28px 18px; border-bottom: 1px solid rgba(0,0,0,.08);
    display: flex; align-items: baseline; gap: 16px 20px; flex-wrap: wrap;
  }
  .ss-eyebrow { font-size: 14px; font-weight: 500; letter-spacing: .08em; color: rgba(0,0,0,.36); }
  .ss-id { display: flex; align-items: baseline; gap: 10px; }
  .ss-head .aiwf-skillpill { font-size: 18px; }
  .aiwf-specs .row.skill .aiwf-skillpill { font-size: 18px; }
  .ss-id .ss-name { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -0.01em; }
  .ss-trigger { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; margin-left: auto; }
  .ss-k { flex: 0 0 auto; font-size: 14px; font-weight: 500; color: rgba(0,0,0,.36); line-height: 1.9; }
  .ss-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .ss-chips em {
    font-style: normal; font-size: 14px; font-weight: 500; color: rgba(0,0,0,.58);
    background: rgba(153,110,94,.13); border-radius: 100px; padding: 3px 10px; line-height: 1.4;
  }
  /* repo 語言提示 */
  .ss-note { font-size: 13px; font-weight: 500; color: rgba(0,0,0,.36); margin-left: 10px; }

  .ss-scroll { position: relative; flex: 1 1 auto; min-height: 0; display: flex; }
  .ss-scroll::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 52px;
    pointer-events: none; opacity: 1; transition: opacity .25s ease;
    background: linear-gradient(to bottom, rgba(254,243,240,0) 0%, rgba(254,243,240,.92) 78%, #FEF3F0 100%);
  }
  .ss-scroll.at-end::after { opacity: 0; }
  .ss-body { flex: 1 1 auto; min-width: 0; overflow-y: auto; overscroll-behavior: contain; }
  .ss-body::-webkit-scrollbar { width: 12px; }
  .ss-body::-webkit-scrollbar-track { background: rgba(153,110,94,.07); }
  .ss-body::-webkit-scrollbar-thumb {
    background: rgba(153,110,94,.34); border-radius: 100px; border: 3px solid #FEF3F0;
  }
  .ss-body::-webkit-scrollbar-thumb:hover { background: rgba(153,110,94,.55); }

  .ss-col { padding: 22px 28px 24px; }
  .ss-col + .ss-col { border-top: 1px solid rgba(0,0,0,.08); }
  .ss-col > * { max-width: 900px; }
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

  .ss-checks { display: flex; flex-direction: column; gap: 9px; }
  .ss-checks li { display: grid; grid-template-columns: 22px 1fr; gap: 8px; align-content: start; }
  .ss-checks .mk {
    font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace;
    font-size: 11px; font-weight: 600; text-align: center; line-height: 1.9;
    background: #41332E; color: #F4E3DD; border-radius: 3px;
  }
  .ss-checks p { font-size: 14px; font-weight: 500; line-height: 1.5; color: rgba(0,0,0,.55); }
  .ss-checks b { font-weight: 600; color: var(--ink); margin-right: 6px; }

  .ss-rules { display: flex; flex-direction: column; gap: 9px; }
  .ss-rules li { display: grid; grid-template-columns: 26px 1fr; gap: 8px; align-content: start; }
  .ss-rules p { font-size: 14px; font-weight: 500; line-height: 1.5; color: rgba(0,0,0,.55); }
  .ss-rules b { font-weight: 600; color: var(--ink); margin-right: 6px; }

  .ss-floor {
    flex: 0 0 auto; padding: 14px 28px 16px; border-top: 1px solid rgba(0,0,0,.08);
    background: rgba(153,110,94,.07); display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap;
  }
  .ss-floor p { flex: 1; min-width: 260px; font-size: 14px; font-weight: 500; line-height: 1.55; color: rgba(0,0,0,.55); }

  /* 情境1 POC 操作影片 */
  .aiwf-media {
    width: 100%; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(0,0,0,.1); background: #DCCCC7; line-height: 0;
    cursor: zoom-in; transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
  }
  .aiwf-media:hover { transform: scale(1.05); box-shadow: 0 10px 24px rgba(153,110,94,.12); }
  .aiwf-media:focus-visible { outline: 2px solid rgba(153,110,94,.9); outline-offset: 3px; }
  .aiwf-media video { width: 100%; height: auto; display: block; }
  .ss-lb--media .ss-lb-panel {
    width: min(1280px, 100%); max-height: 88vh; overflow: hidden;
    background: #000; border: none;
  }
  .ss-lb--media .ss-lb-panel video { width: 100%; height: auto; max-height: 88vh; display: block; }
  .ss-lb--media .ss-lb-close { background: rgba(255,255,255,.22); color: #fff; }
  .ss-lb--media .ss-lb-close:hover { background: rgba(255,255,255,.36); }
  @media (max-width: 560px) { .ss-lb.open { padding: 16px 12px; } }
'''

CSS_900 = '''    .ss-card { height: 520px; }
    .ss-trigger { margin-left: 0; }
'''

CSS_560 = '''    .ss-card { height: 640px; }
    .ss-head { padding: 16px 20px 14px; gap: 10px 12px; }
    .ss-eyebrow { font-size: 13px; }
    .ss-head .aiwf-skillpill, .ss-id .ss-name { font-size: 16px; }
    .aiwf-skillspec > .ss-card .ss-eyebrow,
    .aiwf-skillspec > .ss-card .ss-head .aiwf-skillpill { display: none; }
    .ss-col { padding-left: 20px; padding-right: 20px; }
    .ss-floor { padding: 12px 20px 14px; }
    .ss-chips em { font-size: 13px; padding: 2px 8px; }
    .ss-floor p { font-size: 13px; line-height: 1.5; }
    .aiwf-specs .row.skill { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px 10px; }
    .aiwf-specs .row.skill .k { flex: 0 0 100%; }
    .aiwf-more { margin-left: 0; }
    .ss-note { margin-left: 0; }
'''

JS = '''      <script>
        (function () {
          var host = document.currentScript.previousElementSibling;
          var card = host.querySelector('.ss-card');
          var wrap = host.querySelector('.ss-scroll');
          if (!card || !wrap) return;
          var body = wrap.querySelector('.ss-body');
          var title = card.getAttribute('data-skill') || 'Skill';

          function sync() {
            var atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 4;
            wrap.classList.toggle('at-end', atEnd || body.scrollHeight <= body.clientHeight + 4);
          }
          body.addEventListener('scroll', sync, { passive: true });
          window.addEventListener('resize', sync);
          sync();
          setTimeout(sync, 600);

          var lb = null, lastFocus = null;
          function build() {
            lb = document.createElement('div');
            lb.className = 'ss-lb';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', title + ' spec');
            var bd = document.createElement('div');
            bd.className = 'ss-lb-bd';
            var panel = document.createElement('div');
            panel.className = 'ss-lb-panel';
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'ss-lb-close';
            close.setAttribute('aria-label', 'Close');
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


def card(slug, name, chips, sections, floor):
    chip_html = ''.join('<em>%s</em>' % c for c in chips)
    return '''      <div class="aiwf-skillspec">
        <div class="ss-card" role="button" tabindex="0" data-skill="%s" aria-label="Enlarge the %s spec">
          <header class="ss-head">
            <p class="ss-eyebrow">INSIDE THE SKILL</p>
            <div class="ss-id">
              <span class="aiwf-skillpill">%s</span>
              <span class="ss-name">%s</span>
            </div>
            <div class="ss-trigger">
              <span class="ss-k">Triggers</span>
              <span class="ss-chips">
                %s
              </span>
            </div>
          </header>

          <div class="ss-scroll">
          <div class="ss-body">
%s
          </div>
          </div>

          <footer class="ss-floor">
            <span class="ss-k">Non-negotiables</span>
            <p>%s</p>
          </footer>
        </div>
      </div>
%s''' % (slug, slug, slug, name, chip_html, sections, floor, JS)


SEC2 = '''            <section class="ss-col">
              <h4>How it runs</h4>
              <ol class="ss-steps">
                <li><span class="ss-num">01</span><b>Collect the inputs</b>
                  <p>Asks for four required items first: feature name, where it lives in the product, request type, and a short summary. Optional: Figma link, ticket number, owner, timeline.</p></li>
                <li><span class="ss-num">02</span><b>Break the request down</b>
                  <p>If a Figma link is given it reads the file directly, then works through six dimensions: pages and sections, component specs, sorting logic, interaction behaviour, edge cases, and anything API-related.</p></li>
                <li><span class="ss-num">03</span><b>Draft it</b>
                  <p>Generates Markdown from the template into my docs folder, and prints the full draft in the conversation for me to read first.</p></li>
                <li><span class="ss-num">04</span><b>Publish once I approve</b>
                  <p>Nothing goes out until I say yes; then it creates or updates the Confluence / Notion page over MCP.</p></li>
              </ol>
            </section>

            <section class="ss-col">
              <h4>Doc template <i>v1.1 · 12 blocks</i></h4>
              <ul class="ss-chapters">
                <li><span class="req must">Required</span>Revision history</li>
                <li><span class="req must">Required</span>Request info</li>
                <li><span class="req opt">As needed</span>0 · Key terms</li>
                <li><span class="req must">Required</span>1 · Overview &amp; design goals</li>
                <li><span class="req must">Required</span>2 · Information architecture</li>
                <li><span class="req must">Required</span>3 · Page &amp; section specs</li>
                <li><span class="req opt">As needed</span>4 · Sorting &amp; display logic</li>
                <li><span class="req opt">As needed</span>5 · State machine</li>
                <li><span class="req opt">As needed</span>6 · Notifications</li>
                <li><span class="req must">Required</span>7 · Edge case summary</li>
                <li><span class="req opt">As needed</span>8 · Phasing</li>
                <li><span class="req opt">As needed</span>9 · API contract</li>
              </ul>
            </section>

            <section class="ss-col">
              <h4>Writing rules <i>correct, and usable by engineering as-is</i></h4>
              <ol class="ss-rules">
                <li><span class="ss-num">01</span><p><b>Tables first</b>Component specs, edge cases and API decisions always go in tables, never prose.</p></li>
                <li><span class="ss-num">02</span><p><b>Three fixed columns</b>Section / spec / notes — and notes hold the rule, not filler.</p></li>
                <li><span class="ss-num">03</span><p><b>Spell out the fallback chain</b>1 → 2 → 3, indented to show hierarchy, including what happens when there is no data.</p></li>
                <li><span class="ss-num">04</span><p><b>Edge cases get their own table</b>Two columns, scenario and behaviour; never mixed into component specs.</p></li>
                <li><span class="ss-num">05</span><p><b>Be exact with wording</b>Write <em>Hide</em>, not “disappears”; write “shows N by default, click loads N more”; for search, state the trigger, the scope and the match logic.</p></li>
                <li><span class="ss-num">06</span><p><b>The API section records decisions only</b>Product-level calls (pagination, data source, search method); implementation is left to backend.</p></li>
                <li><span class="ss-num">07</span><p><b>Language</b>Traditional Chinese, with technical terms kept in English (Tab, CTA, banner, API, endpoint).</p></li>
              </ol>
            </section>'''

CARD2 = card(
    'design-prd-spec', 'Design spec generation',
    ['Write me a design spec', 'Write a PRD', 'Produce a design spec', 'Docs to hand to engineering'],
    SEC2,
    'If there is a Figma file, read it before writing — never assume　·　Edge cases cover at least empty data, no search results and error states　·　Any sorting logic ships with its full fallback chain')

SEC3 = '''            <section class="ss-col">
              <h4>How it runs</h4>
              <ol class="ss-steps">
                <li><span class="ss-num">01</span><b>Pick the mode</b>
                  <p>New build, edit an existing file, or RWD multi-size. When it is unclear: a Figma node-id in the request means edit mode.</p></li>
                <li><span class="ss-num">02</span><b>Load the platform rules</b>
                  <p>Detects admin, customer-facing web or app, and reads that platform&rsquo;s rule file before touching Figma; RWD adds breakpoint and Variable Mode mapping on top.</p></li>
                <li><span class="ss-num">03</span><b>In edit mode, read before touching</b>
                  <p>Scans the existing nodes: node-id, variables already bound, whether it is a component instance, current auto-layout settings. Only the requested parts change — no rebuilding.</p></li>
                <li><span class="ss-num">04</span><b>Build and bind in one pass</b>
                  <p>Variable IDs are sampled from already-bound nodes in the current file; every node gets its tokens the moment it is created, not patched in at the end.</p></li>
                <li><span class="ss-num">05</span><b>Audit before reporting done</b>
                  <p>Runs the binding-coverage script; unbound counts must all reach zero, or be listed as documented exceptions.</p></li>
              </ol>
            </section>

            <section class="ss-col">
              <h4>Acceptance criteria <i>all six, or it is not done — nothing gets reported half-met</i></h4>
              <ul class="ss-checks">
                <li><span class="mk">A</span><p><b>Token binding</b>Colour, stroke weight, spacing and radius all bound to variables; IDs sampled from the current file, never hardcoded.</p></li>
                <li><span class="mk">B</span><p><b>Text styles</b>Every TEXT node uses a text style; text colour bound to a colour variable.</p></li>
                <li><span class="mk">C</span><p><b>Component source</b>Button / input / select / badge / icon always come from the library; switch variants with setProperties, never detach.</p></li>
                <li><span class="mk">D</span><p><b>Auto layout</b>Every container uses auto layout; FILL sizing set after appendChild; no absolute positioning (overlays aside).</p></li>
                <li><span class="mk">E</span><p><b>Edit safety</b>Only the requested scope changes; nodes that already carry variables get a new variable, not a raw colour value.</p></li>
                <li><span class="mk">F</span><p><b>Layer naming</b>Follows the team convention; no leftover defaults such as Frame 1 or Rectangle 2.</p></li>
              </ul>
            </section>

            <section class="ss-col">
              <h4>Hard rules <i>every one of these came from getting burned</i></h4>
              <ol class="ss-rules">
                <li><span class="ss-num">01</span><p><b>Never hardcode</b>fills, strokes, strokeWeight, textStyle, padding, gap and radius are always bound to variables.</p></li>
                <li><span class="ss-num">02</span><p><b>Sample variable IDs on the spot</b>Token IDs differ from file to file; IDs remembered from last time are not reused.</p></li>
                <li><span class="ss-num">03</span><p><b>Order matters</b>FILL sizing and setBoundVariable both have to come after appendChild.</p></li>
                <li><span class="ss-num">04</span><p><b>Do not reach inside instances</b>Switch variants with setProperties rather than editing a child&rsquo;s fill or font; detach only as a last resort.</p></li>
                <li><span class="ss-num">05</span><p><b>Verify as you go</b>Screenshot or read metadata after each section, instead of finding out at the very end.</p></li>
                <li><span class="ss-num">06</span><p><b>When no token fits</b>Brand one-offs stay hardcoded and get listed in the report; spacing with no exact token takes the nearest step.</p></li>
                <li><span class="ss-num">07</span><p><b>Ask when unsure</b>Anything ambiguous in the design comes back to me instead of being guessed.</p></li>
              </ol>
            </section>'''

CARD3 = card(
    'design-execution', 'Design file execution',
    ['Execute this design', 'Update this design file', 'Make the RWD versions', 'Must pass my standards'],
    SEC3,
    'No Figma edits until the rule file has been read　·　Binding audit reaches zero unbound, exceptions documented　·　If a component cannot be found, search the library — never draw it by hand')

POC = '''      <div class="aiwf-media" role="button" tabindex="0" aria-label="Enlarge the POC walkthrough">
        <video src="/_assets/custom/aiwf/poc-demo.mp4" width="1600" height="912"
               autoplay muted loop playsinline preload="metadata"
               aria-label="Seller 2FA POC walkthrough: sign-up, application, review, two-factor setup, member invites and permissions"></video>
      </div>
      <script>
        (function () {
          var host = document.currentScript.previousElementSibling;
          var vid = host.querySelector('video');
          if (!vid) return;
          var inLb = false;

          if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
              es.forEach(function (e) {
                if (inLb) return;
                if (e.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
                else vid.pause();
              });
            }, { threshold: 0.15 }).observe(host);
          }

          var lb = null, panel = null, lastFocus = null;
          function build() {
            lb = document.createElement('div');
            lb.className = 'ss-lb ss-lb--media';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', 'POC walkthrough');
            var bd = document.createElement('div');
            bd.className = 'ss-lb-bd';
            panel = document.createElement('div');
            panel.className = 'ss-lb-panel';
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'ss-lb-close';
            close.setAttribute('aria-label', 'Close');
            close.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
            panel.appendChild(close);
            lb.appendChild(bd);
            lb.appendChild(panel);
            document.body.appendChild(lb);
            bd.addEventListener('click', hide);
            close.addEventListener('click', hide);
          }
          function resume() { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
          function show() {
            if (inLb) return;
            if (!lb) build();
            inLb = true;
            lastFocus = document.activeElement;
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function () { lb.classList.add('shown'); });
            vid.controls = true;
            panel.appendChild(vid);
            resume();
            lb.querySelector('.ss-lb-close').focus();
          }
          function hide() {
            if (!inLb) return;
            inLb = false;
            lb.classList.remove('shown');
            document.body.style.overflow = '';
            vid.controls = false;
            host.appendChild(vid);
            resume();
            setTimeout(function () { lb.classList.remove('open'); }, 250);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
          }
          host.addEventListener('click', show);
          host.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
          });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && inLb) hide();
          });
        })();
      </script>'''

# ---- 套用 ----
anchor = """    aspect-ratio: 824 / 424; background: #DCCCC7; border-radius: 8px;
  }
"""
assert s.count(anchor) == 1
s = s.replace(anchor, anchor + CSS)

a900 = "    .aiwf-figure .ph { left: 24px; right: 24px; }\n"
assert s.count(a900) == 1
s = s.replace(a900, a900 + CSS_900)

a560 = "    .aiwf-specs .v { font-size: 18px; }\n"
assert s.count(a560) == 1
s = s.replace(a560, a560 + CSS_560)

for slot, blk in [('poc-demo', POC), ('design-docs-demo', CARD2), ('design-system-demo', CARD3)]:
    ph = '      <div class="aiwf-figure"><div class="ph" data-slot="%s"><!-- 素材待補：%s --></div></div>' % (
        slot, {'poc-demo': 'POC Demo', 'design-docs-demo': 'Design Docs Demo', 'design-system-demo': 'Design System Demo'}[slot])
    assert s.count(ph) == 1, 'placeholder %s: %d' % (slot, s.count(ph))
    s = s.replace(ph, blk)

sel = "'.sc-head', '.aiwf-figure', '.aiwf-specs .row', '.aiwf-prompts .bubble',"
assert s.count(sel) == 1
s = s.replace(sel, "'.sc-head', '.aiwf-figure', '.aiwf-media', '.aiwf-skillspec', '.aiwf-specs .row', '.aiwf-prompts .bubble',")

rm = "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover { transform: none; }"
assert s.count(rm) == 1
s = s.replace(rm, "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover, .ss-card:hover,\n    .aiwf-media:hover { transform: none; }\n    .ss-lb-panel { transition: none; }")

# 情境1 Background / Purpose 同步 zh 最新文案
bg_old = 'The admin login mechanism was changing: redesign the sign-up/login and store-onboarding flows, and introduce two-factor authentication (2FA) to harden security.'
bg_new = ('The admin login mechanism was changing: redesign the sign-up/login and store-onboarding flows, '
          'and introduce two-factor authentication (2FA) to harden security. It also meant auditing the Owner&rsquo;s '
          'sensitive actions and defining which ones still need a second check after login.')
assert s.count(bg_old) == 1
s = s.replace(bg_old, bg_new)

pp_old = 'This task was about optimizing an existing flow — the POC shows exactly where the new flow differs from the old one, keeping the team in sync.'
pp_new = ('This task was about optimizing an existing flow — the POC shows the differences from the old flow in one pass, '
          'including when 2FA is triggered in each scenario, keeping the team in sync.')
assert s.count(pp_old) == 1
s = s.replace(pp_old, pp_new)

# GitHub 連結旁加 repo 語言提示
more = '''            <img src="/_assets/custom/aiwf/github-icon.png" alt="GitHub"><span>View more</span>
          </a>
        </div>'''
assert s.count(more) == 2
s = s.replace(more, '''            <img src="/_assets/custom/aiwf/github-icon.png" alt="GitHub"><span>View more</span>
          </a>
          <span class="ss-note">Repo in Traditional Chinese</span>
        </div>''')

P.write_text(s)
print('en: POC video + 2 English skill cards + copy sync + repo note')
