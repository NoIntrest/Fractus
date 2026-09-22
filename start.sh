#!/usr/bin/env bash
set -euo pipefail

FRACTUS_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$FRACTUS_ROOT"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
. .venv/bin/activate
if ! python -c "import fastapi, cv2" >/dev/null 2>&1; then
  python -m pip install -r backend/requirements.txt
fi
if [ ! -d "frontend/node_modules" ]; then
  (cd frontend && npm install)
fi
if [ "${FRACTUS_SKIP_MODEL_DOWNLOAD:-0}" != "1" ] && [ ! -s "backend/models/yolov8n.onnx" ]; then
  ./download_models.sh
fi

python -m backend &
FRACTUS_BACKEND_PID=$!
cleanup() { kill "$FRACTUS_BACKEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd frontend && npm run dev -- --host 127.0.0.1)
