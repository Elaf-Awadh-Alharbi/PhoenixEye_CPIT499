const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Report = sequelize.define(
  "Report",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    drone_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "VERIFIED", "ASSIGNED", "REMOVED"),
      defaultValue: "PENDING",
    },
    source: {
      type: DataTypes.ENUM("DRONE", "CITIZEN"),
      allowNull: false,
    },

    ai_total_detections: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ai_max_confidence: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    ai_top_label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ai_annotated_image_base64: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    ai_result_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "roadkill_reports",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = Report;