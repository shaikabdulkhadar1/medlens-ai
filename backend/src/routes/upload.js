const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { authenticateToken, requireAnyDoctor } = require("../middleware/auth");
const { UploadRecord, Patient, AIAnalysis, User } = require("../db");
const AIService = require("../services/aiService");
const PDFService = require("../services/pdfService");
const mongoose = require("mongoose");

const router = express.Router();

// Configure AWS SDK for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto", // R2 doesn't use regions like S3
  signatureVersion: "v4",
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, images, Word documents, and text files are allowed."
        ),
        false
      );
    }
  },
});

// Upload single file to R2
const uploadToR2 = async (file, patientId, userId) => {
  try {
    const fileContent = fs.readFileSync(file.path);
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Determine content type based on file extension
    const contentTypeMap = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
    };

    const contentType =
      contentTypeMap[fileExtension] || "application/octet-stream";

    // Create unique key for R2 - User uploaded documents go to uploaded-by-user folder
    const key = `patients/${patientId}/uploaded-by-user/${uuidv4()}-${Date.now()}${fileExtension}`;

    const uploadParams = {
      Bucket: "medlens-documents", // Replace with your R2 bucket name
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        originalName: String(file.originalname),
        uploadedBy: String(userId),
        patientId: String(patientId),
        uploadedAt: new Date().toISOString(),
        fileSize: String(file.size),
      },
    };

    const result = await s3.upload(uploadParams).promise();

    // Clean up local file
    fs.unlinkSync(file.path);

    return {
      success: true,
      url: result.Location,
      key: result.Key,
      originalName: file.originalname,
      size: file.size,
      contentType: contentType,
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

// Generate presigned URLs for file upload
router.post(
  "/generate-upload-urls",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId, files } = req.body;
      const userId = req.user._id;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "Patient ID is required",
        });
      }

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Files array is required",
        });
      }

      // Validate patient access
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const uploadUrls = [];
      const errors = [];

      for (const fileInfo of files) {
        try {
          const { fileName, fileType, fileSize } = fileInfo;

          // Validate file type
          const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ];

          if (!allowedTypes.includes(fileType)) {
            errors.push({
              fileName,
              error: "Invalid file type",
            });
            continue;
          }

          // Generate unique key with patient ID - User uploaded documents go to uploaded-by-user folder
          const fileExtension = path.extname(fileName);
          const uniqueKey = `patients/${patientId}/uploaded-by-user/${uuidv4()}-${Date.now()}${fileExtension}`;

          // Create presigned URL
          const params = {
            Bucket: "medlens-documents",
            Key: uniqueKey,
            ContentType: fileType,
            Expires: 3600, // 1 hour
            Metadata: {
              patientid: patientId,
              uploadedby: userId.toString(),
              originalname: fileName,
            },
          };

          const presignedUrl = await s3.getSignedUrlPromise(
            "putObject",
            params
          );

          // Create upload record in database
          const uploadRecord = new UploadRecord({
            patientId,
            fileKey: uniqueKey,
            originalName: fileName,
            uploadedBy: userId,
            status: "pending",
            documentType: "uploaded-by-user", // Explicitly set document type
            fileSize,
            contentType: fileType,
            uploadId: uuidv4(),
            metadata: {
              patientid: patientId,
              uploadedby: userId.toString(),
              originalname: fileName,
            },
          });

          await uploadRecord.save();

          uploadUrls.push({
            fileName,
            presignedUrl,
            uploadId: uploadRecord._id,
            key: uniqueKey,
            expiresIn: 3600,
          });
        } catch (error) {
          console.error(
            `Error generating presigned URL for ${fileInfo.fileName}:`,
            error
          );
          errors.push({
            fileName: fileInfo.fileName,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: `Generated ${uploadUrls.length} upload URLs`,
        uploadUrls,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Generate upload URLs error:", error);
      res.status(500).json({
        success: false,
        message: "Error generating upload URLs",
        error: error.message,
      });
    }
  }
);

