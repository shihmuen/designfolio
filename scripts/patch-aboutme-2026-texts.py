#!/usr/bin/env python3
# 2026-08-05 About Me 改版（Figma node 808:2442）文字部分：
#   Focus Paylist → Focus Mode（改名＋修 typo）
#   Focus 計數 2 → 3、Recently I wrote 計數 2 → 4（Read 維持 3）
# 範圍：zh/en 的 about-me HTML＋兩份 about-me.json（雙語）。可重複執行（已改過就跳過）。
import re, sys, pathlib

DIST = pathlib.Path(__file__).resolve().parent.parent / 'dist'
JSONS = [
    DIST / '_json/34ddc871-1935-46fd-93e3-c2eb6d531cbb/about-me.json',
    DIST / '_json/41561a94-f7b9-4c5f-b246-737709e61165/about-me.json',
]
HTMLS = [DIST / 'zh/about-me/index.html', DIST / 'en/about-me/index.html']

NODE_RE = re.compile(r'"(\d+:\d+)":\{"type":"TEXT","id":"\1"')

def text_nodes(s):
    """回傳 [(id, start, end, characters)]，end＝下一個節點宣告起點。"""
    out = []
    marks = [(m.group(1), m.start()) for m in NODE_RE.finditer(s)]
    bounds = [m.start() for m in re.finditer(r'"\d+:\d+":\{"type":"', s)] + [len(s)]
    for nid, st in marks:
        en = next(b for b in bounds if b > st)
        cm = re.search(r'"characters":"((?:[^"\\]|\\.)*)"', s[st:en])
        out.append((nid, st, en, cm.group(1) if cm else None))
    return out

def patch_json(path):
    s = path.read_text()
    orig = s
    nodes = text_nodes(s)
    by_id = {nid: (st, en, ch) for nid, st, en, ch in nodes}
    # 標題 id → 目標計數
    targets = {}
    for nid, st, en, ch in nodes:
        if ch == 'Focus Paylist':
            targets[nid] = '3'
        elif ch == 'Recently I wrote ...':
            targets[nid] = '4'
    # 由 children 配對 [titleId, countId]
    edits = []  # (start, end, old, new)
    for m in re.finditer(r'"children":\["(\d+:\d+)","(\d+:\d+)"\]', s):
        t, c = m.group(1), m.group(2)
        if t in targets and c in by_id and by_id[c][2] == '2':
            st, en, _ = by_id[c]
            seg = s[st:en]
            seg2 = seg.replace('"characters":"2"', '"characters":"%s"' % targets[t])
            seg2 = seg2.replace('"name":"2"', '"name":"%s"' % targets[t], 1)
            edits.append((st, en, seg, seg2))
    for st, en, old, new in sorted(edits, reverse=True):
        s = s[:st] + new + s[en:]
    n_counts = len(edits)
    s, n_title = re.subn('Focus Paylist', 'Focus Mode', s)
    path.write_text(s)
    print(f'{path.name} ({path.parent.name[:8]}): counts changed={n_counts}, title renamed={n_title}, bytes {len(orig)}->{len(s)}')
    return n_counts, n_title

def patch_html(path):
    s = path.read_text()
    # 計數緊跟在標題 <p> 之後的下一個 <p>
    pat_wrote = re.compile(r'(Recently I wrote \.\.\.</p></div><div class="textContents[^>]*"><p class="[^"]*">)2(</p>)')
    pat_focus = re.compile(r'(Focus Paylist</p></div><div class="textContents[^>]*"><p class="[^"]*">)2(</p>)')
    s, n_w = pat_wrote.subn(r'\g<1>4\g<2>', s)
    s, n_f = pat_focus.subn(r'\g<1>3\g<2>', s)
    s, n_t = re.subn('Focus Paylist', 'Focus Mode', s)
    path.write_text(s)
    print(f'{path.parent.parent.name}/{path.parent.name}: wrote 2->4 x{n_w}, focus 2->3 x{n_f}, title x{n_t}')
    return n_w, n_f, n_t

ok = True
for p in JSONS:
    c, t = patch_json(p)
    if (c, t) not in [(6, 6), (0, 0)]:
        print(f'  ⚠️ 預期 counts=6/title=6（或已改過=0），實得 {c}/{t}', file=sys.stderr); ok = False
for p in HTMLS:
    w, f, t = patch_html(p)
    if (w, f, t) not in [(3, 3, 3), (0, 0, 0)]:
        print(f'  ⚠️ 預期各 3（或已改過=0），實得 {w}/{f}/{t}', file=sys.stderr); ok = False
sys.exit(0 if ok else 1)
