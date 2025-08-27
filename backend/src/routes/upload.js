const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { authenticateToken, requireAnyDoctor } = require("../middleware/auth");
const { UploadRecord, Patient } = require("../db");

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

    // Create unique key for R2
    const key = `patients/${patientId}/documents/${uuidv4()}-${Date.now()}${fileExtension}`;

    const uploadParams = {
      Bucket: "medlens-documents", // Replace with your R2 bucket name
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        patientId: patientId,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString(),
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

          // Generate unique key with patient ID
          const fileExtension = path.extname(fileName);
          const uniqueKey = `patients/${patientId}/documents/${uuidv4()}-${Date.now()}${fileExtension}`;

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
      const { key } = req.params;

      const params = {
        Bucket: "medlens-documents", // Replace with your R2 bucket name
        Key: key,
        Expires: 3600, // URL expires in 1 hour
      };

      const presignedUrl = await s3.getSignedUrlPromise("getObject", params);

      res.json({
        success: true,
        downloadUrl: presignedUrl,
      });
    } catch (error) {
      console.error("Error generating download URL:", error);
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

      const params = {
        Bucket: "medlens-documents", // Replace with your R2 bucket name
        Key: key,
      };

      await s3.deleteObject(params).promise();

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

// List files for a patient
router.get(
  "/patient/:patientId/files",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const params = {
        Bucket: "medlens-documents", // Replace with your R2 bucket name
        Prefix: `patients/${patientId}/documents/`,
      };

      const result = await s3.listObjectsV2(params).promise();

      const files = result.Contents.map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        // Extract original filename from metadata if available
        originalName: obj.Key.split("/").pop(),
      }));

      res.json({
        success: true,
        files: files,
      });
    } catch (error) {
      console.error("Error listing files:", error);
      res.status(500).json({
        success: false,
        message: "Error listing files",
        error: error.message,
      });
    }
  }
);

module.exports = router;
