from __future__ import annotations

from pathlib import Path
import cv2
import numpy as np

COCO_CLASSES = (
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog",
    "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
    "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
    "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog",
    "pizza", "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv",
    "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
)

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "models" / "yolov8n.onnx"


class OpenCVSceneDetector:
    """Multi-class YOLO when installed, with local person and wall fallbacks."""

    def __init__(self) -> None:
        self.net = None
        if MODEL_PATH.exists():
            try:
                self.net = cv2.dnn.readNetFromONNX(str(MODEL_PATH))
            except cv2.error:
                self.net = None
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.face = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    @property
    def name(self) -> str:
        return "Local YOLOv8n COCO + face cue + structural-plane heuristic" if self.net is not None else "OpenCV person cues + structural-plane heuristic (YOLO model unavailable)"

    def detect(self, frame) -> list[tuple[float, float, float, float, float, str, str]]:
        height, width = frame.shape[:2]
        detections = self._yolo(frame) if self.net is not None else []
        detections.extend(self._person_fallbacks(frame, detections))
        detections.extend(self._structural_planes(frame, detections))
        return detections

    def _yolo(self, frame) -> list[tuple[float, float, float, float, float, str, str]]:
        height, width = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(frame, 1 / 255, (640, 640), swapRB=True, crop=False)
        self.net.setInput(blob)
        output = self.net.forward()
        predictions = np.squeeze(output)
        if predictions.ndim != 2:
            return []
        if predictions.shape[0] == 84:
            predictions = predictions.T
        boxes: list[list[int]] = []
        scores: list[float] = []
        class_ids: list[int] = []
        scale_x, scale_y = width / 640, height / 640
        for row in predictions:
            if len(row) < 84:
                continue
            class_id = int(np.argmax(row[4:]))
            confidence = float(row[4 + class_id])
            if confidence < 0.38:
                continue
            cx, cy, box_width, box_height = row[:4]
            x = int((cx - box_width / 2) * scale_x)
            y = int((cy - box_height / 2) * scale_y)
            w = int(box_width * scale_x)
            h = int(box_height * scale_y)
            if w < 14 or h < 14:
                continue
            boxes.append([max(0, x), max(0, y), min(w, width), min(h, height)])
            scores.append(confidence)
            class_ids.append(class_id)
        indices = cv2.dnn.NMSBoxes(boxes, scores, .38, .45)
        detections: list[tuple[float, float, float, float, float, str, str]] = []
        for index in np.array(indices).flatten() if len(indices) else []:
            x, y, w, h = boxes[int(index)]
            detections.append((x, y, w, h, round(scores[int(index)], 2), COCO_CLASSES[class_ids[int(index)]], "yolo-coco"))
        return detections

    def _person_fallbacks(self, frame, existing: list[tuple[float, float, float, float, float, str, str]]) -> list[tuple[float, float, float, float, float, str, str]]:
        height, width = frame.shape[:2]
        scaled = frame
        factor = 1.0
        if width > 800:
            factor = 800 / width
            scaled = cv2.resize(frame, (800, int(height * factor)))
        fallbacks: list[tuple[float, float, float, float, float, str, str]] = []
        boxes, weights = self.hog.detectMultiScale(scaled, winStride=(8, 8), padding=(8, 8), scale=1.05)
        for (x, y, w, h), score in zip(boxes, weights):
            fallbacks.append((x / factor, y / factor, w / factor, h / factor, min(.99, max(.5, float(score) / 2.2)), "person", "full-body"))
        gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
        faces = self.face.detectMultiScale(gray, scaleFactor=1.12, minNeighbors=5, minSize=(42, 42))
        for fx, fy, fw, fh in faces:
            x = max(0, (fx - fw * .62) / factor)
            y = max(0, (fy - fh * .20) / factor)
            w = min(width - x, fw * 2.24 / factor)
            h = min(height - y, fh * 4.6 / factor)
            fallbacks.append((x, y, w, h, .78, "person", "frontal-face"))
        return [item for item in fallbacks if not self._overlaps_person(item, existing + fallbacks[:fallbacks.index(item)])]

    @staticmethod
    def _overlaps_person(candidate, detections) -> bool:
        x, y, w, h, _, object_class, _ = candidate
        if object_class != "person":
            return False
        cx, cy = x + w / 2, y + h / 2
        for bx, by, bw, bh, _, other_class, _ in detections:
            if other_class == "person" and abs(cx - (bx + bw / 2)) < max(w, bw) * .42 and abs(cy - (by + bh / 2)) < max(h, bh) * .42:
                return True
        return False

    def _structural_planes(self, frame, existing) -> list[tuple[float, float, float, float, float, str, str]]:
        """Conservative 2D wall cue based on long, stable vertical/edge structure."""
        height, width = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 70, 160)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=max(55, width // 11), minLineLength=height * .38, maxLineGap=20)
        if lines is None:
            return []
        verticals = [line[0] for line in lines if abs(line[0][2] - line[0][0]) < width * .05 and abs(line[0][3] - line[0][1]) > height * .38]
        if len(verticals) < 2:
            return []
        average_x = int(sum((line[0] + line[2]) / 2 for line in verticals) / len(verticals))
        x = 0 if average_x < width / 2 else int(width * .78)
        wall = (x, int(height * .12), int(width * .22), int(height * .78), .42, "wall", "structural-plane")
        if any(item[5] == "wall" for item in existing):
            return []
        return [wall]
