require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDB } = require("./src/config/database");
const { Op } = require("sequelize");
const Drone = require("./src/models/Drone");
const authRoutes = require("./src/routes/authRoutes");
const usersRoutes = require("./src/routes/usersRoutes"); 
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const droneRoutes = require("./src/routes/droneRoutes");
const path = require("path");
const app = express();
const fs = require("fs");
// إنشاء مجلد uploads/reports تلقائيًا إذا غير موجود
const uploadsPath = path.join(__dirname, "uploads", "reports");

// Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes); 
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/drones", droneRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Phoenix Eye API Running" });
});

const PORT = process.env.PORT || 5000;

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("📁 uploads/reports folder created");
}


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

setInterval(async () => {
  const timeout = new Date(Date.now() - 30000);

  await Drone.update(
    { is_online: false, status: "OFFLINE" },
    {
      where: {
        last_seen_at: { [Op.lt]: timeout },
      },
    }
  );
}, 15000);


