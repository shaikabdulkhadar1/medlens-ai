const express = require("express");
const {
  authenticateToken,
  requireAnyDoctor,
  canAccessPatient,
} = require("../middleware/auth");
const { Patient } = require("../db");

const router = express.Router();

// @route   GET /api/visits/patient/:patientId
// @desc    Get visits for a patient (new visits array)
// @access  Private
router.get(
  "/patient/:patientId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this patient's visits",
        });
      }

      const visits = (patient.visits || []).sort(
        (a, b) => new Date(b.visitDate) - new Date(a.visitDate)
      );

      res.json({ success: true, data: visits, count: visits.length });
    } catch (error) {
      console.error("Get visits error:", error);
      res.status(500).json({ success: false, message: "Failed to get visits" });
    }
  }
);

// @route   POST /api/visits/patient/:patientId
// @desc    Add a new visit entry
// @access  Private
router.post(
  "/patient/:patientId",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        visitDate,
        initialDiagnosis,
        updates,
        summary,
        medicationsGiven,
      } = req.body;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to add visits for this patient",
        });
      }

      if (!visitDate) {
        return res
          .status(400)
          .json({ success: false, message: "visitDate is required" });
      }

      const newVisit = {
        visitDate: new Date(visitDate),
        initialDiagnosis: initialDiagnosis || "",
        updates: updates || "",
        summary: summary || "",
        medicationsGiven: Array.isArray(medicationsGiven)
          ? medicationsGiven
          : [],
      };

      patient.visits = patient.visits || [];
      patient.visits.push(newVisit);
      await patient.save();

      const addedVisit = patient.visits[patient.visits.length - 1];

      res.status(201).json({
        success: true,
        message: "Visit added successfully",
        data: addedVisit,
      });
    } catch (error) {
      console.error("Add visit error:", error);
      res.status(500).json({ success: false, message: "Failed to add visit" });
    }
  }
);

// @route   PUT /api/visits/:patientId/:visitIndex
// @desc    Update an existing visit entry
// @access  Private
router.put(
  "/:patientId/:visitIndex",
  authenticateToken,
  requireAnyDoctor,
  async (req, res) => {
    try {
      const { patientId, visitIndex } = req.params;
      const {
        visitDate,
        initialDiagnosis,
        updates,
        summary,
        medicationsGiven,
      } = req.body;

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Patient not found" });
      }

      if (!canAccessPatient(req.user, patient)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update visits for this patient",
        });
      }

      const index = parseInt(visitIndex, 10);
      if (!patient.visits || index < 0 || index >= patient.visits.length) {
        return res
          .status(404)
          .json({ success: false, message: "Visit not found" });
      }

      const visit = patient.visits[index];

      if (visitDate) visit.visitDate = new Date(visitDate);
      if (initialDiagnosis !== undefined)
        visit.initialDiagnosis = initialDiagnosis;
      if (updates !== undefined) visit.updates = updates;
      if (summary !== undefined) visit.summary = summary;
      if (Array.isArray(medicationsGiven))
        visit.medicationsGiven = medicationsGiven;

      await patient.save();

      res.json({
        success: true,
        message: "Visit updated successfully",
        data: visit,
      });
    } catch (error) {
      console.error("Update visit error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update visit" });
    }
  }
);

module.exports = router;
