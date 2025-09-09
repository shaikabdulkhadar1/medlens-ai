const express = require("express");
const {
  authenticateToken,
  requireAnyDoctor,
  canAccessPatient,
} = require("../middleware/auth");
const { Patient } = require("../db");

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
      const patient = await Patient.findById(patientId)
        .populate("timeline.doctor", "firstName lastName email specialization")
        .populate("timeline.createdBy", "firstName lastName email role");

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

      // Sort timeline entries by visit date (newest first)
      const timelineEntries = patient.timeline.sort(
        (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
      );

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

      // Validate required fields
      if (!timelineData.visitDate || !timelineData.visitType) {
        return res.status(400).json({
          success: false,
          message: "Visit date and visit type are required",
        });
      }

      // Create new timeline entry
      const newTimelineEntry = {
        visitDate: new Date(timelineData.visitDate),
        visitType: timelineData.visitType,
        doctor: timelineData.doctor || req.user._id,
        diagnosis: timelineData.diagnosis || "",
        symptoms: timelineData.symptoms || [],
        treatment: timelineData.treatment || "",
        medications: timelineData.medications || [],
        notes: timelineData.notes || "",
        vitalSigns: timelineData.vitalSigns || {},
        documents: timelineData.documents || [],
        labResults: timelineData.labResults || [],
        aiAnalysis: timelineData.aiAnalysis || [],
        createdBy: req.user._id,
        createdAt: new Date(),
      };

      // Add timeline entry to patient
      patient.timeline.push(newTimelineEntry);
      await patient.save();

      // Populate the new entry
      await patient.populate(
        "timeline.doctor",
        "firstName lastName email specialization"
      );
      await patient.populate(
        "timeline.createdBy",
        "firstName lastName email role"
      );

      const addedEntry = patient.timeline[patient.timeline.length - 1];

      res.status(201).json({
        success: true,
        message: "Timeline entry added successfully",
        data: addedEntry,
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

// @route   PUT /api/timeline/:patientId/:entryIndex
// @desc    Update a timeline entry
// @access  Private
router.put(
  "/:patientId/:entryIndex",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId, entryIndex } = req.params;
      const updateData = req.body;

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
          message: "Not authorized to update this timeline entry",
        });
      }

      // Check if entry index is valid
      const index = parseInt(entryIndex);
      if (index < 0 || index >= patient.timeline.length) {
        return res.status(404).json({
          success: false,
          message: "Timeline entry not found",
        });
      }

      // Update the timeline entry
      const timelineEntry = patient.timeline[index];

      // Update fields if provided
      if (updateData.visitDate)
        timelineEntry.visitDate = new Date(updateData.visitDate);
      if (updateData.visitType) timelineEntry.visitType = updateData.visitType;
      if (updateData.doctor) timelineEntry.doctor = updateData.doctor;
      if (updateData.diagnosis !== undefined)
        timelineEntry.diagnosis = updateData.diagnosis;
      if (updateData.symptoms) timelineEntry.symptoms = updateData.symptoms;
      if (updateData.treatment !== undefined)
        timelineEntry.treatment = updateData.treatment;
      if (updateData.medications)
        timelineEntry.medications = updateData.medications;
      if (updateData.notes !== undefined)
        timelineEntry.notes = updateData.notes;
      if (updateData.vitalSigns)
        timelineEntry.vitalSigns = updateData.vitalSigns;
      if (updateData.documents) timelineEntry.documents = updateData.documents;
      if (updateData.labResults)
        timelineEntry.labResults = updateData.labResults;
      if (updateData.aiAnalysis)
        timelineEntry.aiAnalysis = updateData.aiAnalysis;

      await patient.save();

      // Populate the updated entry
      await patient.populate(
        "timeline.doctor",
        "firstName lastName email specialization"
      );
      await patient.populate(
        "timeline.createdBy",
        "firstName lastName email role"
      );

      res.json({
        success: true,
        message: "Timeline entry updated successfully",
        data: patient.timeline[index],
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

// @route   DELETE /api/timeline/:patientId/:entryIndex
// @desc    Delete a timeline entry
// @access  Private
router.delete(
  "/:patientId/:entryIndex",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId, entryIndex } = req.params;

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
          message: "Not authorized to delete this timeline entry",
        });
      }

      // Check if entry index is valid
      const index = parseInt(entryIndex);
      if (index < 0 || index >= patient.timeline.length) {
        return res.status(404).json({
          success: false,
          message: "Timeline entry not found",
        });
      }

      // Remove the timeline entry
      patient.timeline.splice(index, 1);
      await patient.save();

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
