from __future__ import annotations
import asyncio
import platform
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from backend.app.schemas.contracts import ConfigUpdate
from backend.app.vision import PerceptionPipeline

pipeline = PerceptionPipeline()

@asynccontextmanager
async def lifespan(_: FastAPI):
    pipeline.start()
    yield
    pipeline.stop()

app = FastAPI(title="FRACTUS Camera-Based Perception", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def serialized_snapshot():
    return pipeline.snapshot().model_dump(by_alias=True, mode="json")

@app.get("/api/status")
def status():
    snapshot = serialized_snapshot()
    snapshot["platform"] = {"system": platform.system(), "machine": platform.machine(), "appleSilicon": platform.system() == "Darwin" and platform.machine() == "arm64"}
    return snapshot

@app.get("/api/metrics")
def metrics(): return serialized_snapshot()["metrics"]

@app.get("/api/objects")
def objects(): return serialized_snapshot()["objects"]

@app.get("/api/config")
def config(): return {"mode": pipeline.mode, "cameraIndex": pipeline.camera_index, "processing": "LOCAL", "depth": "Approximate monocular scale proxy; not LiDAR."}

@app.put("/api/config")
def update_config(update: ConfigUpdate):
    pipeline.set_config(update.mode, update.cameraIndex)
    return config()

@app.get("/api/frame")
def frame():
    data = pipeline.jpeg_frame()
    if data is None:
        raise HTTPException(status_code=404, detail="No live camera frame available. Use DEMO or start LIVE_AI with camera permission.")
    return Response(content=data, media_type="image/jpeg", headers={"Cache-Control": "no-store"})

@app.websocket("/ws/perception")
async def perception_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(serialized_snapshot())
            await asyncio.sleep(.18)
    except WebSocketDisconnect:
        return
