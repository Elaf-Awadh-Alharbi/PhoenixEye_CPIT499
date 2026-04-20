const Report = require("../models/Report");
const Drone = require("../models/Drone");
const { Op, fn, col, literal } = require("sequelize");


exports.getReports = async (req, res) => {
  try {
    const { status, source, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;

    // ✅ Date filter (Professional): supports from only / to only / both
    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) {
        const start = new Date(dateFrom);
        start.setHours(0, 0, 0, 0);
        where.createdAt[Op.gte] = start;
      }

      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const reports = await Report.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      total: reports.count,
      page: parsedPage,
      pages: Math.ceil(reports.count / parsedLimit),
      data: reports.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching reports" });
  }
};

// دالة حساب المسافة (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, drone_id } = req.body; // 

    const allowed = ["PENDING", "VERIFIED", "ASSIGNED", "REMOVED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    // 1) VERIFIED
    if (status === "VERIFIED") {
      report.status = "VERIFIED";
      await report.save();
      return res.json({ message: "Report verified", report });
    }

    // 2) ASSIGNED: يدوي أو أقرب درون
    if (status === "ASSIGNED") {
      let chosenDrone = null;
      let shortestDistance = null;

      // ✅ (A) تعيين يدوي إذا drone_id موجود
      if (drone_id) {
        chosenDrone = await Drone.findByPk(drone_id);

        if (!chosenDrone) {
          return res.status(404).json({ error: "Drone not found" });
        }

        if (!chosenDrone.is_online) {
          return res.status(400).json({ error: "Drone must be online" });
        }

        if (chosenDrone.status !== "AVAILABLE") {
          return res.status(400).json({ error: "Drone must be AVAILABLE" });
        }

        // (اختياري) نحسب المسافة إذا عنده موقع
        if (chosenDrone.last_latitude != null && chosenDrone.last_longitude != null) {
          shortestDistance = calculateDistance(
            report.latitude,
            report.longitude,
            chosenDrone.last_latitude,
            chosenDrone.last_longitude
          );
        }
      } else {
        // ✅ (B) fallback: أقرب درون (كودك السابق)
        const availableDrones = await Drone.findAll({
          where: { status: "AVAILABLE", is_online: true },
        });

        if (availableDrones.length === 0) {
          return res.status(400).json({ error: "No available online drones" });
        }

        let nearestDrone = null;
        let minDist = Infinity;

        for (const drone of availableDrones) {
          if (drone.last_latitude != null && drone.last_longitude != null) {
            const distance = calculateDistance(
              report.latitude,
              report.longitude,
              drone.last_latitude,
              drone.last_longitude
            );

            if (distance < minDist) {
              minDist = distance;
              nearestDrone = drone;
            }
          }
        }

        if (!nearestDrone) {
          return res.status(400).json({
            error: "No drones have valid last location (heartbeat not sent yet)",
          });
        }

        chosenDrone = nearestDrone;
        shortestDistance = minDist;
      }

      // ✅ لو البلاغ كان مربوط بدرون قديم، رجّعه AVAILABLE
      if (report.drone_id && report.drone_id !== chosenDrone.id) {
        const oldDrone = await Drone.findByPk(report.drone_id);
        if (oldDrone) {
          oldDrone.status = "AVAILABLE";
          await oldDrone.save();
        }
      }

      report.drone_id = chosenDrone.id;
      report.status = "ASSIGNED";

      // عندك enum للدرون ما فيه ASSIGNED، نخليه IN_MISSION
      chosenDrone.status = "IN_MISSION";

      await Promise.all([report.save(), chosenDrone.save()]);

      return res.json({
        message: drone_id ? "Report assigned (manual)" : "Report assigned to nearest drone",
        report,
        assigned_drone: chosenDrone,
        distance_km:
          shortestDistance != null ? Number(shortestDistance.toFixed(2)) : null,
      });
    }

    // 3) REMOVED: نرجع الدرون AVAILABLE (لو كان مربوط)
    if (status === "REMOVED") {
      report.status = "REMOVED";

      if (report.drone_id) {
        const drone = await Drone.findByPk(report.drone_id);
        if (drone) {
          drone.status = "AVAILABLE";
          await drone.save();
        }
      }

      await report.save();
      return res.json({ message: "Report marked as removed", report });
    }

    // حالات أخرى
    report.status = status;
    await report.save();
    return res.json({ message: "Status updated successfully", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating status" });
  }
};

exports.getReportsStats = async (req, res) => {
  try {
    const total = await Report.count();

    const pending = await Report.count({ where: { status: "PENDING" } });
    const verified = await Report.count({ where: { status: "VERIFIED" } });
    const removed = await Report.count({ where: { status: "REMOVED" } });

    res.json({
      total,
      pending,
      verified,
      removed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching stats" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // 📊 بداية اليوم
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 📈 بداية الأسبوع (الأحد)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // عدد بلاغات اليوم
    const todayCount = await Report.count({
      where: {
        created_at: {
          [Op.gte]: startOfDay,
        },
      },
    });

    // عدد بلاغات الأسبوع
    const weekCount = await Report.count({
      where: {
        created_at: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    // العدد الكلي
    const total = await Report.count();

    // عدد verified
    const verified = await Report.count({
      where: { status: "VERIFIED" },
    });

    // 📉 نسبة التحقق
    const verificationRate =
      total > 0 ? ((verified / total) * 100).toFixed(2) : 0;

    // 📍 أكثر موقع فيه بلاغات
    const topLocation = await Report.findAll({
      attributes: [
        "latitude",
        "longitude",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["latitude", "longitude"],
      order: [[literal("count"), "DESC"]],
      limit: 1,
    });

    res.json({
      todayReports: todayCount,
      weeklyReports: weekCount,
      verificationRate: `${verificationRate}%`,
      topLocation: topLocation[0] || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching analytics" });
  }
};

exports.getReportsTimeSeries = async (req, res) => {
  try {
    const { fn, col, literal } = require("sequelize");

    const reports = await Report.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: [literal("date")],
      order: [[literal("date"), "ASC"]],
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching timeseries data" });
  }
};

exports.getHeatmapData = async (req, res) => {
  try {
    const { fn, col, literal } = require("sequelize");

    const heatmap = await Report.findAll({
      attributes: [
        "latitude",
        "longitude",
        [fn("COUNT", col("id")), "weight"],
      ],
      group: ["latitude", "longitude"],
      order: [[literal("weight"), "DESC"]],
    });

    res.json(heatmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching heatmap data" });
  }
};

// GET /api/admin/reports/:id
exports.getReportDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching report details" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await report.destroy(); // soft delete لأن عندك paranoid=true
    res.json({ message: "Report deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting report" });
  }
};