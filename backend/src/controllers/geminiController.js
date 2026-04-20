const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");
const Report = require("../models/Report");

exports.analyzeReportWithGemini = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (!report.image_url) {
      return res.status(400).json({ error: "This report has no image" });
    }

    let aiResponse;

    if (report.image_url.startsWith("/uploads")) {
      const relativePath = report.image_url.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), relativePath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "Image file not found on server" });
      }

      const form = new FormData();
      form.append("file", fs.createReadStream(absolutePath));

      aiResponse = await axios.post("http://localhost:8000/predict", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });
    } else {
      const imageResponse = await axios.get(report.image_url, {
        responseType: "stream",
      });

      const form = new FormData();
      form.append("file", imageResponse.data, {
        filename: "report.jpg",
        contentType: imageResponse.headers["content-type"] || "image/jpeg",
      });

      aiResponse = await axios.post("http://localhost:8000/predict", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });
    }

    const aiData = aiResponse.data || {};
    const detections = aiData.detections || [];
    const topLabel = detections.length > 0 ? detections[0].label : null;

    await report.update({
      ai_total_detections: aiData.total_detections ?? 0,
      ai_max_confidence: aiData.max_confidence ?? null,
      ai_top_label: topLabel,
      ai_annotated_image_base64: aiData.annotated_image_base64 || null,
      ai_result_json: aiData,
    });

    const updatedReport = await Report.findByPk(id);

    return res.json({
      message: "AI analysis completed and saved",
      report_id: updatedReport.id,
      result: {
        success: updatedReport.ai_result_json?.success ?? true,
        total_detections: updatedReport.ai_total_detections ?? 0,
        max_confidence: updatedReport.ai_max_confidence ?? null,
        detections: updatedReport.ai_result_json?.detections || [],
        annotated_image_base64: updatedReport.ai_annotated_image_base64 || null,
        top_label: updatedReport.ai_top_label || null,
      },
    });
  } catch (error) {
    console.error("AI analysis error:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "AI analysis failed",
      details: error?.response?.data || error.message,
    });
  }
};