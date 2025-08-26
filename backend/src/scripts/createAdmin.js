const mongoose = require("mongoose");
const { User } = require("../db");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: "admin@medlens.com",
      password: "admin123",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      specialization: "System Administration",
      hospital: "MedLens AI",
      department: "IT Department",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully:");
    console.log("   Email: admin@medlens.com");
    console.log("   Password: admin123");
    console.log("   Role: admin");

    // Create a senior doctor
    const seniorDoctor = new User({
      email: "senior.doctor@medlens.com",
      password: "senior123",
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      role: "senior_doctor",
      specialization: "Cardiology",
      hospital: "MedLens General Hospital",
      department: "Cardiology Department",
      isActive: true,
    });

    await seniorDoctor.save();

    console.log("✅ Senior doctor created successfully:");
    console.log("   Email: senior.doctor@medlens.com");
    console.log("   Password: senior123");
    console.log("   Role: senior_doctor");

    // Create a consulting doctor
    const consultingDoctor = new User({
      email: "consulting.doctor@medlens.com",
      password: "consulting123",
      firstName: "Dr. Michael",
      lastName: "Chen",
      role: "consulting_doctor",
      specialization: "Radiology",
      hospital: "MedLens General Hospital",
      department: "Radiology Department",
      assignedSeniorDoctor: seniorDoctor._id,
      isActive: true,
    });

    await consultingDoctor.save();

    // Update senior doctor's assigned consulting doctors
    await User.findByIdAndUpdate(seniorDoctor._id, {
      $push: { assignedConsultingDoctors: consultingDoctor._id },
    });

    console.log("✅ Consulting doctor created successfully:");
    console.log("   Email: consulting.doctor@medlens.com");
    console.log("   Password: consulting123");
    console.log("   Role: consulting_doctor");
    console.log("   Assigned to: Dr. Sarah Johnson (Senior Doctor)");

    console.log("\n🎉 All test users created successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("   Admin: admin@medlens.com / admin123");
    console.log("   Senior Doctor: senior.doctor@medlens.com / senior123");
    console.log(
      "   Consulting Doctor: consulting.doctor@medlens.com / consulting123"
    );
  } catch (error) {
    console.error("❌ Error creating users:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
createAdminUser();
