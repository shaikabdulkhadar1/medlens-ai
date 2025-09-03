const mongoose = require("mongoose");
require("dotenv").config();

// Import the Patient model
const Patient = require("../db/schemas/Patient");

// Test data for a comprehensive patient
const testPatientData = {
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1990-05-15"),
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
    relationship: "Spouse",
    phone: "+1-555-0124",
    email: "jane.doe@email.com",
  },
  insuranceInfo: {
    provider: "Blue Cross Blue Shield",
    policyNumber: "BCBS123456",
    groupNumber: "GRP789",
    effectiveDate: new Date("2023-01-01"),
    expiryDate: new Date("2023-12-31"),
    coverageType: "family",
    deductible: "$1000",
    copay: "$25",
  },
  vitalSigns: {
    bloodPressure: "120/80",
    heartRate: "72",
    temperature: "98.6",
    weight: "70 kg",
    height: "175 cm",
    bmi: "22.9",
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
  allergies: ["Penicillin", "Shellfish"],
  medications: [
    {
      name: "Vitamin D",
      dosage: "1000 IU",
      frequency: "Daily",
      startDate: new Date("2023-01-01"),
      prescribedBy: "Dr. Smith",
      notes: "For bone health",
    },
  ],
  surgicalHistory: [
    {
      procedure: "Appendectomy",
      date: new Date("2015-03-20"),
      hospital: "City General Hospital",
      surgeon: "Dr. Johnson",
      notes: "Laparoscopic procedure, recovery was smooth",
    },
  ],
  familyHistory: [
    {
      condition: "Hypertension",
      relationship: "Father",
      ageOfOnset: "55",
      notes: "Controlled with medication",
    },
  ],
  lifestyleInfo: {
    smokingStatus: "Never smoked",
    alcoholConsumption: "Occasional",
    exerciseFrequency: "3-4 times per week",
    dietRestrictions: ["Gluten-free"],
    stressLevel: "Low",
  },
  frontDeskNotes: {
    initialDiagnosis: "Annual checkup",
    symptoms: ["None"],
    observations: "Patient appears healthy",
    chiefComplaint: "Routine physical examination",
    presentIllness: "No current health issues",
  },
  status: "active",
  notes: "Patient is in good health with no immediate concerns",
};

async function testPatientAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing test patients
    await Patient.deleteMany({ firstName: "John", lastName: "Doe" });
    console.log("🧹 Cleared existing test patients");

    // Create a new patient
    const patient = new Patient(testPatientData);
    await patient.save();
    console.log("✅ Test patient created successfully");
    console.log("📋 Patient ID:", patient._id);
    console.log("🆔 Patient ID:", patient.patientId);

    // Test finding the patient
    const foundPatient = await Patient.findById(patient._id);
    console.log(
      "✅ Patient found by ID:",
      foundPatient.firstName,
      foundPatient.lastName
    );

    // Test updating the patient
    const updateData = {
      vitalSigns: {
        ...foundPatient.vitalSigns,
        bloodPressure: "118/78",
        heartRate: "70",
      },
      notes: "Updated during test - blood pressure improved",
    };

    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      updateData,
      { new: true, runValidators: true }
    );
    console.log("✅ Patient updated successfully");
    console.log(
      "📊 New blood pressure:",
      updatedPatient.vitalSigns.bloodPressure
    );

    // Test adding a document
    const documentData = {
      fileName: "test-document.pdf",
      fileType: "PDF",
      size: 1024000,
      category: "Medical Records",
      url: "https://example.com/test-document.pdf",
    };

    const patientWithDoc = await Patient.findByIdAndUpdate(
      patient._id,
      { $push: { uploadedDocuments: documentData } },
      { new: true }
    );
    console.log("✅ Document added successfully");
    console.log("📄 Total documents:", patientWithDoc.uploadedDocuments.length);

    // Test adding an AI analysis report
    const aiReportData = {
      reportType: "Chest X-Ray Analysis",
      status: "completed",
      summary: "Normal chest X-ray with no abnormalities detected",
      findings:
        "Clear lung fields, normal cardiac silhouette, no evidence of pneumonia or other pathology",
      recommendations: "No further imaging required at this time",
      modelUsed: "MedLens AI v2.1",
      confidence: 95.8,
    };

    const patientWithAI = await Patient.findByIdAndUpdate(
      patient._id,
      { $push: { aiAnalysisReports: aiReportData } },
      { new: true }
    );
    console.log("✅ AI report added successfully");
    console.log("🤖 Total AI reports:", patientWithAI.aiAnalysisReports.length);

    // Test adding a lab result
    const labData = {
      testName: "Complete Blood Count",
      testDate: new Date(),
      result: "Normal",
      normalRange: "Within normal limits",
      unit: "N/A",
      status: "Normal",
      notes: "All parameters within normal range",
    };

    const patientWithLab = await Patient.findByIdAndUpdate(
      patient._id,
      { $push: { labResults: labData } },
      { new: true }
    );
    console.log("✅ Lab result added successfully");
    console.log("🔬 Total lab results:", patientWithLab.labResults.length);

    // Test patient statistics
    const totalPatients = await Patient.countDocuments();
    const activePatients = await Patient.countDocuments({ status: "active" });
    console.log("📊 Total patients in database:", totalPatients);
    console.log("✅ Active patients:", activePatients);

    // Test search functionality
    const searchResults = await Patient.find({
      $or: [
        { firstName: { $regex: "John", $options: "i" } },
        { lastName: { $regex: "Doe", $options: "i" } },
      ],
    });
    console.log("🔍 Search results found:", searchResults.length);

    console.log("\n🎉 All tests completed successfully!");
    console.log("📋 Test patient details:");
    console.log("   - Name:", patient.firstName, patient.lastName);
    console.log("   - Patient ID:", patient.patientId);
    console.log("   - Status:", patient.status);
    console.log("   - Documents:", patientWithLab.uploadedDocuments.length);
    console.log("   - AI Reports:", patientWithLab.aiAnalysisReports.length);
    console.log("   - Lab Results:", patientWithLab.labResults.length);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Run the test
testPatientAPI();
