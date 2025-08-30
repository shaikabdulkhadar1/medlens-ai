const mongoose = require("mongoose");

const timelineSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    title: {
      type: String,
      required: [true, "Timeline title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Timeline description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      required: [true, "Timeline type is required"],
      enum: [
        "consultation",
        "lab_review",
        "follow_up",
        "registration",
        "case_closed",
        "other",
      ],
      default: "other",
    },
    date: {
      type: Date,
      required: [true, "Timeline date is required"],
      default: Date.now,
    },
    time: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    consultedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    consultationSummary: {
      type: String,
      maxlength: [2000, "Consultation summary cannot exceed 2000 characters"],
    },
    documentsCount: {
      type: Number,
      default: 0,
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

// Virtual for formatted date
timelineSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Indexes
timelineSchema.index({ patientId: 1, date: -1 });
timelineSchema.index({ patientId: 1, type: 1 });
timelineSchema.index({ consultedBy: 1 });
timelineSchema.index({ isActive: 1 });

module.exports = mongoose.model("Timeline", timelineSchema);
