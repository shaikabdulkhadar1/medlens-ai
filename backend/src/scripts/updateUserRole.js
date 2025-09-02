const mongoose = require("mongoose");
const { User } = require("../db");
require("dotenv").config();

const updateUserRole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find and update the user with the old role
    const updatedUser = await User.findOneAndUpdate(
      { email: "jr.doctor@medlens.com" },
      { role: "front-desk-coordinator" },
      { new: true }
    );

    if (updatedUser) {
      console.log("✅ User role updated successfully:");
      console.log("   Email: jr.doctor@medlens.com");
      console.log("   Name: Dr. Emily Rodriguez");
      console.log("   Old Role: jr-doctor");
      console.log("   New Role: front-desk-coordinator");
    } else {
      console.log("❌ User not found");
    }
  } catch (error) {
    console.error("❌ Error updating user role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
updateUserRole();