// Confirm upload completion
router.post(
  "/confirm-upload",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { uploadId, key } = req.body;
      const userId = req.user._id;

      if (!uploadId || !key) {
        return res.status(400).json({
          success: false,
          message: "Upload ID and key are required",
        });
      }

      // Find and update upload record
      const uploadRecord = await UploadRecord.findById(uploadId);
      if (!uploadRecord) {
        return res.status(404).json({
          success: false,
          message: "Upload record not found",
        });
      }

      // Verify ownership
      if (uploadRecord.uploadedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to confirm this upload",
        });
      }

      // Update status to completed
      uploadRecord.status = "completed";
      uploadRecord.completedAt = new Date();
      await uploadRecord.save();

      res.json({
        success: true,
        message: "Upload confirmed successfully",
        uploadRecord: {
          id: uploadRecord._id,
          key: uploadRecord.fileKey,
          originalName: uploadRecord.originalName,
          status: uploadRecord.status,
        },
      });
    } catch (error) {
      console.error("Confirm upload error:", error);
      res.status(500).json({
        success: false,
        message: "Error confirming upload",
        error: error.message,
      });
    }
  }
);

// Get upload status
router.get(
  "/upload-status/:uploadId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { uploadId } = req.params;
      const userId = req.user._id;

      const uploadRecord = await UploadRecord.findById(uploadId);
      if (!uploadRecord) {
        return res.status(404).json({
          success: false,
          message: "Upload record not found",
        });
      }

      // Verify ownership
      if (uploadRecord.uploadedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this upload",
        });
      }

      res.json({
        success: true,
        uploadRecord: {
          id: uploadRecord._id,
          key: uploadRecord.fileKey,
          originalName: uploadRecord.originalName,
          status: uploadRecord.status,
          createdAt: uploadRecord.createdAt,
          completedAt: uploadRecord.completedAt,
        },
      });
    } catch (error) {
      console.error("Get upload status error:", error);
      res.status(500).json({
        success: false,
        message: "Error getting upload status",
        error: error.message,
      });
    }
  }
);

// Get presigned URL for file download
router.get(
  "/download/:key",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      console.log("🔍 Download request received:", {
        key: req.params.key,
        keyType: typeof req.params.key,
        keyLength: req.params.key?.length,
        userId: req.user._id,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
      });

      const { key } = req.params;
      const userId = req.user._id;

      // Verify file exists in database
      console.log("🔍 Looking up file in database with key:", key);
      const uploadRecord = await UploadRecord.findOne({ fileKey: key });
      console.log("🔍 Database lookup result:", {
        found: !!uploadRecord,
        recordId: uploadRecord?._id,
        patientId: uploadRecord?.patientId,
        documentType: uploadRecord?.documentType,
        contentType: uploadRecord?.contentType,
      });

      if (!uploadRecord) {
        console.log("❌ File not found in database for key:", key);
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Verify access (uploader or any doctor with patient access)
      if (uploadRecord.uploadedBy.toString() !== userId.toString()) {
        // Check if user has access to the patient
        const patient = await Patient.findById(uploadRecord.patientId);
        if (!patient) {
          return res.status(404).json({
            success: false,
            message: "Patient not found",
          });
        }

        // For AI analysis reports, allow any doctor with patient access
        if (uploadRecord.documentType === "ai-analysis-report") {
          // Allow access for any authenticated doctor
          console.log(
            `✅ Doctor ${userId} accessing AI analysis report for patient ${uploadRecord.patientId}`
          );
        } else {
          // For other files, check if user is assigned to this patient
          const user = await User.findById(userId);
          if (!user) {
            return res.status(403).json({
              success: false,
              message: "User not found",
            });
          }

          // Check if user has access to this patient
          const hasPatientAccess =
            user.assignedPatients?.includes(
              uploadRecord.patientId.toString()
            ) ||
            user.role === "admin" ||
            user.role === "senior_doctor";

          if (!hasPatientAccess) {
            return res.status(403).json({
              success: false,
              message: "Not authorized to access this patient's files",
            });
          }
        }
      }

      console.log("🔍 Generating S3 presigned URL with params:", {
        Bucket: "medlens-documents",
        Key: key,
        Expires: 3600,
      });

      const params = {
        Bucket: "medlens-documents",
        Key: key,
        Expires: 3600, // URL expires in 1 hour
      };

      const presignedUrl = await s3.getSignedUrlPromise("getObject", params);
      console.log("✅ S3 presigned URL generated successfully");

      console.log(
        `📥 Download URL generated for file: ${key}, user: ${userId}, expires: ${new Date(
          Date.now() + 3600000
        ).toISOString()}`
      );

      const responseData = {
        success: true,
        downloadUrl: presignedUrl,
        expiresIn: 3600,
        fileName: uploadRecord.originalName,
        contentType: uploadRecord.contentType,
      };

      console.log("✅ Sending successful response:", {
        success: responseData.success,
        fileName: responseData.fileName,
        contentType: responseData.contentType,
        downloadUrlLength: responseData.downloadUrl?.length || 0,
      });

      res.json(responseData);
    } catch (error) {
      console.error("❌ Error generating download URL:", {
        error: error.message,
        stack: error.stack,
        key: req.params.key,
        userId: req.user?._id,
        timestamp: new Date().toISOString(),
      });
      res.status(500).json({
        success: false,
        message: "Error generating download URL",
        error: error.message,
      });
    }
  }
);

