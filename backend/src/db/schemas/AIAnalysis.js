const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UploadRecord",
      required: [true, "Document ID is required"],
    },
    analysisId: {
      type: String,
      required: [true, "Analysis ID is required"],
      unique: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    analysisType: {
      type: String,
      required: [true, "Analysis type is required"],
      enum: [
        "document_classification",
        "text_extraction",
        "text_summarization",
        "image_classification",
        "abnormality_detection",
        "entity_extraction",
        "medical_qa",
        "vitals_analysis",
        "comprehensive_analysis",
      ],
      default: "comprehensive_analysis",
    },
    documentType: {
      type: String,
      enum: ["image", "text", "pdf", "mixed"],
    },
    contentType: {
      type: String,
      enum: [
        "medical_image",
        "lab_report",
        "consultation_note",
        "prescription",
        "discharge_summary",
        "medical_certificate",
        "other",
      ],
    },
    analysisResult: {
      // Document classification results
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },

      // Text analysis results
      extractedText: String,
      summary: String,
      keyFindings: [String],
      recommendations: [String],
      medicalEntities: [
        {
          entity: String,
          type: {
            type: String,
            enum: [
              "symptom",
              "diagnosis",
              "medication",
              "procedure",
              "body_part",
              "condition",
              "measurement",
            ],
          },
          confidence: Number,
        },
      ],

      // Image analysis results
      imageFindings: [
        {
          finding: String,
          confidence: Number,
          boundingBox: {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
          },
        },
      ],
      abnormalities: [
        {
          abnormality: String,
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          confidence: Number,
          description: String,
        },
      ],

      // Model results
      modelResults: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },

      // Final report
      finalReport: String,
      processingTime: Number,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorMessage: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: Map,
      of: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
aiAnalysisSchema.index({ patientId: 1, createdAt: -1 });
aiAnalysisSchema.index({ documentId: 1 });
aiAnalysisSchema.index({ analysisId: 1 }, { unique: true });
aiAnalysisSchema.index({ analysisType: 1 });
aiAnalysisSchema.index({ status: 1 });
aiAnalysisSchema.index({ processedBy: 1 });

// Virtual for formatted processing time
aiAnalysisSchema.virtual("formattedProcessingTime").get(function () {
  if (!this.analysisResult?.processingTime) return null;
  return `${(this.analysisResult.processingTime / 1000).toFixed(2)}s`;
});

// Virtual for analysis status badge
aiAnalysisSchema.virtual("statusBadge").get(function () {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return statusColors[this.status] || "bg-gray-100 text-gray-800";
});

module.exports = mongoose.model("AIAnalysis", aiAnalysisSchema);
