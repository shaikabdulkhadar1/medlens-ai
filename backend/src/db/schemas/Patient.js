const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, "Patient ID is required"],
      unique: true,
      trim: true,
    },
    mrn: {
      type: String,
      trim: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other"],
    },
    contactInfo: {
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      address: {
        street: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        zipCode: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          trim: true,
          default: "USA",
        },
      },
    },
    medicalHistory: {
      allergies: [
        {
          type: String,
          trim: true,
        },
      ],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          startDate: Date,
          endDate: Date,
        },
      ],
      conditions: [
        {
          name: String,
          diagnosedDate: Date,
          status: {
            type: String,
            enum: ["active", "resolved", "chronic"],
            default: "active",
          },
        },
      ],
      surgeries: [
        {
          procedure: String,
          date: Date,
          hospital: String,
          surgeon: String,
        },
      ],
    },
    insurance: {
      provider: {
        type: String,
        trim: true,
      },
      policyNumber: {
        type: String,
        trim: true,
      },
      groupNumber: {
        type: String,
        trim: true,
      },
      effectiveDate: Date,
      expiryDate: Date,
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    vitalSigns: {
      height: {
        value: Number,
        unit: {
          type: String,
          enum: ["cm", "inches"],
          default: "cm",
        },
      },
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ["kg", "lbs"],
          default: "kg",
        },
      },
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
      },
      heartRate: Number,
      temperature: Number,
      lastUpdated: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned doctor is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// Indexes
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ mrn: 1 });
patientSchema.index({ lastName: 1, firstName: 1 });
patientSchema.index({ dateOfBirth: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ assignedDoctor: 1 });

// Pre-save middleware to generate patient ID if not provided
patientSchema.pre("save", function (next) {
  if (!this.patientId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    this.patientId = `PAT${timestamp}${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Patient", patientSchema);
