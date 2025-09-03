const mongoose = require("mongoose");
const { Patient, User } = require("../db");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medlens"
    );
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Create test patient
const createTestPatient = async () => {
  try {
    console.log("\n🧪 Creating Test Patient...\n");

    // Check if patient already exists
    let patient = await Patient.findOne({ firstName: "John", lastName: "Doe" });
    if (patient) {
      console.log(
        `✅ Patient already exists: ${patient.firstName} ${patient.lastName}`
      );
      return patient;
    }

    // Create new test patient
    const newPatient = new Patient({
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1985-03-15",
      gender: "male",
      bloodType: "O+",
      maritalStatus: "married",
      occupation: "Software Engineer",
      contactInfo: {
        phone: "+1-555-0123",
        email: "john.doe@email.com",
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      },
      emergencyContact: {
        name: "Jane Doe",
        relationship: "spouse",
        phone: "+1-555-0124",
        email: "jane.doe@email.com",
      },
      insuranceInfo: {
        provider: "Blue Cross Blue Shield",
        policyNumber: "BCBS123456",
        groupNumber: "GRP789",
        coverageType: "family",
        effectiveDate: "2024-01-01",
        expiryDate: "2024-12-31",
        deductible: "$500",
        copay: "$25",
      },
      vitalSigns: {
        bloodPressure: "120/80",
        heartRate: "72",
        temperature: "98.6°F",
        weight: "75 kg",
        height: "175 cm",
        bmi: "24.5",
        oxygenSaturation: "98%",
        respiratoryRate: "16",
      },
      medicalConditions: {
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        asthma: false,
        cancer: false,
        kidneyDisease: false,
        liverDisease: false,
        thyroidDisorder: false,
      },
      medications: [],
      surgicalHistory: [],
      familyHistory: [],
      lifestyleInfo: {
        smoking: false,
        alcohol: "occasional",
        exercise: "3-4 times per week",
        diet: "balanced",
      },
      allergies: ["penicillin"],
      frontDeskNotes: {
        chiefComplaint: "Annual checkup",
        presentIllness: "Patient is healthy with no current complaints",
      },
      uploadedDocuments: [],
      aiAnalysisReports: [],
      labResults: [],
      assignedDoctor: null,
      createdBy: null,
      status: "active",
      isActive: true,
      nextAppointment: null,
      notes: "Test patient for development purposes",
      lastVisited: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate patient ID
    await newPatient.save();
    console.log(
      `✅ Created test patient: ${newPatient.firstName} ${newPatient.lastName}`
    );
    console.log(`   Patient ID: ${newPatient._id}`);
    console.log(`   Patient ID (string): ${newPatient.patientId}`);

    return newPatient;
  } catch (error) {
    console.error("❌ Error creating test patient:", error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await createTestPatient();
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
};

// Run if this file is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { createTestPatient };
