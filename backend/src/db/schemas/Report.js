const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: [true, "Case ID is required"],
    },
    reportNumber: {
      type: String,
      required: [true, "Report number is required"],
      unique: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: [true, "Report type is required"],
      enum: ["preliminary", "final", "followup", "amendment"],
    },
    content: {
      clinicalHistory: {
        type: String,
        required: [true, "Clinical history is required"],
        maxlength: [2000, "Clinical history cannot exceed 2000 characters"],
      },
      technique: {
        type: String,
        maxlength: [
          1000,
          "Technique description cannot exceed 1000 characters",
        ],
      },
      findings: {
        type: String,
        required: [true, "Findings are required"],
        maxlength: [3000, "Findings cannot exceed 3000 characters"],
      },
      impression: {
        type: String,
        required: [true, "Impression is required"],
        maxlength: [2000, "Impression cannot exceed 2000 characters"],
      },
      recommendations: {
        type: String,
        maxlength: [1000, "Recommendations cannot exceed 1000 characters"],
      },
      measurements: [
        {
          name: String,
          value: Number,
          unit: String,
          location: String,
        },
      ],
      comparisons: [
        {
          study: String,
          date: Date,
          findings: String,
        },
      ],
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      min: [0, "AI confidence cannot be negative"],
      max: [100, "AI confidence cannot exceed 100"],
    },
    aiModel: {
      type: String,
      trim: true,
    },
    aiVersion: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Report generator is required"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["draft", "reviewed", "approved", "finalized", "amended"],
      default: "draft",
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    pdfGeneratedAt: {
      type: Date,
    },
    template: {
      type: String,
      default: "standard",
      trim: true,
    },
    language: {
      type: String,
      default: "en",
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
    revisions: [
      {
        version: Number,
        changes: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        previousContent: mongoose.Schema.Types.Mixed,
      },
    ],
    signatures: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
        signedAt: {
          type: Date,
          default: Date.now,
        },
        signatureType: {
          type: String,
          enum: ["digital", "electronic", "manual"],
          default: "digital",
        },
      },
    ],
    finalizedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for report age
reportSchema.virtual("age").get(function () {
  if (!this.createdAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
reportSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for can be edited
reportSchema.virtual("canEdit").get(function () {
  return this.status === "draft" || this.status === "reviewed";
});

// Indexes
reportSchema.index({ reportNumber: 1 }, { unique: true });
reportSchema.index({ caseId: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ reviewedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ finalizedAt: -1 });
reportSchema.index({ aiGenerated: 1 });

// Compound indexes
reportSchema.index({ caseId: 1, status: 1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, reportType: 1 });

// Pre-save middleware to generate report number
reportSchema.pre("save", function (next) {
  if (!this.reportNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    this.reportNumber = `RPT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Method to finalize report
reportSchema.methods.finalize = function (userId) {
  this.status = "finalized";
  this.finalizedAt = new Date();
  this.signatures.push({
    user: userId,
    role: "finalizer",
    signedAt: new Date(),
    signatureType: "digital",
  });
  return this.save();
};

// Method to approve report
reportSchema.methods.approve = function (userId) {
  this.status = "approved";
  this.approvedBy = userId;
  this.signatures.push({
    user: userId,
    role: "approver",
    signedAt: new Date(),
    signatureType: "digital",
  });
  return this.save();
};

// Method to review report
reportSchema.methods.review = function (userId) {
  this.status = "reviewed";
  this.reviewedBy = userId;
  this.signatures.push({
    user: userId,
    role: "reviewer",
    signedAt: new Date(),
    signatureType: "digital",
  });
  return this.save();
};

// Method to add revision
reportSchema.methods.addRevision = function (changes, userId) {
  const currentVersion = this.revisions.length + 1;
  this.revisions.push({
    version: currentVersion,
    changes,
    changedBy: userId,
    changedAt: new Date(),
    previousContent: {
      content: this.content,
      status: this.status,
    },
  });
  return this.save();
};

// Method to increment access count
reportSchema.methods.incrementAccess = function () {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to get reports by case
reportSchema.statics.getByCase = function (caseId) {
  return this.find({ caseId }).sort({ createdAt: -1 });
};

// Static method to get finalized reports
reportSchema.statics.getFinalized = function () {
  return this.find({ status: "finalized" }).populate("caseId", "caseNumber");
};

// Static method to get reports by status
reportSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate("caseId", "caseNumber")
    .populate("generatedBy", "fullName");
};

// Static method to get AI-generated reports
reportSchema.statics.getAIGenerated = function () {
  return this.find({ aiGenerated: true }).populate("caseId", "caseNumber");
};

// Static method to get report statistics
reportSchema.statics.getReportStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgConfidence: { $avg: "$aiConfidence" },
      },
    },
  ]);
};

module.exports = mongoose.model("Report", reportSchema);
