#!/bin/bash
# 停止作品集本機預覽伺服器
if pkill -f 'scripts/devserver.mjs' 2>/dev/null; then
  echo "✅ 已停止本機預覽伺服器。"
else
  echo "伺服器本來就沒在跑。"
fi
sleep 1.5
