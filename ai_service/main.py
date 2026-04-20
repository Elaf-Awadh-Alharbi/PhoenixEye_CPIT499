from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
import io
import os
import base64

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