from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
import io
import os
import base64
import cv2
import tempfile

app = FastAPI(title="PhoenixEye AI Service")

MODEL_PATH = "model.pt"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

model = YOLO(MODEL_PATH)


@app.get("/")
def root():
    return {"message": "AI service is running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        results = model(image)

        detections = []
        total_detections = 0
        max_confidence = 0.0
        annotated_image_base64 = None

        for result in results:
            boxes = result.boxes
            names = result.names

            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    coords = box.xyxy[0].tolist()

                    detections.append({
                        "class_id": cls_id,
                        "label": names.get(cls_id, str(cls_id)),
                        "confidence": confidence,
                        "bbox": {
                            "x1": coords[0],
                            "y1": coords[1],
                            "x2": coords[2],
                            "y2": coords[3],
                        }
                    })

                    total_detections += 1
                    if confidence > max_confidence:
                        max_confidence = confidence

            plotted = result.plot()
            annotated_image = Image.fromarray(plotted)
            buffer = io.BytesIO()
            annotated_image.save(buffer, format="JPEG")
            annotated_image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return JSONResponse({
            "success": True,
            "total_detections": total_detections,
            "max_confidence": max_confidence,
            "detections": detections,
            "annotated_image_base64": annotated_image_base64
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )


@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...)):
    temp_video_path = None

    try:
        suffix = os.path.splitext(file.filename)[1] or ".mp4"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await file.read())
            temp_video_path = temp_file.name

        cap = cv2.VideoCapture(temp_video_path)

        if not cap.isOpened():
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Cannot open video"}
            )

        frame_index = 0
        frame_skip = 10  # يحلل كل 10 فريمات
        total_frames_checked = 0
        total_detections = 0
        max_confidence = 0.0
        best_detection = None
        frames_with_detections = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_index % frame_skip == 0:
                total_frames_checked += 1

                results = model(frame)
                frame_detections = []

                for result in results:
                    boxes = result.boxes
                    names = result.names

                    if boxes is not None:
                        for box in boxes:
                            cls_id = int(box.cls[0].item())
                            confidence = float(box.conf[0].item())
                            coords = box.xyxy[0].tolist()
                            label = names.get(cls_id, str(cls_id))

                            detection = {
                                "frame_index": frame_index,
                                "class_id": cls_id,
                                "label": label,
                                "confidence": confidence,
                                "bbox": {
                                    "x1": coords[0],
                                    "y1": coords[1],
                                    "x2": coords[2],
                                    "y2": coords[3],
                                }
                            }

                            frame_detections.append(detection)
                            total_detections += 1

                            if confidence > max_confidence:
                                max_confidence = confidence
                                best_detection = detection

                if frame_detections:
                    frames_with_detections.append({
                        "frame_index": frame_index,
                        "detections": frame_detections
                    })

            frame_index += 1

        cap.release()

        return JSONResponse({
            "success": True,
            "video_analysis": True,
            "total_frames_checked": total_frames_checked,
            "total_detections": total_detections,
            "roadkill_detected": total_detections > 0,
            "max_confidence": max_confidence,
            "best_detection": best_detection,
            "frames_with_detections": frames_with_detections
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

    finally:
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)