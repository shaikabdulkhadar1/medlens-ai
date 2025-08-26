const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      required: [true, "Case number is required"],
      unique: true,
      trim: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned doctor is required"],
    },
    assignedRadiologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "in_progress", "completed", "reviewed", "archived"],
      default: "pending",
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    caseType: {
      type: String,
      required: [true, "Case type is required"],
      enum: ["xray", "ct_scan", "mri", "ultrasound", "pathology", "other"],
    },
    bodyPart: {
      type: String,
      required: [true, "Body part is required"],
      trim: true,
    },
    clinicalHistory: {
      type: String,
      required: [true, "Clinical history is required"],
      maxlength: [2000, "Clinical history cannot exceed 2000 characters"],
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    diagnosis: {
      type: String,
      maxlength: [1000, "Diagnosis cannot exceed 1000 characters"],
    },
    findings: {
      type: String,
      maxlength: [2000, "Findings cannot exceed 2000 characters"],
    },
    recommendations: {
      type: String,
      maxlength: [1000, "Recommendations cannot exceed 1000 characters"],
    },
    aiAnalysis: {
      confidence: {
        type: Number,
        min: 0,
        max: 100,
      },
      detectedConditions: [
        {
          condition: String,
          confidence: Number,
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
        },
      ],
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      processingTime: Number,
      model: String,
      version: String,
      processedAt: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    scheduledDate: Date,
    completedAt: Date,
    reviewedAt: Date,
    notes: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
      },
    ],
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for case duration
caseSchema.virtual("duration").get(function () {
  if (!this.createdAt || !this.completedAt) return null;
  return this.completedAt - this.createdAt;
});

// Virtual for case age (days since creation)
caseSchema.virtual("age").get(function () {
  if (!this.createdAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes
caseSchema.index({ caseNumber: 1 }, { unique: true });
caseSchema.index({ patientId: 1 });
caseSchema.index({ assignedDoctor: 1 });
caseSchema.index({ assignedRadiologist: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ priority: 1 });
caseSchema.index({ caseType: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ scheduledDate: 1 });
caseSchema.index({ completedAt: -1 });

// Compound indexes for common queries
caseSchema.index({ status: 1, priority: 1 });
caseSchema.index({ assignedDoctor: 1, status: 1 });
caseSchema.index({ caseType: 1, bodyPart: 1 });

// Pre-save middleware to generate case number
caseSchema.pre("save", function (next) {
  if (!this.caseNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    this.caseNumber = `CASE${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Method to update case status
caseSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  if (newStatus === "completed") {
    this.completedAt = new Date();
  } else if (newStatus === "reviewed") {
    this.reviewedAt = new Date();
  }
  return this.save();
};

// Method to add note
caseSchema.methods.addNote = function (content, userId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date(),
  });
  return this.save();
};

// Static method to get cases by status
caseSchema.statics.getByStatus = function (status) {
  return this.find({ status })
    .populate("patientId", "fullName patientId")
    .populate("assignedDoctor", "fullName");
};

// Static method to get urgent cases
caseSchema.statics.getUrgentCases = function () {
  return this.find({
    priority: "urgent",
    status: { $in: ["pending", "in_progress"] },
  })
    .populate("patientId", "fullName patientId")
    .populate("assignedDoctor", "fullName");
};

module.exports = mongoose.model("Case", caseSchema);
