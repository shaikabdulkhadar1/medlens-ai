const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed", "separated"],
    },
    occupation: String,
    contactInfo: {
      phone: String,
      email: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      effectiveDate: Date,
      expiryDate: Date,
      coverageType: {
        type: String,
        enum: ["individual", "family", "group", "medicare", "medicaid"],
      },
      deductible: String,
      copay: String,
    },
    vitalSigns: {
      bloodPressure: String,
      heartRate: String,
      temperature: String,
      weight: String,
      height: String,
      bmi: String,
      oxygenSaturation: String,
      respiratoryRate: String,
    },
    medicalConditions: {
      diabetes: { type: Boolean, default: false },
      hypertension: { type: Boolean, default: false },
      heartDisease: { type: Boolean, default: false },
      asthma: { type: Boolean, default: false },
      cancer: { type: Boolean, default: false },
      kidneyDisease: { type: Boolean, default: false },
      liverDisease: { type: Boolean, default: false },
      thyroidDisorder: { type: Boolean, default: false },
    },
    allergies: [String],
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        prescribedBy: String,
        notes: String,
      },
    ],
    surgicalHistory: [
      {
        procedure: { type: String, required: true },
        date: { type: Date, required: true },
        hospital: { type: String, required: true },
        surgeon: { type: String, required: true },
        notes: String,
      },
    ],
    familyHistory: [
      {
        condition: { type: String, required: true },
        relationship: { type: String, required: true },
        ageOfOnset: String,
        notes: String,
      },
    ],
    lifestyleInfo: {
      smokingStatus: String,
      alcoholConsumption: String,
      exerciseFrequency: String,
      dietRestrictions: [String],
      stressLevel: String,
    },
    frontDeskNotes: {
      initialDiagnosis: String,
      symptoms: [String],
      observations: String,
      chiefComplaint: String,
      presentIllness: String,
    },
    uploadedDocuments: [
      {
        fileName: { type: String, required: true },
        fileType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadDate: { type: Date, default: Date.now },
        category: { type: String, required: true },
        url: String,
      },
    ],
    aiAnalysisReports: [
      {
        reportType: { type: String, required: true },
        status: {
          type: String,
          enum: ["completed", "processing", "failed"],
          default: "processing",
        },
        analysisDate: { type: Date, default: Date.now },
        summary: String,
        findings: String,
        recommendations: String,
        modelUsed: String,
        confidence: Number,
      },
    ],
    labResults: [
      {
        testName: { type: String, required: true },
        testDate: { type: Date, required: true },
        result: { type: String, required: true },
        normalRange: { type: String, required: true },
        unit: { type: String, required: true },
        status: { type: String, required: true },
        notes: String,
      },
    ],
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discharged"],
      default: "active",
    },
    nextAppointment: Date,
    notes: String,
    lastVisited: Date,
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
  }
);

// Pre-save middleware to generate patient ID if not provided
patientSchema.pre("save", function (next) {
  if (!this.patientId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    this.patientId = `PAT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Index for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Patient", patientSchema);
