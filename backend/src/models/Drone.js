const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Drone = sequelize.define(
  "Drone",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("AVAILABLE", "IN_MISSION", "OFFLINE", "MAINTENANCE"),
      defaultValue: "AVAILABLE",
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    last_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    battery: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pickup_status: {
      type: DataTypes.ENUM("idle", "pickup_in_progress", "pickup_completed"),
      allowNull: false,
      defaultValue: "idle",
    },
    red_light_on: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "drones",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = Drone;