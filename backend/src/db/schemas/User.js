const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
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
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["admin", "senior_doctor", "consulting_doctor"],
      default: "consulting_doctor",
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [100, "Specialization cannot exceed 100 characters"],
    },
    licenseNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    hospital: {
      type: String,
      trim: true,
      maxlength: [100, "Hospital name cannot exceed 100 characters"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Hierarchical relationships
    assignedSeniorDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Only for consulting doctors - references their senior doctor
    },
    assignedConsultingDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // Only for senior doctors - references their consulting doctors
      },
    ],
    // Patient assignments (for consulting doctors)
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ licenseNumber: 1 });
userSchema.index({ assignedSeniorDoctor: 1 });
userSchema.index({ assignedConsultingDoctors: 1 });
userSchema.index({ assignedPatients: 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
userSchema.methods.toPublicJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
