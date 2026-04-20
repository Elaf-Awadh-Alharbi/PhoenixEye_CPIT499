const Drone = require("../models/Drone");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

exports.testDrone = async (req, res) => {
  try {
    const drones = await Drone.findAll();
    res.json(drones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Drone model not working" });
  }
};

// POST http://localhost:5000/api/drones/register
exports.registerDrone = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Drone name is required" });
    }

    const drone = await Drone.create({
      name,
      status: "AVAILABLE",
      pickup_status: "idle",
      red_light_on: false,
    });

    const token = jwt.sign(
      { drone_id: drone.id, type: "drone" },
      process.env.DRONE_JWT_SECRET,
      { expiresIn: process.env.DRONE_TOKEN_EXPIRES }
    );

    res.status(201).json({
      message: "Drone registered successfully",
      drone_id: drone.id,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering drone" });
  }
};

exports.droneHeartbeat = async (req, res) => {
  try {
    const droneId = req.drone.drone_id;
    const { latitude, longitude, battery, status } = req.body;

    const drone = await Drone.findByPk(droneId);
    if (!drone) return res.status(404).json({ error: "Drone not found" });

    drone.last_latitude = latitude;
    drone.last_longitude = longitude;
    drone.battery = battery;

    const allowedStatuses = ["AVAILABLE", "IN_MISSION", "MAINTENANCE"];
    if (status && allowedStatuses.includes(status)) {
      drone.status = status;
    }

    drone.last_seen_at = new Date();
    drone.is_online = true;

    await drone.save();

    res.json({ message: "Heartbeat received", drone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Heartbeat failed" });
  }
};

exports.getLiveDrones = async (req, res) => {
  try {
    const drones = await Drone.findAll({
      attributes: [
        "id",
        "name",
        "status",
        "battery",
        "is_online",
        "last_latitude",
        "last_longitude",
        "last_seen_at",
        "pickup_status",
        "red_light_on",
      ],
    });

    const formatted = drones.map((drone) => ({
      ...drone.toJSON(),
      is_critical: drone.battery !== null && drone.battery < 20,
    }));

    res.json({
      total: drones.length,
      online: drones.filter((d) => d.is_online).length,
      offline: drones.filter((d) => !d.is_online).length,
      drones: formatted,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch live drones" });
  }
};

exports.updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_status } = req.body;

    const allowedStatuses = ["idle", "pickup_in_progress", "pickup_completed"];

    if (!allowedStatuses.includes(pickup_status)) {
      return res.status(400).json({
        error: "Invalid pickup status",
      });
    }

    const drone = await Drone.findByPk(id);

    if (!drone) {
      return res.status(404).json({
        error: "Drone not found",
      });
    }

    const red_light_on = pickup_status === "pickup_in_progress";

    await drone.update({
      pickup_status,
      red_light_on,
    });

    return res.json({
      message: "Pickup status updated successfully",
      drone,
    });
  } catch (error) {
    console.error("updatePickupStatus error:", error);
    return res.status(500).json({
      error: "Server error",
    });
  }
};

exports.analyzeDroneVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Video file is required" });
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), {
      filename: req.file.originalname || "drone-video.mp4",
      contentType: req.file.mimetype || "video/mp4",
    });

    const aiResponse = await axios.post(
      "https://phoenixeye-cpit499-1.onrender.com/predict-video",
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      }
    );

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete temp video:", err.message);
      }
    });

    return res.json({
      message: "Video analyzed successfully",
      result: aiResponse.data,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    console.error(
      "analyzeDroneVideo error:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      error: "Video analysis failed",
      details: error?.response?.data || error.message,
    });
  }
};




