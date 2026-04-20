const express = require("express");
const { createCitizenReport } = require("../controllers/reportController");
const { uploadReportImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

// هذا خاص بالمواطنين (بدون درون توكن)
// يستقبل صورة عبر multipart/form-data
router.post(
  "/",
  uploadReportImage.single("image"), // اسم الحقل في FormData = image
  createCitizenReport
);

module.exports = router;