// Delete file from R2
router.delete(
  "/delete/:key",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { key } = req.params;
      const userId = req.user._id;

      // Decode the URL-encoded key
      const decodedKey = decodeURIComponent(key);

      // Find the upload record in database
      const uploadRecord = await UploadRecord.findOne({ fileKey: decodedKey });
      if (!uploadRecord) {
        return res.status(404).json({
          success: false,
          message: "File record not found",
        });
      }

      // Verify ownership or admin access
      if (uploadRecord.uploadedBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this file",
        });
      }

      // Delete from R2
      const params = {
        Bucket: "medlens-documents",
        Key: decodedKey,
      };

      await s3.deleteObject(params).promise();

      // Delete from database
      await UploadRecord.findByIdAndDelete(uploadRecord._id);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting file",
        error: error.message,
      });
    }
  }
);

// Bulk delete files
router.delete(
  "/bulk-delete",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { fileKeys } = req.body;
      const userId = req.user._id;

      if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
        return res.status(400).json({
          success: false,
          message: "File keys array is required and must not be empty",
        });
      }

      console.log(
        `🗑️ Bulk delete request for ${fileKeys.length} files by user ${userId}`
      );

      // Find all upload records for the given file keys
      const uploadRecords = await UploadRecord.find({
        fileKey: { $in: fileKeys },
      });

      if (uploadRecords.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No files found with the provided keys",
        });
      }

      // Verify ownership for all files
      const unauthorizedFiles = uploadRecords.filter(
        (record) => record.uploadedBy.toString() !== userId.toString()
      );

      if (unauthorizedFiles.length > 0) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete some files",
          unauthorizedFiles: unauthorizedFiles.map((f) => f.originalName),
        });
      }

      const results = [];
      const errors = [];

      // Process each file deletion
      for (const uploadRecord of uploadRecords) {
        try {
          // Delete from R2
          const params = {
            Bucket: "medlens-documents",
            Key: uploadRecord.fileKey,
          };

          await s3.deleteObject(params).promise();

          // Delete from database
          await UploadRecord.findByIdAndDelete(uploadRecord._id);

          results.push({
            fileKey: uploadRecord.fileKey,
            fileName: uploadRecord.originalName,
            success: true,
          });

          console.log(`✅ Successfully deleted: ${uploadRecord.originalName}`);
        } catch (error) {
          console.error(
            `❌ Error deleting ${uploadRecord.originalName}:`,
            error
          );
          errors.push({
            fileKey: uploadRecord.fileKey,
            fileName: uploadRecord.originalName,
            error: error.message,
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;

      console.log(
        `📊 Bulk delete completed: ${successCount} successful, ${errorCount} failed`
      );

      res.json({
        success: true,
        message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
        results: {
          successful: results,
          failed: errors,
        },
        summary: {
          total: fileKeys.length,
          successful: successCount,
          failed: errorCount,
        },
      });
    } catch (error) {
      console.error("Error in bulk delete:", error);
      res.status(500).json({
        success: false,
        message: "Error performing bulk delete",
        error: error.message,
      });
    }
  }
);

// Get all files for a specific patient
router.get("/patient/:patientId/files", authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId } = req.user;

    // Validate patientId
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get all upload records for this patient
    const uploadRecords = await UploadRecord.find({
      patientId: patientId,
      status: "completed", // Only get completed uploads
    })
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 }); // Most recent first

    // Transform the data to match frontend expectations
    const files = uploadRecords.map((record) => ({
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

    res.json({
      success: true,
      data: files,
      message: `Found ${files.length} files for patient`,
    });
  } catch (error) {
    console.error("Error fetching patient files:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient files",
      error: error.message,
    });
  }
});

