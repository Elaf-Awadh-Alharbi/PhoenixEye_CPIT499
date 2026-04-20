const express = require("express");
const router = express.Router();

const { registerDrone } = require("../controllers/droneController");
const { createDroneReport } = require("../controllers/reportController");

const verifyDroneToken = require("../middleware/droneAuthMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");

const droneController = require("../controllers/droneController");
const { uploadReportImage } = require("../middleware/uploadMiddleware");

// تسجيل درون
router.post("/register", registerDrone);

// رفع بلاغ من الدرون مع صورة
router.post(
  "/report",
  verifyDroneToken,
  uploadReportImage.single("image"), 
  createDroneReport
);

// heartbeat
router.post(
  "/heartbeat",
  verifyDroneToken,
  droneController.droneHeartbeat
);

// عرض الدرونات الحية (للأدمن)
router.get(
  "/live",
  verifyToken,
  droneController.getLiveDrones
);

router.patch(
  "/:id/pickup-status",
  verifyToken,
  droneController.updatePickupStatus
);

module.exports = router;




