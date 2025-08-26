const mongoose = require("mongoose");

const aiModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Model name is required"],
      unique: true,
      trim: true,
    },
    version: {
      type: String,
      required: [true, "Model version is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Model type is required"],
      enum: [
        "image_classification",
        "object_detection",
        "text_summarization",
        "segmentation",
        "vitals_analysis",
      ],
    },
    provider: {
      type: String,
      required: [true, "Provider is required"],
      enum: ["huggingface", "custom", "openai", "azure", "aws"],
    },
    endpoint: {
      type: String,
      trim: true,
    },
    apiKey: {
      type: String,
      trim: true,
      select: false, // Don't include in queries by default
    },
    parameters: {
      maxTokens: Number,
      temperature: Number,
      topP: Number,
      frequencyPenalty: Number,
      presencePenalty: Number,
      modelSize: String,
      inputFormat: String,
      outputFormat: String,
    },
    performance: {
      accuracy: {
        type: Number,
        min: [0, "Accuracy cannot be negative"],
        max: [100, "Accuracy cannot exceed 100"],
      },
      precision: {
        type: Number,
        min: [0, "Precision cannot be negative"],
        max: [1, "Precision cannot exceed 1"],
      },
      recall: {
        type: Number,
        min: [0, "Recall cannot be negative"],
        max: [1, "Recall cannot exceed 1"],
      },
      f1Score: {
        type: Number,
        min: [0, "F1 score cannot be negative"],
        max: [1, "F1 score cannot exceed 1"],
      },
      latency: {
        type: Number,
        min: [0, "Latency cannot be negative"],
      },
      throughput: {
        type: Number,
        min: [0, "Throughput cannot be negative"],
      },
    },
    training: {
      dataset: String,
      trainingDate: Date,
      trainingDuration: Number,
      epochs: Number,
      batchSize: Number,
      learningRate: Number,
      validationSplit: Number,
    },
    capabilities: [
      {
        type: String,
        enum: [
          "medical_imaging",
          "text_analysis",
          "vitals_processing",
          "anomaly_detection",
          "multi_modal",
        ],
      },
    ],
    supportedFormats: [
      {
        input: [String],
        output: [String],
      },
    ],
    limitations: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    usage: {
      totalRequests: {
        type: Number,
        default: 0,
      },
      successfulRequests: {
        type: Number,
        default: 0,
      },
      failedRequests: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
      costPerRequest: {
        type: Number,
        default: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
      },
    },
    monitoring: {
      healthCheck: {
        type: String,
        enum: ["healthy", "degraded", "unhealthy"],
        default: "healthy",
      },
      lastHealthCheck: Date,
      uptime: {
        type: Number,
        default: 100,
      },
      errorRate: {
        type: Number,
        default: 0,
      },
    },
    documentation: {
      description: String,
      usage: String,
      examples: [String],
      apiDocs: String,
      changelog: [
        {
          version: String,
          date: Date,
          changes: [String],
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for success rate
aiModelSchema.virtual("successRate").get(function () {
  if (this.usage.totalRequests === 0) return 0;
  return (this.usage.successfulRequests / this.usage.totalRequests) * 100;
});

// Virtual for failure rate
aiModelSchema.virtual("failureRate").get(function () {
  if (this.usage.totalRequests === 0) return 0;
  return (this.usage.failedRequests / this.usage.totalRequests) * 100;
});

// Virtual for full model identifier
aiModelSchema.virtual("fullName").get(function () {
  return `${this.name}-${this.version}`;
});

// Indexes
aiModelSchema.index({ name: 1 }, { unique: true });
aiModelSchema.index({ type: 1 });
aiModelSchema.index({ provider: 1 });
aiModelSchema.index({ isActive: 1 });
aiModelSchema.index({ isDefault: 1 });
aiModelSchema.index({ "monitoring.healthCheck": 1 });

// Compound indexes
aiModelSchema.index({ type: 1, isActive: 1 });
aiModelSchema.index({ provider: 1, isActive: 1 });

// Pre-save middleware to ensure only one default model per type
aiModelSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      { type: this.type, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Method to increment usage
aiModelSchema.methods.incrementUsage = function (
  success = true,
  responseTime = 0,
  cost = 0
) {
  this.usage.totalRequests += 1;
  if (success) {
    this.usage.successfulRequests += 1;
  } else {
    this.usage.failedRequests += 1;
  }

  // Update average response time
  const totalTime =
    this.usage.averageResponseTime * (this.usage.totalRequests - 1) +
    responseTime;
  this.usage.averageResponseTime = totalTime / this.usage.totalRequests;

  // Update costs
  this.usage.totalCost += cost;
  this.usage.lastUsed = new Date();

  return this.save();
};

// Method to update performance metrics
aiModelSchema.methods.updatePerformance = function (metrics) {
  this.performance = { ...this.performance, ...metrics };
  return this.save();
};

// Method to update health status
aiModelSchema.methods.updateHealth = function (status, errorRate = null) {
  this.monitoring.healthCheck = status;
  this.monitoring.lastHealthCheck = new Date();
  if (errorRate !== null) {
    this.monitoring.errorRate = errorRate;
  }
  return this.save();
};

// Static method to get active models
aiModelSchema.statics.getActive = function () {
  return this.find({ isActive: true });
};

// Static method to get models by type
aiModelSchema.statics.getByType = function (type) {
  return this.find({ type, isActive: true });
};

// Static method to get default model for type
aiModelSchema.statics.getDefault = function (type) {
  return this.findOne({ type, isDefault: true, isActive: true });
};

// Static method to get healthy models
aiModelSchema.statics.getHealthy = function () {
  return this.find({
    isActive: true,
    "monitoring.healthCheck": "healthy",
  });
};

// Static method to get model statistics
aiModelSchema.statics.getModelStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ["$isActive", 1, 0] },
        },
        avgAccuracy: { $avg: "$performance.accuracy" },
        avgLatency: { $avg: "$usage.averageResponseTime" },
        totalRequests: { $sum: "$usage.totalRequests" },
      },
    },
  ]);
};

// Static method to get usage statistics
aiModelSchema.statics.getUsageStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: "$usage.totalRequests" },
        totalSuccessful: { $sum: "$usage.successfulRequests" },
        totalFailed: { $sum: "$usage.failedRequests" },
        totalCost: { $sum: "$usage.totalCost" },
        avgResponseTime: { $avg: "$usage.averageResponseTime" },
      },
    },
  ]);
};

module.exports = mongoose.model("AIModel", aiModelSchema);
