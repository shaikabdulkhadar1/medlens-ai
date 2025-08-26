const mongoose = require("mongoose");

const analysisJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      unique: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: [true, "Case ID is required"],
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
    jobType: {
      type: String,
      required: [true, "Job type is required"],
      enum: [
        "image_classification",
        "pdf_summarization",
        "vitals_analysis",
        "object_detection",
        "segmentation",
      ],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, "Priority cannot be negative"],
      max: [10, "Priority cannot exceed 10"],
    },
    model: {
      type: String,
      required: [true, "Model name is required"],
      trim: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      message: String,
      code: String,
      stack: String,
    },
    processingTime: {
      type: Number,
      min: [0, "Processing time cannot be negative"],
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, "Retry count cannot be negative"],
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: [0, "Max retries cannot be negative"],
    },
    queue: {
      type: String,
      required: [true, "Queue name is required"],
      trim: true,
    },
    attempts: [
      {
        attempt: Number,
        startedAt: Date,
        completedAt: Date,
        status: {
          type: String,
          enum: ["success", "failed"],
        },
        error: String,
        processingTime: Number,
      },
    ],
    metadata: {
      inputFileSize: Number,
      inputFileType: String,
      outputFileSize: Number,
      outputFileType: String,
      modelVersion: String,
      apiEndpoint: String,
    },
    notifications: {
      emailSent: {
        type: Boolean,
        default: false,
      },
      pushSent: {
        type: Boolean,
        default: false,
      },
      socketSent: {
        type: Boolean,
        default: false,
      },
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for job duration
analysisJobSchema.virtual("duration").get(function () {
  if (!this.startedAt || !this.completedAt) return null;
  return this.completedAt - this.startedAt;
});

// Virtual for time in queue
analysisJobSchema.virtual("queueTime").get(function () {
  if (!this.createdAt || !this.startedAt) return null;
  return this.startedAt - this.createdAt;
});

// Virtual for is expired
analysisJobSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Indexes
analysisJobSchema.index({ jobId: 1 }, { unique: true });
analysisJobSchema.index({ caseId: 1 });
analysisJobSchema.index({ imageId: 1 });
analysisJobSchema.index({ status: 1 });
analysisJobSchema.index({ jobType: 1 });
analysisJobSchema.index({ priority: -1 });
analysisJobSchema.index({ createdAt: -1 });
analysisJobSchema.index({ startedAt: -1 });
analysisJobSchema.index({ completedAt: -1 });
analysisJobSchema.index({ queue: 1 });

// Compound indexes
analysisJobSchema.index({ status: 1, priority: -1 });
analysisJobSchema.index({ caseId: 1, status: 1 });
analysisJobSchema.index({ jobType: 1, status: 1 });
analysisJobSchema.index({ createdAt: 1, status: 1 });

// TTL index for expired jobs (optional)
// analysisJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to update progress
analysisJobSchema.methods.updateProgress = function (progress) {
  this.progress = Math.min(100, Math.max(0, progress));
  return this.save();
};

// Method to start processing
analysisJobSchema.methods.startProcessing = function () {
  this.status = "processing";
  this.startedAt = new Date();
  this.progress = 0;
  return this.save();
};

// Method to complete job
analysisJobSchema.methods.completeJob = function (result, processingTime) {
  this.status = "completed";
  this.result = result;
  this.progress = 100;
  this.processingTime = processingTime;
  this.completedAt = new Date();
  return this.save();
};

// Method to fail job
analysisJobSchema.methods.failJob = function (error) {
  this.status = "failed";
  this.error = error;
  this.completedAt = new Date();
  return this.save();
};

// Method to retry job
analysisJobSchema.methods.retryJob = function () {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1;
    this.status = "pending";
    this.progress = 0;
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
    return this.save();
  }
  throw new Error("Max retries exceeded");
};

// Method to add attempt
analysisJobSchema.methods.addAttempt = function (attemptData) {
  this.attempts.push({
    attempt: this.retryCount + 1,
    ...attemptData,
  });
  return this.save();
};

// Static method to get pending jobs
analysisJobSchema.statics.getPendingJobs = function () {
  return this.find({ status: "pending" }).sort({ priority: -1, createdAt: 1 });
};

// Static method to get jobs by status
analysisJobSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate("caseId", "caseNumber")
    .populate("imageId", "fileName");
};

// Static method to get failed jobs
analysisJobSchema.statics.getFailedJobs = function () {
  return this.find({ status: "failed" }).populate("caseId", "caseNumber");
};

// Static method to get jobs by case
analysisJobSchema.statics.getByCase = function (caseId) {
  return this.find({ caseId }).sort({ createdAt: -1 });
};

// Static method to get job statistics
analysisJobSchema.statics.getJobStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ]);
};

module.exports = mongoose.model("AnalysisJob", analysisJobSchema);
