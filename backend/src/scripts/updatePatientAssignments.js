const mongoose = require("mongoose");
const { User, Patient } = require("../db");
require("dotenv").config();

const updatePatientAssignments = async () => {
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

    // Update existing patients with assignedDoctor field
    const patient1 = await Patient.findOne({ patientId: "PAT001" });
    const patient2 = await Patient.findOne({ patientId: "PAT002" });
    const patient3 = await Patient.findOne({ patientId: "PAT003" });

    if (patient1) {
      await Patient.findByIdAndUpdate(patient1._id, {
        assignedDoctor: drMichael._id,
      });
      console.log(
        "✅ Updated John Smith (PAT001) - Assigned to Dr. Michael Chen"
      );
    }

    if (patient2) {
      await Patient.findByIdAndUpdate(patient2._id, {
        assignedDoctor: drMichael._id,
      });
      console.log(
        "✅ Updated Maria Garcia (PAT002) - Assigned to Dr. Michael Chen"
      );
    }

    if (patient3) {
      await Patient.findByIdAndUpdate(patient3._id, {
        assignedDoctor: drEmily._id,
      });
      console.log(
        "✅ Updated Robert Johnson (PAT003) - Assigned to Dr. Emily Wilson"
      );
    }

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
    console.error("❌ Error updating patient assignments:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
updatePatientAssignments();
