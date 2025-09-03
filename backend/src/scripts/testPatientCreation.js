const mongoose = require("mongoose");
const { User } = require("../db");

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

// Test patient creation data
const testPatientData = {
  firstName: "Test",
  lastName: "Patient",
  dateOfBirth: "1990-01-01",
  gender: "male",
  contactInfo: {
    phone: "+1-555-0001",
    email: "test.patient@email.com",
    address: {
      street: "456 Test Street",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      country: "USA",
    },
  },
  emergencyContact: {
    name: "Test Emergency",
    relationship: "spouse",
    phone: "+1-555-0002",
    email: "emergency@email.com",
  },
  vitalSigns: {
    bloodPressure: "120/80",
    heartRate: "72",
    temperature: "98.6",
    weight: "70",
    height: "170",
    bmi: "24.2",
  },
  medicalConditions: {
    diabetes: false,
    hypertension: false,
    heartDisease: false,
    asthma: false,
  },
  allergies: ["none"],
  initialDiagnosis: "Routine checkup",
  symptoms: ["General consultation"],
  assignedSeniorDoctorId: null,
};

// Test the patient creation logic
const testPatientCreation = async () => {
  try {
    console.log("\n🧪 Testing Patient Creation Logic...\n");

    // Simulate the validation logic from the backend
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      contactInfo,
      emergencyContact,
      initialDiagnosis,
      symptoms,
      assignedSeniorDoctorId,
    } = testPatientData;

    console.log("📋 Input data validation:");
    console.log(`   First Name: ${firstName} ✅`);
    console.log(`   Last Name: ${lastName} ✅`);
    console.log(`   Date of Birth: ${dateOfBirth} ✅`);
    console.log(`   Gender: ${gender} ✅`);

    // Test date parsing
    let parsedDateOfBirth = dateOfBirth;
    if (typeof dateOfBirth === "string") {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (isNaN(parsedDateOfBirth.getTime())) {
        console.log("❌ Invalid date of birth format");
        return;
      }
      console.log(`   Parsed Date: ${parsedDateOfBirth.toISOString()} ✅`);
    }

    // Test contact info validation
    if (!contactInfo?.phone || !contactInfo?.email) {
      console.log("❌ Phone and email are required");
      return;
    }
    console.log(`   Phone: ${contactInfo.phone} ✅`);
    console.log(`   Email: ${contactInfo.email} ✅`);

    // Test address validation
    if (
      !contactInfo?.address?.street ||
      !contactInfo?.address?.city ||
      !contactInfo?.address?.state ||
      !contactInfo?.address?.zipCode ||
      !contactInfo?.address?.country
    ) {
      console.log("❌ Complete address is required");
      return;
    }
    console.log("   Address: Complete ✅");

    // Test emergency contact validation
    if (
      !emergencyContact?.name ||
      !emergencyContact?.relationship ||
      !emergencyContact?.phone ||
      !emergencyContact?.email
    ) {
      console.log("❌ Complete emergency contact is required");
      return;
    }
    console.log("   Emergency Contact: Complete ✅");

    // Test symptoms validation
    if (!symptoms || symptoms.length === 0) {
      testPatientData.symptoms = ["General consultation"];
      console.log("   Symptoms: Using default ✅");
    } else {
      console.log(`   Symptoms: ${symptoms.join(", ")} ✅`);
    }

    // Test initial diagnosis validation
    if (!initialDiagnosis) {
      console.log("❌ Initial diagnosis is required");
      return;
    }
    console.log(`   Initial Diagnosis: ${initialDiagnosis} ✅`);

    // Test vitals validation (optional)
    if (testPatientData.vitalSigns) {
      const vitals = testPatientData.vitalSigns;
      if (vitals.weight && vitals.height && !vitals.bmi) {
        const weight = parseFloat(vitals.weight);
        const height = parseFloat(vitals.height) / 100;
        if (weight && height && height > 0) {
          testPatientData.vitalSigns.bmi = (weight / (height * height)).toFixed(
            1
          );
          console.log(
            `   Auto-calculated BMI: ${testPatientData.vitalSigns.bmi} ✅`
          );
        }
      }
      console.log("   Vital Signs: Provided ✅");
    } else {
      console.log("   Vital Signs: Not provided (optional) ✅");
    }

    // Test allergies validation (optional)
    if (!testPatientData.allergies) {
      testPatientData.allergies = [];
      console.log("   Allergies: Using empty array ✅");
    } else {
      console.log(`   Allergies: ${testPatientData.allergies.join(", ")} ✅`);
    }

    console.log("\n✅ All validations passed!");
    console.log("📝 Patient data is ready for creation");

    // Show final patient object structure
    const finalPatientData = {
      firstName,
      lastName,
      dateOfBirth: parsedDateOfBirth,
      gender,
      contactInfo,
      emergencyContact,
      vitalSigns: testPatientData.vitalSigns,
      medicalConditions: testPatientData.medicalConditions,
      allergies: testPatientData.allergies,
      initialDiagnosis,
      symptoms: testPatientData.symptoms,
      assignedSeniorDoctorId,
    };

    console.log("\n🔍 Final patient data structure:");
    console.log(JSON.stringify(finalPatientData, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the tests
const runTests = async () => {
  await connectDB();
  await testPatientCreation();
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
};

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testPatientCreation };
