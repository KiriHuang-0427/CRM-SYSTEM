#!/bin/bash
# Sales CRM v6 — 一键部署 (macOS / Linux)

DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ========================================"
echo "    Sales CRM v6 — 腾讯云一键部署"
echo "  ========================================"

# 检查依赖
command -v node >/dev/null 2>&1 || { echo "  [错误] 未安装 Node.js"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "  [错误] 未安装 Python3"; exit 1; }

# 检查 COS SDK
python3 -c "import qcloud_cos" >/dev/null 2>&1 || {
    echo "  正在安装腾讯云 COS SDK..."
    python3 -m pip install cos-python-sdk-v5 -q
}

# 执行部署
python3 "$DIR/deploy.py"
