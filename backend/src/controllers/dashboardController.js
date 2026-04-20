const { sequelize } = require("../config/database");

exports.getDashboardSummary = async (req, res) => {
  try {
    
    const totalReports = await sequelize.query(
      `SELECT COUNT(*) FROM roadkill_reports WHERE deleted_at IS NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // البلاغات حسب الحالة
    const statusCounts = await sequelize.query(
      `
      SELECT status, COUNT(*)
      FROM roadkill_reports
      WHERE deleted_at IS NULL
      GROUP BY status
      `,
      { type: sequelize.QueryTypes.SELECT }
    );

    // عدد الطائرات (لو جدول drones فيه paranoid)
    const totalDrones = await sequelize.query(
      `SELECT COUNT(*) FROM drones WHERE deleted_at IS NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // آخر 5 بلاغات (createdAt بصيغة ISO مضمونة)
    const recentReportsRaw = await sequelize.query(
      `
      SELECT id, latitude, longitude, status, created_at
      FROM roadkill_reports
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
      `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const recentReports = recentReportsRaw.map(r => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    }));

    

    res.json({
      totalReports: parseInt(totalReports[0].count, 10),
      totalDrones: parseInt(totalDrones[0].count, 10),
      statusCounts,
      recentReports,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
};