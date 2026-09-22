#!/usr/bin/env bash
set -euo pipefail

FRACTUS_ROOT="$(cd "$(dirname "$0")" && pwd)"
MODEL_PATH="$FRACTUS_ROOT/backend/models/yolov8n.onnx"
MODEL_URL="https://huggingface.co/Kalray/yolov8/resolve/main/yolov8n.onnx"

if [ -s "$MODEL_PATH" ]; then
  echo "YOLOv8n model already available: $MODEL_PATH"
  exit 0
fi

mkdir -p "$(dirname "$MODEL_PATH")"
echo "Downloading the local YOLOv8n COCO model (about 13 MB)..."
curl --fail --location --progress-bar "$MODEL_URL" --output "$MODEL_PATH"
echo "Model ready. FRACTUS can now run multi-class object detection offline."
