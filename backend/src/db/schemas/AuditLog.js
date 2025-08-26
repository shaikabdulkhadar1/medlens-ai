const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
      trim: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    sessionId: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    category: {
      type: String,
      enum: [
        "authentication",
        "authorization",
        "data_access",
        "data_modification",
        "system",
        "security",
      ],
      default: "system",
    },
    outcome: {
      type: String,
      enum: ["success", "failure", "partial"],
      default: "success",
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    metadata: {
      requestMethod: String,
      requestUrl: String,
      responseStatus: Number,
      processingTime: Number,
      requestSize: Number,
      responseSize: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Indexes
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ outcome: 1 });
auditLogSchema.index({ ipAddress: 1 });

// Compound indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - keep logs for 1 year)
auditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

// Static method to log authentication events
auditLogSchema.statics.logAuth = function (
  userId,
  action,
  outcome,
  details = {}
) {
  return this.create({
    userId,
    action,
    resource: "authentication",
    details,
    outcome,
    category: "authentication",
    severity: outcome === "success" ? "low" : "high",
    timestamp: new Date(),
  });
};

// Static method to log data access
auditLogSchema.statics.logDataAccess = function (
  userId,
  resource,
  resourceId,
  action,
  details = {}
) {
  return this.create({
    userId,
    action,
    resource,
    resourceId,
    details,
    category: "data_access",
    severity: "low",
    timestamp: new Date(),
  });
};

// Static method to log data modification
auditLogSchema.statics.logDataModification = function (
  userId,
  resource,
  resourceId,
  action,
  details = {}
) {
  return this.create({
    userId,
    action,
    resource,
    resourceId,
    details,
    category: "data_modification",
    severity: "medium",
    timestamp: new Date(),
  });
};

// Static method to log security events
auditLogSchema.statics.logSecurity = function (
  userId,
  action,
  severity,
  details = {}
) {
  return this.create({
    userId,
    action,
    resource: "security",
    details,
    category: "security",
    severity,
    timestamp: new Date(),
  });
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function (userId, limit = 100) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "fullName email");
};

// Static method to get resource activity
auditLogSchema.statics.getResourceActivity = function (
  resource,
  resourceId,
  limit = 100
) {
  return this.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "fullName email");
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = function (
  severity = "high",
  limit = 100
) {
  return this.find({
    category: "security",
    severity: { $gte: severity },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("userId", "fullName email");
};

// Static method to get audit statistics
auditLogSchema.statics.getAuditStats = function (startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          category: "$category",
          outcome: "$outcome",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.category",
        outcomes: {
          $push: {
            outcome: "$_id.outcome",
            count: "$count",
          },
        },
        totalCount: { $sum: "$count" },
      },
    },
  ]);
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
