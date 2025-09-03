const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("../db");
require("dotenv").config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = new User({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@medlens.ai",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      specialization: "System Administration",
      hospital: "MedLens AI",
      department: "IT",
      fullName: "System Administrator",
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully:", adminUser.email);
    console.log("📋 Login credentials:");
    console.log("   Email: admin@medlens.ai");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

createAdminUser();
