const express = require("express");
const {
  authenticateToken,
  requireAnyDoctor,
  canAccessPatient,
} = require("../middleware/auth");
const { Timeline, Patient } = require("../db");

const router = express.Router();

// @route   GET /api/timeline/patient/:patientId
// @desc    Get timeline entries for a patient
// @access  Private
router.get(
  "/patient/:patientId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;

      // Find the patient
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check if user has permission to access this patient
      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this patient's timeline",
        });
      }

      // Get timeline entries for the patient
      const timelineEntries = await Timeline.find({
        patientId: patientId,
        isActive: true,
      })
        .populate("consultedBy", "firstName lastName email")
        .sort({ date: -1, createdAt: -1 });

      res.json({
        success: true,
        data: timelineEntries,
        count: timelineEntries.length,
      });
    } catch (error) {
      console.error("Get timeline error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get timeline entries",
      });
    }
  }
);

// @route   POST /api/timeline/patient/:patientId
// @desc    Add a new timeline entry for a patient
// @access  Private
router.post(
  "/patient/:patientId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const timelineData = req.body;

      // Find the patient
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check if user has permission to access this patient
      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to add timeline entries for this patient",
        });
      }

      // Create new timeline entry
      const timelineEntry = new Timeline({
        patientId: patientId,
        title: timelineData.title,
        description: timelineData.description,
        type: timelineData.type || "other",
        date: timelineData.date || new Date(),
        time: timelineData.time,
        duration: timelineData.duration,
        consultedBy: timelineData.consultedBy || req.user._id,
        consultationSummary: timelineData.consultationSummary,
        documentsCount: timelineData.documentsCount || 0,
        metadata: timelineData.metadata,
      });

      await timelineEntry.save();

      // Populate the consultedBy field
      await timelineEntry.populate("consultedBy", "firstName lastName email");

      res.json({
        success: true,
        message: "Timeline entry added successfully",
        data: timelineEntry,
      });
    } catch (error) {
      console.error("Add timeline entry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add timeline entry",
      });
    }
  }
);

// @route   PUT /api/timeline/:entryId
// @desc    Update a timeline entry
// @access  Private
router.put(
  "/:entryId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { entryId } = req.params;
      const updateData = req.body;

      // Find the timeline entry
      const timelineEntry = await Timeline.findById(entryId);
      if (!timelineEntry) {
        return res.status(404).json({
          success: false,
          message: "Timeline entry not found",
        });
      }

      // Find the patient to check permissions
      const patient = await Patient.findById(timelineEntry.patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check if user has permission to access this patient
      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this timeline entry",
        });
      }

      // Update the timeline entry
      const updatedEntry = await Timeline.findByIdAndUpdate(
        entryId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("consultedBy", "firstName lastName email");

      res.json({
        success: true,
        message: "Timeline entry updated successfully",
        data: updatedEntry,
      });
    } catch (error) {
      console.error("Update timeline entry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update timeline entry",
      });
    }
  }
);

// @route   DELETE /api/timeline/:entryId
// @desc    Delete a timeline entry (soft delete)
// @access  Private
router.delete(
  "/:entryId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { entryId } = req.params;

      // Find the timeline entry
      const timelineEntry = await Timeline.findById(entryId);
      if (!timelineEntry) {
        return res.status(404).json({
          success: false,
          message: "Timeline entry not found",
        });
      }

      // Find the patient to check permissions
      const patient = await Patient.findById(timelineEntry.patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check if user has permission to access this patient
      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this timeline entry",
        });
      }

      // Soft delete the timeline entry
      await Timeline.findByIdAndUpdate(entryId, { isActive: false });

      res.json({
        success: true,
        message: "Timeline entry deleted successfully",
      });
    } catch (error) {
      console.error("Delete timeline entry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete timeline entry",
      });
    }
  }
);

module.exports = router;
