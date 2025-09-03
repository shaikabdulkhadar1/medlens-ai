const express = require("express");
const router = express.Router();
const Patient = require("../db/schemas/Patient");
const { authenticateToken } = require("../middleware/auth");

// Get all patients with pagination and filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, assignedDoctor } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (assignedDoctor) filter.assignedDoctor = assignedDoctor;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    const patients = await Patient.find(filter)
      .populate("assignedDoctor", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: patients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPatients: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
});

// Get single patient by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("assignedDoctor", "firstName lastName email")
      .exec();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
      error: error.message,
    });
  }
});

// Create new patient
router.post("/", authenticateToken, async (req, res) => {
  try {
    // Generate unique patient ID
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    const patientId = `PAT${timestamp}${random}`.toUpperCase();

    const patientData = {
      ...req.body,
      patientId,
      createdBy: req.user.id,
    };

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
});

// Update patient
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.patientId;
    delete updateData.createdAt;
    delete updateData._id;

    const patient = await Patient.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user.id },
      { new: true, runValidators: true }
    ).populate("assignedDoctor", "firstName lastName email");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update patient",
      error: error.message,
    });
  }
});

// Delete patient
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has admin privileges
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete patients",
      });
    }

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
      error: error.message,
    });
  }
});

// Add document to patient
router.post("/:id/documents", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const documentData = req.body;

    const patient = await Patient.findByIdAndUpdate(
      id,
      { $push: { uploadedDocuments: documentData } },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Document added successfully",
      data: patient.uploadedDocuments[patient.uploadedDocuments.length - 1],
    });
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add document",
      error: error.message,
    });
  }
});

// Add AI analysis report to patient
router.post("/:id/ai-reports", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;

    const patient = await Patient.findByIdAndUpdate(
      id,
      { $push: { aiAnalysisReports: reportData } },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "AI report added successfully",
      data: patient.aiAnalysisReports[patient.aiAnalysisReports.length - 1],
    });
  } catch (error) {
    console.error("Error adding AI report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add AI report",
      error: error.message,
    });
  }
});

// Add lab result to patient
router.post("/:id/lab-results", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const labData = req.body;

    const patient = await Patient.findByIdAndUpdate(
      id,
      { $push: { labResults: labData } },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Lab result added successfully",
      data: patient.labResults[patient.labResults.length - 1],
    });
  } catch (error) {
    console.error("Error adding lab result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add lab result",
      error: error.message,
    });
  }
});

// Get patient statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const activePatients = await Patient.countDocuments({ status: "active" });
    const inactivePatients = await Patient.countDocuments({
      status: "inactive",
    });
    const dischargedPatients = await Patient.countDocuments({
      status: "discharged",
    });

    // Get patients by gender
    const genderStats = await Patient.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    // Get patients by age groups
    const ageStats = await Patient.aggregate([
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$dateOfBirth"] },
                365 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 30, 50, 65, 100],
          default: "65+",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        activePatients,
        inactivePatients,
        dischargedPatients,
        genderStats,
        ageStats,
      },
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient statistics",
      error: error.message,
    });
  }
});

module.exports = router;