// Get all AI analysis reports for a specific patient
router.get(
  "/patient/:patientId/analysis",
  authenticateToken,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { userId } = req.user;

      // Validate patientId
      if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient ID",
        });
      }

      // Check if patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Get all AI analysis records for this patient
      const aiAnalyses = await AIAnalysis.find({
        patientId: patientId,
      })
        .populate("documentId", "originalName fileKey contentType")
        .populate("processedBy", "firstName lastName email")
        .sort({ createdAt: -1 }); // Most recent first

      // Transform the data to match frontend expectations
      const analysisReports = aiAnalyses.map((analysis) => ({
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
        // Add file information from the related document
        fileKey: analysis.documentId?.fileKey,
        originalName: analysis.documentId?.originalName || analysis.fileName,
        // Format processing time if available
        formattedProcessingTime: analysis.analysisResult?.processingTime
          ? `${Math.round(analysis.analysisResult.processingTime / 1000)}s`
          : undefined,
        // Add status badge
        statusBadge:
          analysis.status === "completed"
            ? "Completed"
            : analysis.status === "processing"
            ? "Processing"
            : analysis.status === "failed"
            ? "Failed"
            : "Pending",
      }));

      res.json({
        success: true,
        data: analysisReports,
        message: `Found ${analysisReports.length} AI analysis reports for patient`,
      });
    } catch (error) {
      console.error("Error fetching patient AI analysis:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient AI analysis",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/upload/analyze
// @desc    Trigger AI analysis for a document
// @access  Private
router.post(
  "/analyze",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { uploadId, patientId } = req.body;

      if (!uploadId || !patientId) {
        return res.status(400).json({
          success: false,
          message: "Upload ID and Patient ID are required",
        });
      }

      // Find the upload record
      const uploadRecord = await UploadRecord.findById(uploadId);
      if (!uploadRecord) {
        return res.status(404).json({
          success: false,
          message: "Upload record not found",
        });
      }

      // Start AI analysis
      const analysisResult = await startAIAnalysis(
        uploadRecord,
        patientId,
        req.user._id
      );

      res.json({
        success: true,
        message: "AI analysis completed",
        analysis: analysisResult,
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to perform AI analysis",
      });
    }
  }
);

// @route   GET /api/upload/analysis/:analysisId
// @desc    Get AI analysis results
// @access  Private
router.get(
  "/analysis/:analysisId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { analysisId } = req.params;

      const analysis = await AIAnalysis.findOne({ analysisId }).populate(
        "patientId",
        "firstName lastName"
      );

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: "Analysis not found",
        });
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get analysis",
      });
    }
  }
);

// @route   GET /api/upload/patient/:patientId/analysis
// @desc    Get all AI analysis results for a patient
// @access  Private
router.get(
  "/patient/:patientId/analysis",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const analyses = await AIAnalysis.find({
        patientId,
        isActive: true,
      })
        .populate("documentId", "originalName fileKey")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: analyses,
        count: analyses.length,
      });
    } catch (error) {
      console.error("Get patient analysis error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get patient analysis",
      });
    }
  }
);

