const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: [true, "Case ID is required"],
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      enum: ["image", "pdf", "dicom"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    storageKey: {
      type: String,
      required: [true, "Storage key is required"],
      unique: true,
    },
    storageUrl: {
      type: String,
      required: [true, "Storage URL is required"],
    },
    presignedUrl: {
      type: String,
      expiresAt: Date,
    },
    metadata: {
      width: {
        type: Number,
        min: [0, "Width cannot be negative"],
      },
      height: {
        type: Number,
        min: [0, "Height cannot be negative"],
      },
      modality: {
        type: String,
        trim: true,
      },
      seriesNumber: {
        type: Number,
      },
      imageNumber: {
        type: Number,
      },
      acquisitionDate: {
        type: Date,
      },
      patientPosition: {
        type: String,
        trim: true,
      },
      imageComments: {
        type: String,
        maxlength: [500, "Image comments cannot exceed 500 characters"],
      },
    },
    aiAnalysis: {
      model: {
        type: String,
        trim: true,
      },
      version: {
        type: String,
        trim: true,
      },
      results: {
        type: mongoose.Schema.Types.Mixed,
      },
      confidence: {
        type: Number,
        min: [0, "Confidence cannot be negative"],
        max: [100, "Confidence cannot exceed 100"],
      },
      processingTime: {
        type: Number,
        min: [0, "Processing time cannot be negative"],
      },
      processedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
      },
      error: {
        type: String,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    annotations: [
      {
        type: {
          type: String,
          enum: ["rectangle", "circle", "polygon", "line", "text"],
          required: true,
        },
        coordinates: {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
          points: [
            {
              x: Number,
              y: Number,
            },
          ],
        },
        label: {
          type: String,
          trim: true,
          required: true,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
        },
        color: {
          type: String,
          default: "#FF0000",
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    isProcessed: {
      type: Boolean,
      default: false,
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

// Virtual for file extension
imageSchema.virtual("fileExtension").get(function () {
  return this.originalName.split(".").pop().toLowerCase();
});

// Virtual for file size in MB
imageSchema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for image dimensions
imageSchema.virtual("dimensions").get(function () {
  if (this.metadata.width && this.metadata.height) {
    return `${this.metadata.width}x${this.metadata.height}`;
  }
  return null;
});

// Indexes
imageSchema.index({ caseId: 1 });
imageSchema.index({ storageKey: 1 }, { unique: true });
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ uploadedAt: -1 });
imageSchema.index({ fileType: 1 });
imageSchema.index({ isProcessed: 1 });
imageSchema.index({ "aiAnalysis.status": 1 });

// Compound indexes
imageSchema.index({ caseId: 1, fileType: 1 });
imageSchema.index({ uploadedBy: 1, uploadedAt: -1 });

// Pre-save middleware to generate storage key if not provided
imageSchema.pre("save", function (next) {
  if (!this.storageKey) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = this.originalName.split(".").pop();
    this.storageKey = `images/${timestamp}_${random}.${extension}`;
  }
  next();
});

// Method to increment access count
imageSchema.methods.incrementAccess = function () {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Method to add annotation
imageSchema.methods.addAnnotation = function (annotationData, userId) {
  this.annotations.push({
    ...annotationData,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return this.save();
};

// Method to update AI analysis
imageSchema.methods.updateAIAnalysis = function (analysisData) {
  this.aiAnalysis = {
    ...this.aiAnalysis,
    ...analysisData,
    processedAt: new Date(),
    status: "completed",
  };
  this.isProcessed = true;
  return this.save();
};

// Static method to get images by case
imageSchema.statics.getByCase = function (caseId) {
  return this.find({ caseId }).populate("uploadedBy", "fullName");
};

// Static method to get unprocessed images
imageSchema.statics.getUnprocessed = function () {
  return this.find({ isProcessed: false });
};

// Static method to get images by AI status
imageSchema.statics.getByAIStatus = function (status) {
  return this.find({ "aiAnalysis.status": status });
};

module.exports = mongoose.model("Image", imageSchema);
