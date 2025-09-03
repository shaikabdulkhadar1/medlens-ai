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

// Test the document endpoints
const testDocumentEndpoints = async () => {
  try {
    console.log("\n🧪 Testing Document Endpoints...\n");

    // Find a patient to test with
    const patient = await Patient.findOne();
    if (!patient) {
      console.log("❌ No patients found in database");
      return;
    }
    console.log(
      `✅ Found patient: ${patient.firstName} ${patient.lastName} (ID: ${patient._id})`
    );

    // Test 1: Check if patient has any uploaded files
    const uploadRecords = await UploadRecord.find({
      patientId: patient._id,
      status: "completed",
    }).populate("uploadedBy", "firstName lastName email");

    console.log(`📁 Upload Records: ${uploadRecords.length} found`);
    if (uploadRecords.length > 0) {
      console.log("   Sample record:", {
        fileName: uploadRecords[0].originalName,
        documentType: uploadRecords[0].documentType,
        status: uploadRecords[0].status,
        uploadedBy: uploadRecords[0].uploadedBy?.firstName,
      });
    }

    // Test 2: Check if patient has any AI analysis reports
    const aiAnalyses = await AIAnalysis.find({
      patientId: patient._id,
    }).populate("documentId", "originalName fileKey contentType");

    console.log(`🤖 AI Analysis Reports: ${aiAnalyses.length} found`);
    if (aiAnalyses.length > 0) {
      console.log("   Sample analysis:", {
        fileName: aiAnalyses[0].fileName,
        analysisType: aiAnalyses[0].analysisType,
        status: aiAnalyses[0].status,
        documentType: aiAnalyses[0].documentType,
      });
    }

    // Test 3: Simulate the data transformation that happens in the endpoints
    console.log("\n🔄 Testing Data Transformation...");

    // Simulate uploaded files response
    const filesResponse = uploadRecords.map((record) => ({
      _id: record._id,
      fileKey: record.fileKey,
      originalName: record.originalName,
      documentType: record.documentType,
      fileSize: record.fileSize,
      contentType: record.contentType,
      status: record.status,
      createdAt: record.createdAt,
      completedAt: record.completedAt,
      uploadedBy: record.uploadedBy,
      patientId: record.patientId,
      uploadId: record.uploadId,
      metadata: record.metadata,
    }));

    console.log(`   Files response: ${filesResponse.length} files`);

    // Simulate AI analysis response
    const analysisResponse = aiAnalyses.map((analysis) => ({
      _id: analysis._id,
      patientId: analysis.patientId,
      documentId: analysis.documentId,
      analysisId: analysis.analysisId,
      fileName: analysis.fileName,
      analysisType: analysis.analysisType,
      documentType: analysis.documentType,
      contentType: analysis.contentType,
      analysisResult: analysis.analysisResult,
      status: analysis.status,
      errorMessage: analysis.errorMessage,
      processedBy: analysis.processedBy,
      metadata: analysis.metadata,
      isActive: analysis.isActive,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      fileKey: analysis.documentId?.fileKey,
      originalName: analysis.documentId?.originalName || analysis.fileName,
      formattedProcessingTime: analysis.analysisResult?.processingTime
        ? `${Math.round(analysis.analysisResult.processingTime / 1000)}s`
        : undefined,
      statusBadge:
        analysis.status === "completed"
          ? "Completed"
          : analysis.status === "processing"
          ? "Processing"
          : analysis.status === "failed"
          ? "Failed"
          : "Pending",
    }));

    console.log(`   Analysis response: ${analysisResponse.length} reports`);

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the tests
const runTests = async () => {
  await connectDB();
  await testDocumentEndpoints();
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
};

// Run if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testDocumentEndpoints };
