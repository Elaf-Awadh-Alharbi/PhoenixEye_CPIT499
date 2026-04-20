from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import cv2
import tempfile
import os

app = FastAPI(title="PhoenixEye AI Service")

# تحميل المودل
MODEL_PATH = "best.pt"  # عدليه إذا اسم ملفك مختلف
model = YOLO(MODEL_PATH)


# ===============================
# 📸 IMAGE DETECTION
# ===============================
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    temp_path = None

    try:
        # حفظ الصورة مؤقتًا
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            temp.write(await file.read())
            temp_path = temp.name

        # تشغيل المودل
        results = model(temp_path)

        detections = []

        for result in results:
            boxes = result.boxes
            names = result.names

            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    coords = box.xyxy[0].tolist()
                    label = names.get(cls_id, str(cls_id))

                    detections.append({
                        "label": label,
                        "confidence": confidence,
                        "bbox": {
                            "x1": coords[0],
                            "y1": coords[1],
                            "x2": coords[2],
                            "y2": coords[3],
                        }
                    })

        return JSONResponse({
            "success": True,
            "roadkill_detected": len(detections) > 0,
            "detections": detections
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# ===============================
# 🎥 VIDEO DETECTION
# ===============================
@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...)):
    temp_video_path = None

    try:
        # حفظ الفيديو مؤقتًا
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            temp_file.write(await file.read())
            temp_video_path = temp_file.name

        cap = cv2.VideoCapture(temp_video_path)

        if not cap.isOpened():
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Cannot open video"}
            )

        frame_index = 0
        frame_skip = 10  # تحليل كل 10 فريمات
        total_detections = 0
        best_detection = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_index % frame_skip == 0:
                results = model(frame)

                for result in results:
                    boxes = result.boxes
                    names = result.names

                    if boxes is not None:
                        for box in boxes:
                            confidence = float(box.conf[0].item())
                            cls_id = int(box.cls[0].item())
                            label = names.get(cls_id, str(cls_id))

                            total_detections += 1

                            if (
                                best_detection is None
                                or confidence > best_detection["confidence"]
                            ):
                                best_detection = {
                                    "frame_index": frame_index,
                                    "label": label,
                                    "confidence": confidence
                                }

            frame_index += 1

        cap.release()

        return JSONResponse({
            "success": True,
            "video_analysis": True,
            "roadkill_detected": total_detections > 0,
            "total_detections": total_detections,
            "best_detection": best_detection
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

    finally:
        if temp_video_path and os.path.exists(temp_video_path):
            os.remove(temp_video_path)


# ===============================
# 🧪 HEALTH CHECK
# ===============================
@app.get("/")
def root():
    return {"message": "PhoenixEye AI Service is running"}