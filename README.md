# FRACTUS

**Camera-Based Fractus Prototype** is a local adaptive-perception demo for macOS. It uses RGB camera input when LIVE AI is selected; it does not generate LiDAR or a true point cloud.

## Quick start

```bash
cd /Users/abhi/Hackthon/fractus
chmod +x start.sh
./start.sh
```

Open `http://127.0.0.1:5173`.

The first start creates a Python virtual environment, installs frontend and backend dependencies, and downloads the local YOLOv8n COCO model (about 13 MB). After that, the vision model and deterministic demo work offline. Use `FRACTUS_SKIP_MODEL_DOWNLOAD=1 ./start.sh` when working without network; the app then retains its person/structural-plane fallback.

## macOS camera permission

When selecting `LIVE AI`, macOS may ask for camera access for the terminal application that launched the backend. Allow it under **System Settings > Privacy & Security > Camera**. The frontend is served locally and camera frames remain on the MacBook.

## Honest capabilities

- `LIVE AI`: local MacBook camera, YOLO COCO object/vehicle detection when the local model is present, person and structural-plane fallbacks, centroid tracking, relative-depth proxy, and measured pipeline metrics.
- `SIMULATION`: deterministic adaptive behavior when a model or camera is unavailable.
- `DEMO`: a guaranteed 24-second presentation timeline.

The displayed depth/meter value is an approximate, uncalibrated visual estimate based on bounding-box scale. Virtual cell resolution is an allocation concept, not physical centimeter mapping.

## Troubleshooting

- Camera unavailable: check macOS camera permission, close competing camera apps, then use `DEMO` while presenting.
- Port busy: stop another process using ports `5173` or `8000`, then rerun `./start.sh`.
- Live AI detects no person: ensure full upper/lower body is visible and use good lighting. The bundled live model intentionally supports people only.

See [Architecture](docs/ARCHITECTURE.md), [API contract](docs/API_CONTRACT.md), and [demo runbook](docs/DEMO.md).
