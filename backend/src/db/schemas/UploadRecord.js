const mongoose = require("mongoose");

const uploadRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  fileKey: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  documentType: {
    type: String,
    enum: ["user-uploaded", "ai-analysis-report"],
    default: "user-uploaded",
  },
  fileSize: Number,
  contentType: String,
  uploadId: String, // For tracking the upload session
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  errorMessage: String,
  metadata: {
    patientId: String,
    uploadedBy: String,
    originalName: String,
  },
});

// Index for efficient queries
uploadRecordSchema.index({ patientId: 1, createdAt: -1 });
uploadRecordSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadRecordSchema.index({ status: 1 });

module.exports = mongoose.model("UploadRecord", uploadRecordSchema);
