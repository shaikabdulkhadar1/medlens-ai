const mongoose = require("mongoose");
const { User, Patient } = require("../db");
require("dotenv").config();

const createPatients = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the doctors
    const drMichael = await User.findOne({
      email: "consulting.doctor@medlens.com",
    });
    const drEmily = await User.findOne({ email: "new.doctor@medlens.com" });

    if (!drMichael) {
      console.log("❌ Dr. Michael Chen not found");
      return;
    }

    if (!drEmily) {
      console.log("❌ Dr. Emily Wilson not found");
      return;
    }

    console.log("✅ Found doctors:");
    console.log("   Dr. Michael Chen:", drMichael._id);
    console.log("   Dr. Emily Wilson:", drEmily._id);

    // Create Patient 1 - Assigned to Dr. Michael
    const patient1 = new Patient({
      patientId: "PAT001",
      mrn: "MRN001",
      firstName: "John",
      lastName: "Smith",
      dateOfBirth: new Date("1985-03-15"),
      gender: "male",
      contactInfo: {
        phone: "+1-555-0101",
        email: "john.smith@email.com",
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
      },
      emergencyContact: {
        name: "Sarah Smith",
        relationship: "Spouse",
        phone: "+1-555-0102",
        email: "sarah.smith@email.com",
      },
      medicalHistory: {
        allergies: ["Penicillin", "Peanuts"],
        medications: [
          {
            name: "Metformin",
            dosage: "500mg",
            frequency: "Twice daily",
            startDate: new Date("2023-01-01"),
          },
          {
            name: "Lisinopril",
            dosage: "10mg",
            frequency: "Once daily",
            startDate: new Date("2023-01-01"),
          },
        ],
        conditions: [
          {
            name: "Hypertension",
            diagnosedDate: new Date("2022-06-15"),
            status: "chronic",
          },
          {
            name: "Diabetes Type 2",
            diagnosedDate: new Date("2023-01-01"),
            status: "chronic",
          },
        ],
        surgeries: [
          {
            procedure: "Appendectomy",
            date: new Date("2010-05-20"),
            hospital: "City General Hospital",
            surgeon: "Dr. Johnson",
          },
        ],
      },
      assignedDoctor: drMichael._id,
      insurance: {
        provider: "Blue Cross Blue Shield",
        policyNumber: "BCBS123456",
        groupNumber: "GRP789",
        effectiveDate: new Date("2024-01-01"),
        expiryDate: new Date("2024-12-31"),
      },
      isActive: true,
    });

    // Create Patient 2 - Assigned to Dr. Michael
    const patient2 = new Patient({
      patientId: "PAT002",
      mrn: "MRN002",
      firstName: "Maria",
      lastName: "Garcia",
      dateOfBirth: new Date("1992-07-22"),
      gender: "female",
      contactInfo: {
        phone: "+1-555-0201",
        email: "maria.garcia@email.com",
        address: {
          street: "456 Oak Avenue",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "USA",
        },
      },
      emergencyContact: {
        name: "Carlos Garcia",
        relationship: "Brother",
        phone: "+1-555-0202",
        email: "carlos.garcia@email.com",
      },
      medicalHistory: {
        allergies: ["Latex"],
        medications: [
          {
            name: "Albuterol",
            dosage: "90mcg",
            frequency: "As needed",
            startDate: new Date("2022-03-10"),
          },
          {
            name: "Fluticasone",
            dosage: "110mcg",
            frequency: "Twice daily",
            startDate: new Date("2022-03-10"),
          },
        ],
        conditions: [
          {
            name: "Asthma",
            diagnosedDate: new Date("2022-03-10"),
            status: "chronic",
          },
        ],
        surgeries: [],
      },
      assignedDoctor: drMichael._id,
      insurance: {
        provider: "Aetna",
        policyNumber: "AET789012",
        groupNumber: "GRP456",
        effectiveDate: new Date("2024-01-01"),
        expiryDate: new Date("2024-12-31"),
      },
      isActive: true,
    });

    // Create Patient 3 - Assigned to Dr. Emily
    const patient3 = new Patient({
      patientId: "PAT003",
      mrn: "MRN003",
      firstName: "Robert",
      lastName: "Johnson",
      dateOfBirth: new Date("1978-11-08"),
      gender: "male",
      contactInfo: {
        phone: "+1-555-0301",
        email: "robert.johnson@email.com",
        address: {
          street: "789 Pine Street",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "USA",
        },
      },
      emergencyContact: {
        name: "Lisa Johnson",
        relationship: "Daughter",
        phone: "+1-555-0302",
        email: "lisa.johnson@email.com",
      },
      medicalHistory: {
        allergies: ["Sulfa drugs"],
        medications: [
          {
            name: "Atorvastatin",
            dosage: "20mg",
            frequency: "Once daily",
            startDate: new Date("2019-05-15"),
          },
          {
            name: "Aspirin",
            dosage: "81mg",
            frequency: "Once daily",
            startDate: new Date("2018-12-01"),
          },
          {
            name: "Metoprolol",
            dosage: "50mg",
            frequency: "Twice daily",
            startDate: new Date("2018-12-01"),
          },
        ],
        conditions: [
          {
            name: "Heart Disease",
            diagnosedDate: new Date("2018-12-01"),
            status: "chronic",
          },
          {
            name: "High Cholesterol",
            diagnosedDate: new Date("2019-05-15"),
            status: "chronic",
          },
        ],
        surgeries: [
          {
            procedure: "Coronary Bypass",
            date: new Date("2018-12-01"),
            hospital: "Heart Center Hospital",
            surgeon: "Dr. Williams",
          },
          {
            procedure: "Hernia Repair",
            date: new Date("2020-03-15"),
            hospital: "General Surgery Center",
            surgeon: "Dr. Brown",
          },
        ],
      },
      assignedDoctor: drEmily._id,
      insurance: {
        provider: "UnitedHealth",
        policyNumber: "UHC345678",
        groupNumber: "GRP123",
        effectiveDate: new Date("2024-01-01"),
        expiryDate: new Date("2024-12-31"),
      },
      isActive: true,
    });

    // Save all patients
    await patient1.save();
    await patient2.save();
    await patient3.save();

    console.log("✅ Patients created successfully:");
    console.log("   1. John Smith (PAT001) - Assigned to Dr. Michael Chen");
    console.log("   2. Maria Garcia (PAT002) - Assigned to Dr. Michael Chen");
    console.log("   3. Robert Johnson (PAT003) - Assigned to Dr. Emily Wilson");

    // Update doctors with their patient assignments
    await User.findByIdAndUpdate(drMichael._id, {
      $push: { assignedPatients: [patient1._id, patient2._id] },
    });

    await User.findByIdAndUpdate(drEmily._id, {
      $push: { assignedPatients: patient3._id },
    });

    console.log("✅ Patient assignments updated in doctor profiles");

    // Display summary
    const totalPatients = await Patient.countDocuments();
    console.log(`\n📊 Total patients in database: ${totalPatients}`);

    const michaelPatients = await Patient.find({
      assignedDoctor: drMichael._id,
    });
    const emilyPatients = await Patient.find({ assignedDoctor: drEmily._id });

    console.log(`\n👨‍⚕️ Dr. Michael Chen's patients: ${michaelPatients.length}`);
    michaelPatients.forEach((p) =>
      console.log(`   - ${p.firstName} ${p.lastName} (${p.patientId})`)
    );

    console.log(`\n👩‍⚕️ Dr. Emily Wilson's patients: ${emilyPatients.length}`);
    emilyPatients.forEach((p) =>
      console.log(`   - ${p.firstName} ${p.lastName} (${p.patientId})`)
    );
  } catch (error) {
    console.error("❌ Error creating patients:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
createPatients();
