const mongoose = require("mongoose");
const { User } = require("../db");
require("dotenv").config();

const createJuniorDoctor = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if junior doctor already exists
    const existingJuniorDoctor = await User.findOne({ role: "jr-doctor" });
    if (existingJuniorDoctor) {
      console.log(
        "⚠️  Junior doctor already exists:",
        existingJuniorDoctor.email
      );
      return;
    }

    // Create junior doctor user
    const juniorDoctor = new User({
      email: "jr.doctor@medlens.com",
      password: "jr123456",
      firstName: "Dr. Emily",
      lastName: "Rodriguez",
      role: "jr-doctor",
      specialization: "General Medicine",
      hospital: "MedLens General Hospital",
      department: "Emergency Department",
      isActive: true,
    });

    await juniorDoctor.save();

    console.log("✅ Junior doctor created successfully:");
    console.log("   Email: jr.doctor@medlens.com");
    console.log("   Password: jr123456");
    console.log("   Role: jr-doctor");
    console.log("   Name: Dr. Emily Rodriguez");
    console.log("   Specialization: General Medicine");
    console.log("   Department: Emergency Department");

    console.log("\n🎉 Junior doctor user created successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("   Junior Doctor: jr.doctor@medlens.com / jr123456");
    console.log("\n💡 Next Steps:");
    console.log("   1. Junior doctor can create patients");
    console.log("   2. Junior doctor can provide basic diagnosis");
    console.log(
      "   3. Patients can be assigned to senior doctors for further analysis"
    );
  } catch (error) {
    console.error("❌ Error creating junior doctor:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
createJuniorDoctor();
