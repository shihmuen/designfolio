#!/bin/bash
# 停止作品集本機預覽伺服器
ok=0
pkill -f 'scripts/devserver.mjs' 2>/dev/null && ok=1
pkill -f 'http.server 4180' 2>/dev/null && ok=1
if [ $ok = 1 ]; then
  echo "✅ 已停止本機預覽伺服器（作品集 4173／Playlist 4180）。"
else
  echo "伺服器本來就沒在跑。"
fi
sleep 1.5
