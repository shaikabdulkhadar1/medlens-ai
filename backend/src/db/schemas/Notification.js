const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "case_assigned",
        "analysis_complete",
        "report_ready",
        "system_alert",
        "urgent_case",
        "follow_up",
        "reminder",
      ],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["case", "analysis", "report", "system", "reminder"],
      default: "system",
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    actionText: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    deliveryChannels: [
      {
        type: String,
        enum: ["in_app", "email", "push", "sms"],
        default: ["in_app"],
      },
    ],
    deliveryStatus: {
      in_app: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        error: String,
      },
    },
    metadata: {
      source: String,
      sourceId: mongoose.Schema.Types.ObjectId,
      template: String,
      language: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for is expired
notificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual("isScheduled").get(function () {
  if (!this.scheduledAt) return false;
  return new Date() < this.scheduledAt;
});

// Virtual for can be sent
notificationSchema.virtual("canBeSent").get(function () {
  if (this.isExpired) return false;
  if (this.isScheduled) return false;
  return true;
});

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 });

// Compound indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// TTL index for expired notifications (optional)
// notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function (channel = "in_app") {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].sent = true;
    this.deliveryStatus[channel].sentAt = new Date();
  }
  if (!this.sentAt) {
    this.sentAt = new Date();
  }
  return this.save();
};

// Method to mark delivery error
notificationSchema.methods.markDeliveryError = function (channel, error) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].error = error;
  }
  return this.save();
};

// Static method to create case assignment notification
notificationSchema.statics.createCaseAssignment = function (userId, caseData) {
  return this.create({
    userId,
    type: "case_assigned",
    title: "New Case Assigned",
    message: `You have been assigned case ${caseData.caseNumber} for patient ${caseData.patientName}`,
    priority: caseData.priority === "urgent" ? "urgent" : "high",
    category: "case",
    data: {
      caseId: caseData.caseId,
      caseNumber: caseData.caseNumber,
      patientName: caseData.patientName,
      priority: caseData.priority,
    },
    actionUrl: `/cases/${caseData.caseId}`,
    actionText: "View Case",
    deliveryChannels: ["in_app", "email"],
  });
};

// Static method to create analysis complete notification
notificationSchema.statics.createAnalysisComplete = function (
  userId,
  analysisData
) {
  return this.create({
    userId,
    type: "analysis_complete",
    title: "AI Analysis Complete",
    message: `AI analysis for case ${analysisData.caseNumber} has been completed with ${analysisData.confidence}% confidence`,
    priority: "medium",
    category: "analysis",
    data: {
      caseId: analysisData.caseId,
      caseNumber: analysisData.caseNumber,
      confidence: analysisData.confidence,
      detectedConditions: analysisData.detectedConditions,
    },
    actionUrl: `/cases/${analysisData.caseId}/analysis`,
    actionText: "View Analysis",
    deliveryChannels: ["in_app", "email"],
  });
};

// Static method to create report ready notification
notificationSchema.statics.createReportReady = function (userId, reportData) {
  return this.create({
    userId,
    type: "report_ready",
    title: "Report Ready for Review",
    message: `Report ${reportData.reportNumber} for case ${reportData.caseNumber} is ready for your review`,
    priority: "high",
    category: "report",
    data: {
      reportId: reportData.reportId,
      reportNumber: reportData.reportNumber,
      caseNumber: reportData.caseNumber,
    },
    actionUrl: `/reports/${reportData.reportId}`,
    actionText: "Review Report",
    deliveryChannels: ["in_app", "email"],
  });
};

// Static method to create urgent case notification
notificationSchema.statics.createUrgentCase = function (userId, caseData) {
  return this.create({
    userId,
    type: "urgent_case",
    title: "Urgent Case Alert",
    message: `URGENT: Case ${caseData.caseNumber} requires immediate attention`,
    priority: "urgent",
    category: "case",
    data: {
      caseId: caseData.caseId,
      caseNumber: caseData.caseNumber,
      patientName: caseData.patientName,
    },
    actionUrl: `/cases/${caseData.caseId}`,
    actionText: "View Urgent Case",
    deliveryChannels: ["in_app", "email", "push"],
  });
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = function (userId, limit = 50) {
  return this.find({
    userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get notifications by type
notificationSchema.statics.getByType = function (userId, type, limit = 50) {
  return this.find({ userId, type }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to get urgent notifications
notificationSchema.statics.getUrgent = function (userId, limit = 20) {
  return this.find({
    userId,
    priority: "urgent",
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { userId, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          type: "$type",
          isRead: "$isRead",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.type",
        read: {
          $sum: {
            $cond: [{ $eq: ["$_id.isRead", true] }, "$count", 0],
          },
        },
        unread: {
          $sum: {
            $cond: [{ $eq: ["$_id.isRead", false] }, "$count", 0],
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("Notification", notificationSchema);
