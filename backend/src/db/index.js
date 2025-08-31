const connectDB = require("./db");

// Import all models
const User = require("./schemas/User");
const Patient = require("./schemas/Patient");
const Case = require("./schemas/Case");
const Image = require("./schemas/Image");
const AnalysisJob = require("./schemas/AnalysisJob");
const Report = require("./schemas/Report");
const AuditLog = require("./schemas/AuditLog");
const Notification = require("./schemas/Notification");
const AIModel = require("./schemas/AIModel");
const SystemSetting = require("./schemas/SystemSetting");
const UploadRecord = require("./schemas/UploadRecord");
const Timeline = require("./schemas/Timeline");
const AIAnalysis = require("./schemas/AIAnalysis");

// Export all models
module.exports = {
  connectDB,
  User,
  Patient,
  Case,
  Image,
  AnalysisJob,
  Report,
  AuditLog,
  Notification,
  AIModel,
  SystemSetting,
  UploadRecord,
  Timeline,
  AIAnalysis,
};
