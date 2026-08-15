#!/bin/bash
# 作品集本機預覽：雙擊啟動，會自動打開瀏覽器
# 內容＝dist/ 資料夾＝跟線上版完全相同的檔案（線上版就是從這裡部署的）
cd "$(dirname "$0")"

if lsof -i :4173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "預覽伺服器已在跑，直接開瀏覽器 →"
else
  echo "啟動預覽伺服器（port 4173）…"
  nohup node scripts/devserver.mjs >/tmp/portfolio-devserver.log 2>&1 &
  sleep 1
  if ! lsof -i :4173 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "❌ 啟動失敗，請截圖以下訊息給 Claude："
    tail -5 /tmp/portfolio-devserver.log
    read -p "按 Enter 關閉…"
    exit 1
  fi
fi

# Hero 的 Playlist widget 本機版（port 4180）
PLAYLIST_DIR="$HOME/Desktop/☁️/moon-agent/my-playlist/site"
if lsof -i :4180 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Playlist 本機伺服器已在跑。"
elif [ -d "$PLAYLIST_DIR" ]; then
  echo "啟動 Playlist 本機伺服器（port 4180）…"
  nohup python3 -m http.server 4180 --directory "$PLAYLIST_DIR" >/tmp/portfolio-playlist.log 2>&1 &
  sleep 1
else
  echo "⚠️ 找不到 playlist 資料夾，Hero 的唱片會是空白框。"
fi

open "http://localhost:4173"
echo ""
echo "✅ 本機預覽：http://localhost:4173"
echo "   中英切換、Hero 輪播、Lightbox 等行為都與線上一致。"
echo "   看完可直接關掉這個視窗（伺服器會留在背景）。"
echo "   要停止伺服器 → 雙擊「停止本機預覽.command」"
sleep 1
