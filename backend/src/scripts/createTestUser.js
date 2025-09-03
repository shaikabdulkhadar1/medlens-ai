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

// Create test user
const createTestUser = async () => {
  try {
    console.log("\n🧪 Creating Test User...\n");

    // Check if user already exists
    let user = await User.findOne({ email: "test@medlens.com" });
    if (user) {
      console.log(`✅ User already exists: ${user.firstName} ${user.lastName}`);
      return user;
    }

    // Create new test user
    const newUser = new User({
      firstName: "Test",
      lastName: "Doctor",
      email: "test@medlens.com",
      password: "test123", // This will be hashed by the pre-save middleware
      role: "consulting_doctor",
      licenseNumber: "MD123456",
      specialization: "General Medicine",
      phone: "+1-555-0000",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save user
    await newUser.save();
    console.log(
      `✅ Created test user: ${newUser.firstName} ${newUser.lastName}`
    );
    console.log(`   User ID: ${newUser._id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);

    return newUser;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await createTestUser();
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
};

// Run if this file is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { createTestUser };
