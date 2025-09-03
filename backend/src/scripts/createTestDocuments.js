const mongoose = require("mongoose");
const { UploadRecord, Patient, AIAnalysis, User } = require("../db");

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

// Create test documents
const createTestDocuments = async () => {
  try {
    console.log("\n🧪 Creating Test Documents...\n");

    // Find or create a test patient
    let patient = await Patient.findOne();
    if (!patient) {
      console.log("❌ No patients found. Please create a patient first.");
      return;
    }
    console.log(`✅ Using patient: ${patient.firstName} ${patient.lastName}`);

    // Find or create a test user
    let user = await User.findOne();
    if (!user) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }
    console.log(`✅ Using user: ${user.firstName} ${user.lastName}`);

    // Create test upload records
    const testUploads = [
      {
        patientId: patient._id,
        fileKey: `patients/${patient._id}/uploaded-by-user/test-document-1.pdf`,
        originalName: "Medical Report.pdf",
        uploadedBy: user._id,
        status: "completed",
        documentType: "uploaded-by-user",
        fileSize: 1024 * 1024, // 1MB
        contentType: "application/pdf",
        uploadId: "test-upload-1",
        createdAt: new Date(),
        completedAt: new Date(),
      },
      {
        patientId: patient._id,
        fileKey: `patients/${patient._id}/uploaded-by-user/test-document-2.jpg`,
        originalName: "X-Ray Image.jpg",
        uploadedBy: user._id,
        status: "completed",
        documentType: "uploaded-by-user",
        fileSize: 2048 * 1024, // 2MB
        contentType: "image/jpeg",
        uploadId: "test-upload-2",
        createdAt: new Date(),
        completedAt: new Date(),
      },
      {
        patientId: patient._id,
        fileKey: `patients/${patient._id}/uploaded-by-user/test-document-3.docx`,
        originalName: "Consultation Notes.docx",
        uploadedBy: user._id,
        status: "completed",
        documentType: "uploaded-by-user",
        fileSize: 512 * 1024, // 512KB
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadId: "test-upload-3",
        createdAt: new Date(),
        completedAt: new Date(),
      },
    ];

    // Clear existing test uploads
    await UploadRecord.deleteMany({
      fileKey: { $regex: /test-document/ },
    });
    console.log("🧹 Cleared existing test uploads");

    // Create new test uploads
    const uploadRecords = await UploadRecord.insertMany(testUploads);
    console.log(`✅ Created ${uploadRecords.length} test upload records`);

    // Create test AI analysis reports
    const testAnalyses = [
      {
        patientId: patient._id,
        documentId: uploadRecords[0]._id, // Link to first PDF
        analysisId: "test-analysis-1",
        fileName: "Medical Report Analysis",
        analysisType: "comprehensive_analysis",
        documentType: "pdf",
        contentType: "lab_report",
        analysisResult: {
          confidence: 0.95,
          extractedText: "Sample extracted text from medical report...",
          summary: "This is a comprehensive analysis of the medical report.",
          keyFindings: ["Finding 1", "Finding 2", "Finding 3"],
          recommendations: ["Recommendation 1", "Recommendation 2"],
          medicalEntities: [
            {
              entity: "diabetes",
              type: "condition",
              confidence: 0.9,
            },
          ],
          processingTime: 5000, // 5 seconds
        },
        status: "completed",
        processedBy: user._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patient._id,
        documentId: uploadRecords[1]._id, // Link to image
        analysisId: "test-analysis-2",
        fileName: "X-Ray Image Analysis",
        analysisType: "image_classification",
        documentType: "image",
        contentType: "medical_image",
        analysisResult: {
          confidence: 0.88,
          imageFindings: [
            {
              finding: "Normal chest X-ray",
              confidence: 0.85,
              boundingBox: { x: 0, y: 0, width: 100, height: 100 },
            },
          ],
          processingTime: 3000, // 3 seconds
        },
        status: "completed",
        processedBy: user._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Clear existing test analyses
    await AIAnalysis.deleteMany({
      analysisId: { $regex: /test-analysis/ },
    });
    console.log("🧹 Cleared existing test analyses");

    // Create new test analyses
    const analyses = await AIAnalysis.insertMany(testAnalyses);
    console.log(`✅ Created ${analyses.length} test AI analysis reports`);

    console.log("\n🎉 Test data created successfully!");
    console.log(`📁 Upload Records: ${uploadRecords.length}`);
    console.log(`🤖 AI Analyses: ${analyses.length}`);

    // Test the endpoints
    console.log("\n🧪 Testing endpoints...");

    const uploadCount = await UploadRecord.countDocuments({
      patientId: patient._id,
      status: "completed",
    });
    console.log(`   Upload records for patient: ${uploadCount}`);

    const analysisCount = await AIAnalysis.countDocuments({
      patientId: patient._id,
    });
    console.log(`   AI analyses for patient: ${analysisCount}`);
  } catch (error) {
    console.error("❌ Error creating test documents:", error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await createTestDocuments();
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
};

// Run if this file is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { createTestDocuments };
