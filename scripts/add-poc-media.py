#!/usr/bin/env python3
# 情境1 POC placeholder → 實際操作 GIF（Molly 08-12 提供 41s 螢幕錄影）
# 來源：Desktop/螢幕錄影 2026-08-12 下午5.49.02.mov（3016x1718, 41s, 30MB）
# 轉檔：ffmpeg fps=10 / 960px / palettegen stats_mode=diff max_colors=96 /
#       paletteuse dither=none（平面 UI 用不抖色最乾淨也最小）→ 4.2MB
#       另存一份同內容的 poc-demo.mp4（1600px/24fps/1.7MB）備用，要換成
#       autoplay 影片時把 <img> 換成 <video autoplay muted loop playsinline> 即可。
# 寬度比照情境2／3 的規範卡（滿版 1152），與相鄰兩張卡對齊。
import pathlib, sys

P = pathlib.Path('/Users/shihmuen/Desktop/portfolio-site/dist/zh/my-ai-workflow/index.html')
s = P.read_text()

CSS = '''
  /* 情境1 POC 操作 GIF：寬度比照規範卡，滿版對齊 */
  .aiwf-media {
    width: 100%; border-radius: 16px; overflow: hidden;
    border: 1px solid rgba(0,0,0,.1); background: #DCCCC7; line-height: 0;
  }
  .aiwf-media img { width: 100%; height: auto; display: block; }
'''

BLOCK = '''      <div class="aiwf-media">
        <img src="/_assets/custom/aiwf/poc-demo.gif" width="960" height="547"
             loading="lazy" decoding="async"
             alt="Seller 2FA POC 操作錄影：註冊、招商申請、審核、兩步驟驗證、邀請成員與權限設定">
      </div>'''

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

P.write_text(s)
print('poc gif inserted')
