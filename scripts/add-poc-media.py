#!/usr/bin/env python3
# 情境1 POC placeholder → 實際操作影片（Molly 08-12 提供 41s 螢幕錄影）
# 來源：Desktop/螢幕錄影 2026-08-12 下午5.49.02.mov（3016x1718, 41s, 30MB）
# 轉檔：ffmpeg -an -vf "fps=24,scale=1600:-2" -c:v libx264 -crf 27 -preset slow
#       -pix_fmt yuv420p -movflags +faststart  →  poc-demo.mp4（1.7MB）
#       （原先做過 GIF 版 4.2MB，Molly 08-12 拍板改用 MP4：小 60%、解析度高 66%、
#         幀率兩倍，小字才不會糊。poc-demo.gif 留在 repo 備用。）
# 行為：inline 用 autoplay muted loop playsinline 模擬 GIF（無控制列），
#       進出視窗自動 play／pause；點擊開 Lightbox 放大檢視並帶控制列，
#       播放位置在 inline 與 Lightbox 之間互相接續。
# 寬度比照情境2／3 的規範卡（滿版 1152）。
# 重跑前先 git checkout 48dd646 -- <該 html> 還原（該 commit 已含最新 Background／Purpose 文案）。
import pathlib

P = pathlib.Path('/Users/shihmuen/Desktop/portfolio-site/dist/zh/my-ai-workflow/index.html')
s = P.read_text()

CSS = '''
  /* 情境1 POC 操作影片：寬度比照規範卡，滿版對齊；行為模擬 GIF */
  .aiwf-media {
    width: 100%; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(0,0,0,.1); background: #DCCCC7; line-height: 0;
    cursor: zoom-in; transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
  }
  .aiwf-media:hover { transform: scale(1.05); box-shadow: 0 10px 24px rgba(153,110,94,.12); }
  .aiwf-media:focus-visible { outline: 2px solid rgba(153,110,94,.9); outline-offset: 3px; }
  .aiwf-media video { width: 100%; height: auto; display: block; }
  /* Lightbox 的影片版：面板放寬、黑底、不捲動，並保留控制列方便逐段看 */
  .ss-lb--media .ss-lb-panel {
    width: min(1280px, 100%); max-height: 88vh; overflow: hidden;
    background: #000; border: none;
  }
  .ss-lb--media .ss-lb-panel video { width: 100%; height: auto; max-height: 88vh; display: block; }
  .ss-lb--media .ss-lb-close { background: rgba(255,255,255,.22); color: #fff; }
  .ss-lb--media .ss-lb-close:hover { background: rgba(255,255,255,.36); }
  /* 手機：橫向影片本來就受限於螢幕寬，把 Lightbox 邊距縮小換一點寬度；
     要真正放大請用控制列的全螢幕（iOS 會轉成橫向） */
  @media (max-width: 560px) { .ss-lb.open { padding: 16px 12px; } }
'''

BLOCK = '''      <div class="aiwf-media" role="button" tabindex="0" aria-label="放大檢視 POC 操作錄影">
        <video src="/_assets/custom/aiwf/poc-demo.mp4" width="1600" height="912"
               autoplay muted loop playsinline preload="metadata"
               aria-label="Seller 2FA POC 操作錄影：註冊、招商申請、審核、兩步驟驗證、邀請成員與權限設定"></video>
      </div>
      <script>
        (function () {
          var host = document.currentScript.previousElementSibling;
          var vid = host.querySelector('video');
          if (!vid) return;
          var inLb = false;

          // 只在看得到的時候播（Safari 不會自己暫停離開畫面的影片）
          if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
              es.forEach(function (e) {
                if (inLb) return;   // 影片正在 Lightbox 裡，別被 host 離開畫面誤暫停
                if (e.isIntersecting) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
                else vid.pause();
              });
            }, { threshold: 0.15 }).observe(host);
          }

          // Lightbox：沿用規範卡那一套。做法是把「同一顆 video」搬進面板再搬回來
          // ——複製第二顆 video 的話播放位置接不上（新元素 readyState 還是 0，
          // 當下設 currentTime 會被忽略），同一顆元素則天然延續，也少一份解碼。
          var lb = null, panel = null, lastFocus = null;
          function build() {
            lb = document.createElement('div');
            lb.className = 'ss-lb ss-lb--media';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', 'POC 操作錄影');
            var bd = document.createElement('div');
            bd.className = 'ss-lb-bd';
            panel = document.createElement('div');
            panel.className = 'ss-lb-panel';
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'ss-lb-close';
            close.setAttribute('aria-label', '關閉');
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
            vid.controls = true;          // 放大檢視給控制列，方便逐段看
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

anchor = """    aspect-ratio: 824 / 424; background: #DCCCC7; border-radius: 8px;
  }
"""
assert s.count(anchor) == 1, f'css anchor {s.count(anchor)}'
s = s.replace(anchor, anchor + CSS)

ph1 = '      <div class="aiwf-figure"><div class="ph" data-slot="poc-demo"><!-- 素材待補：POC Demo --></div></div>'
assert s.count(ph1) == 1, f'placeholder {s.count(ph1)}'
s = s.replace(ph1, BLOCK)

sel = "'.sc-head', '.aiwf-figure', '.aiwf-skillspec',"
assert s.count(sel) == 1, f'reveal sel {s.count(sel)}'
s = s.replace(sel, "'.sc-head', '.aiwf-figure', '.aiwf-media', '.aiwf-skillspec',")

# hover 位移納入 reduced-motion 停用
rm = "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover, .ss-card:hover { transform: none; }"
assert s.count(rm) == 1, f'reduced-motion {s.count(rm)}'
s = s.replace(rm, "    .aiwf-next a:hover .thumb, .aiwf-prompts .bubble:hover, .ss-card:hover,\n    .aiwf-media:hover { transform: none; }")

P.write_text(s)
print('poc mp4 + lightbox inserted')