// Direct upload (proxy through backend)
router.post(
  "/direct",
  authenticateToken,
  requireAnyDoctor,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { patientId } = req.body;
      const file = req.file;

      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "File is required" });
      }
      if (!patientId) {
        // Clean up temp file
        if (file?.path)
          try {
            fs.unlinkSync(file.path);
          } catch {}
        return res
          .status(400)
          .json({ success: false, message: "Patient ID is required" });
      }

      // Validate patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        if (file?.path)
          try {
            fs.unlinkSync(file.path);
          } catch {}
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      // Upload to R2
      const r2 = await uploadToR2(file, patientId, userId);

      // Create UploadRecord as completed
      const uploadRecord = new UploadRecord({
        patientId,
        fileKey: r2.key,
        originalName: r2.originalName,
        uploadedBy: userId,
        status: "completed",
        documentType: "uploaded-by-user",
        fileSize: r2.size,
        contentType: r2.contentType,
        completedAt: new Date(),
        metadata: {
          patientId: String(patientId),
          uploadedBy: String(userId),
          originalName: r2.originalName,
        },
      });
      await uploadRecord.save();

      // Generate presigned GET URL and store it in metadata (note: expires)
      const getParams = {
        Bucket: "medlens-documents",
        Key: r2.key,
        Expires: 3600,
      };
      const presignedUrl = await s3.getSignedUrlPromise("getObject", getParams);
      // Update metadata with presigned URL snapshot
      uploadRecord.metadata = {
        ...uploadRecord.metadata,
        lastPresignedUrl: presignedUrl,
        lastPresignedUrlExpiresAt: new Date(
          Date.now() + 3600 * 1000
        ).toISOString(),
      };
      await uploadRecord.save();

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          _id: uploadRecord._id,
          fileKey: uploadRecord.fileKey,
          originalName: uploadRecord.originalName,
          contentType: uploadRecord.contentType,
          fileSize: uploadRecord.fileSize,
          presignedUrl,
          presignedUrlExpiresAt:
            uploadRecord.metadata.lastPresignedUrlExpiresAt,
        },
      });
    } catch (error) {
      console.error("Direct upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  }
);

// Helper function to start AI analysis
async function startAIAnalysis(uploadRecord, patientId, userId) {
  let aiAnalysis = null;

  try {
    console.log("🤖 Starting AI analysis for:", uploadRecord.originalName);
    console.log("📊 Upload record details:", {
      id: uploadRecord._id,
      fileName: uploadRecord.originalName,
      fileKey: uploadRecord.fileKey,
      contentType: uploadRecord.contentType,
      fileSize: uploadRecord.fileSize,
    });

    // Create AI analysis record
    aiAnalysis = new AIAnalysis({
      patientId,
      documentId: uploadRecord._id,
      analysisId: uuidv4(),
      fileName: uploadRecord.originalName,
      status: "processing",
      processedBy: userId,
    });

    await aiAnalysis.save();
    console.log("✅ AI analysis record created:", aiAnalysis._id);

    // Get file from R2 for AI analysis
    console.log("📥 Fetching file from R2...");
    const fileBuffer = await getFileFromR2(uploadRecord.fileKey);
    console.log("✅ File fetched, size:", fileBuffer.length, "bytes");

    // Validate file buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Empty file buffer received from R2");
    }

    // Send to AI service for analysis
    console.log("🤖 Sending to AI service...");
    const aiService = AIService;
    const aiResult = await aiService.analyzeDocument(
      fileBuffer,
      uploadRecord.originalName,
      patientId,
      userId.toString()
    );

    console.log("📊 AI service result:", {
      success: aiResult.success,
      hasError: !!aiResult.error,
      hasData: !!aiResult.data,
      confidence: aiResult.data?.confidence,
      processingTime: aiResult.data?.processingTime,
    });

    if (aiResult.success) {
      // Update analysis record with results
      aiAnalysis.status = "completed";
      aiAnalysis.contentType = mapContentType(uploadRecord.contentType);
      aiAnalysis.analysisResult = {
        confidence: aiResult.data.confidence,
        summary: aiResult.data.summary,
        keyFindings: extractKeyFindings(aiResult.data),
        recommendations: extractRecommendations(aiResult.data),
        modelResults: aiResult.data.models,
        processingTime: aiResult.data.processingTime,
        rawResponse:
          aiResult.data.models?.huggingface?.rawResponse ||
          aiResult.data.summary,
      };
      console.log("✅ Analysis results processed successfully");

      // No longer creating text files - only PDF reports
      console.log(
        "📄 Skipping text file creation - only PDF will be generated"
      );

      // Generate and upload PDF report
      try {
        console.log("📄 Generating PDF report...");

        // Get patient and user data for PDF
        const patient = await Patient.findById(patientId);
        const user = await User.findById(userId);

        if (!patient) {
          console.error("❌ Patient not found for PDF generation:", patientId);
          throw new Error("Patient not found");
        }

        if (!user) {
          console.error("❌ User not found for PDF generation:", userId);
          throw new Error("User not found");
        }

        console.log("✅ Patient and user data retrieved for PDF generation");

        const pdfService = new PDFService();

        // Generate PDF
        console.log("🔄 Starting PDF generation...");
        const pdfResult = await pdfService.generateAIAnalysisPDF(
          aiAnalysis,
          patient,
          user
        );
        console.log("✅ PDF generated successfully:", pdfResult);

        // Upload PDF to R2 - Goes to ai-analysis-reports folder
        const pdfFileKey = `patients/${patientId}/ai-analysis-reports/${
          aiAnalysis.analysisId
        }-${Date.now()}.pdf`;
        console.log("📤 Uploading PDF to R2:", pdfFileKey);

        const uploadResult = await pdfService.uploadPDFToR2(
          pdfResult.filePath,
          pdfFileKey
        );
        console.log("✅ PDF uploaded to R2:", uploadResult);

        // Create PDF document record
        const pdfRecord = new UploadRecord({
          patientId,
          fileKey: pdfFileKey,
          originalName: `AI_Analysis_${uploadRecord.originalName.replace(
            /\.[^/.]+$/,
            ""
          )}.pdf`,
          uploadedBy: userId,
          status: "completed",
          documentType: "ai-analysis-report",
          fileSize: uploadResult.fileSize,
          contentType: "application/pdf", // Ensure this is set correctly
          completedAt: new Date(),
          metadata: {
            patientId: patientId,
            uploadedBy: userId.toString(),
            originalName: `AI_Analysis_${uploadRecord.originalName}.pdf`,
            analysisId: aiAnalysis.analysisId,
            originalDocumentId: uploadRecord._id,
            isPDF: true,
          },
        });

        console.log(
          "✅ PDF record created with contentType:",
          pdfRecord.contentType
        );

        await pdfRecord.save();
        console.log("✅ PDF report uploaded and saved:", pdfRecord._id);

        // Update the AI analysis record to include the PDF file reference
        aiAnalysis.pdfReportId = pdfRecord._id;
        await aiAnalysis.save();
        console.log("✅ AI analysis record updated with PDF reference");
      } catch (pdfError) {
        console.error("❌ Error generating/uploading PDF:", pdfError);
        console.error("PDF Error details:", {
          name: pdfError.name,
          message: pdfError.message,
          stack: pdfError.stack,
        });
        // Don't fail the entire analysis if PDF generation fails
      }
    } else {
      // Update analysis record with error
      aiAnalysis.status = "failed";
      aiAnalysis.errorMessage = aiResult.error;
      console.error("❌ AI analysis failed:", aiResult.error);
    }

    await aiAnalysis.save();
    console.log("✅ AI analysis record updated, status:", aiAnalysis.status);

    return aiAnalysis;
  } catch (error) {
    console.error("❌ AI analysis failed with exception:", error);
    console.error("🔍 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Update analysis record with error
    if (aiAnalysis) {
      aiAnalysis.status = "failed";
      aiAnalysis.errorMessage = error.message;
      await aiAnalysis.save();
      console.log("✅ Error saved to analysis record");
    }

    throw error;
  }
}

// Helper function to map MIME types to AIAnalysis contentType enum
function mapContentType(mimeType) {
  if (mimeType.startsWith("image/")) {
    return "medical_image";
  } else if (mimeType === "application/pdf") {
    return "lab_report";
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return "consultation_note";
  } else if (mimeType === "text/plain") {
    return "consultation_note";
  } else {
    return "other";
  }
}

// Helper function to get file from R2
async function getFileFromR2(fileKey) {
  try {
    const params = {
      Bucket: "medlens-documents",
      Key: fileKey,
    };

    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    console.error("Error getting file from R2:", error);
    throw error;
  }
}

// Helper function to extract key findings
function extractKeyFindings(aiResult) {
  const findings = [];

  // Extract findings from classification results
  if (aiResult.models?.classification) {
    const classification = Array.isArray(aiResult.models.classification)
      ? aiResult.models.classification[0]
      : aiResult.models.classification;

    if (classification && classification.label) {
      findings.push(
        `Classification: ${classification.label} (${(
          classification.score * 100
        ).toFixed(1)}%)`
      );
    }
  }

  // Extract findings from summary
  if (aiResult.summary) {
    findings.push(`Analysis Summary: ${aiResult.summary}`);
  }

  return findings;
}

// Helper function to extract recommendations
function extractRecommendations(aiResult) {
  const recommendations = [];

  // Extract recommendations from classification confidence
  if (aiResult.confidence) {
    const confidencePercent = (aiResult.confidence * 100).toFixed(1);
    if (aiResult.confidence > 0.8) {
      recommendations.push("High confidence analysis - results are reliable");
    } else if (aiResult.confidence > 0.6) {
      recommendations.push("Moderate confidence - consider manual review");
    } else {
      recommendations.push("Low confidence - manual review recommended");
    }
  }

  // Add general recommendations based on processing time
  if (aiResult.processingTime) {
    if (aiResult.processingTime < 5000) {
      recommendations.push(
        "Fast processing time - analysis completed efficiently"
      );
    } else {
      recommendations.push(
        "Extended processing time - consider optimizing image quality"
      );
    }
  }

  return recommendations;
}

module.exports = router;
