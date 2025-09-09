const express = require("express");
const {
  authenticateToken,
  requireFrontDeskCoordinator,
  requireFrontDeskCoordinatorOrAbove,
} = require("../middleware/auth");
const { Patient, User, UploadRecord } = require("../db");
const router = express.Router();

// @route   POST /api/front-desk-coordinator/patients
// @desc    Create a new patient (front desk coordinator only)
// @access  Private (front desk coordinator)
router.post(
  "/patients",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      console.log("🔍 Patient creation request received:", {
        body: req.body,
        user: req.user._id,
        timestamp: new Date().toISOString(),
      });

      const {
        patientId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        contactInfo,
        emergencyContact,
        medicalHistory,
        initialDiagnosis,
        symptoms,
        observations,
        assignedSeniorDoctorId,
      } = req.body;

      const frontDeskCoordinatorId = req.user._id;

      console.log("📋 Extracted data:", {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        hasContactInfo: !!contactInfo,
        hasEmergencyContact: !!emergencyContact,
        initialDiagnosis,
        symptoms,
        assignedSeniorDoctorId,
      });

      // Validate required fields
      if (!firstName || !lastName || !dateOfBirth || !gender) {
        console.log("❌ Required fields validation failed:", {
          firstName,
          lastName,
          dateOfBirth,
          gender,
        });
        return res.status(400).json({
          success: false,
          message:
            "First name, last name, date of birth, and gender are required",
        });
      }

      console.log("✅ Required fields validation passed");

      // Convert dateOfBirth to Date object if it's a string
      let parsedDateOfBirth = dateOfBirth;
      if (typeof dateOfBirth === "string") {
        parsedDateOfBirth = new Date(dateOfBirth);
        if (isNaN(parsedDateOfBirth.getTime())) {
          console.log("❌ Date parsing failed for:", dateOfBirth);
          return res.status(400).json({
            success: false,
            message: "Invalid date of birth format",
          });
        }
        console.log("✅ Date parsed successfully:", parsedDateOfBirth);
      }

      // Validate contact information
      if (!contactInfo?.phone || !contactInfo?.email) {
        console.log("❌ Contact info validation failed:", contactInfo);
        return res.status(400).json({
          success: false,
          message: "Phone and email are required",
        });
      }

      console.log("✅ Contact info validation passed");

      // Validate address
      if (
        !contactInfo?.address?.street ||
        !contactInfo?.address?.city ||
        !contactInfo?.address?.state ||
        !contactInfo?.address?.zipCode ||
        !contactInfo?.address?.country
      ) {
        console.log("❌ Address validation failed:", contactInfo?.address);
        return res.status(400).json({
          success: false,
          message:
            "Complete address (street, city, state, zip code, country) is required",
        });
      }

      console.log("✅ Address validation passed");

      // Validate emergency contact
      if (
        !emergencyContact?.name ||
        !emergencyContact?.relationship ||
        !emergencyContact?.phone ||
        !emergencyContact?.email
      ) {
        console.log(
          "❌ Emergency contact validation failed:",
          emergencyContact
        );
        return res.status(400).json({
          success: false,
          message:
            "Complete emergency contact information (name, relationship, phone, email) is required",
        });
      }

      console.log("✅ Emergency contact validation passed");

      // Validate medical information
      if (!symptoms || symptoms.length === 0) {
        // Make symptoms optional, provide default if empty
        req.body.symptoms = req.body.symptoms || ["General consultation"];
      }

      if (!initialDiagnosis) {
        return res.status(400).json({
          success: false,
          message: "Initial diagnosis is required",
        });
      }

      // Validate vitals - make them optional but validate format if provided
      if (req.body.vitalSigns) {
        // Only validate if vitals are provided, but don't require all fields
        const vitals = req.body.vitalSigns;
        if (vitals.weight && vitals.height && !vitals.bmi) {
          // Auto-calculate BMI if weight and height are provided
          const weight = parseFloat(vitals.weight);
          const height = parseFloat(vitals.height) / 100; // Convert cm to meters
          if (weight && height && height > 0) {
            req.body.vitalSigns.bmi = (weight / (height * height)).toFixed(1);
          }
        }
      }

      // Validate allergies - make them optional
      // If no allergies are provided, set to empty array
      if (!req.body.allergies) {
        req.body.allergies = [];
      }

      // Validate senior doctor assignment if provided
      if (assignedSeniorDoctorId) {
        const seniorDoctor = await User.findOne({
          _id: assignedSeniorDoctorId,
          role: "senior_doctor",
        });
        if (!seniorDoctor) {
          console.log(
            "❌ Senior doctor validation failed for ID:",
            assignedSeniorDoctorId
          );
          console.log(
            "📝 Making doctor assignment optional - patient will be created without assignment"
          );
          // Don't return error, just set assignedSeniorDoctorId to null
          req.body.assignedSeniorDoctorId = null;
        } else {
          console.log("✅ Senior doctor validation passed");
        }
      } else {
        console.log("📋 No senior doctor assigned");
      }

      // Create new patient
      const patient = new Patient({
        firstName,
        lastName,
        dateOfBirth: parsedDateOfBirth,
        gender,
        contactInfo,
        emergencyContact,
        vitalSigns: req.body.vitalSigns,
        medicalConditions: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          asthma: false,
          cancer: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisorder: false,
          ...req.body.medicalConditions, // Merge with provided values
        },
        allergies: req.body.allergies || [],
        medications: req.body.medications || [],
        surgicalHistory: req.body.surgicalHistory || [],
        familyHistory: req.body.familyHistory || [],
        lifestyleInfo: {
          smokingStatus: "non-smoker",
          alcoholConsumption: "none",
          exerciseFrequency: "not specified",
          dietRestrictions: [],
          stressLevel: "not specified",
          ...req.body.lifestyleInfo, // Merge with provided values
        },
        createdBy: frontDeskCoordinatorId,
        assignedDoctor: assignedSeniorDoctorId || null,
        status: "active",
        isActive: true,
        // Add front desk coordinator specific fields
        frontDeskNotes: {
          chiefComplaint: initialDiagnosis || "",
          presentIllness: symptoms ? symptoms.join(", ") : "",
          initialDiagnosis: initialDiagnosis || "",
          symptoms: symptoms || [],
          observations: req.body.observations || "",
          createdBy: frontDeskCoordinatorId,
          createdAt: new Date(),
        },
        uploadedDocuments: [],
        aiAnalysisReports: [],
        labResults: [],
        nextAppointment: null,
        notes: req.body.notes || "",
        lastVisited: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("📝 Patient object created, attempting to save...");
      console.log("🔍 Patient data structure:", {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        hasContactInfo: !!patient.contactInfo,
        hasEmergencyContact: !!patient.emergencyContact,
        hasVitalSigns: !!patient.vitalSigns,
        hasMedicalConditions: !!patient.medicalConditions,
        allergiesCount: patient.allergies?.length,
        hasFrontDeskNotes: !!patient.frontDeskNotes,
      });

      await patient.save();

      console.log(
        `✅ Patient created successfully by front desk coordinator ${frontDeskCoordinatorId}: ${patient.patientId}`
      );

      res.status(201).json({
        success: true,
        message: "Patient created successfully",
        data: {
          patientId: patient.patientId,
          name: `${patient.firstName} ${patient.lastName}`,
          assignedDoctor: patient.assignedDoctor,
          status: patient.status,
          createdBy: patient.createdBy,
          frontDeskNotes: patient.frontDeskNotes,
        },
      });
    } catch (error) {
      console.error("❌ Error creating patient:", error);
      res.status(500).json({
        success: false,
        message: "Error creating patient",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/front-desk-coordinator/patients
// @desc    Get all patients (front desk coordinator can view all patients)
// @access  Private (front desk coordinator)
router.get(
  "/patients",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const patients = await Patient.find({})
        .select("-__v")
        .populate("assignedDoctor", "firstName lastName email specialization")
        .populate("createdBy", "firstName lastName email role")
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        data: patients,
        count: patients.length,
        message: `Found ${patients.length} total patients`,
      });
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching patients",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/front-desk-coordinator/my-patients
// @desc    Get patients created by front desk coordinator
// @access  Private (front desk coordinator)
router.get(
  "/my-patients",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const frontDeskCoordinatorId = req.user._id;

      const patients = await Patient.find({
        createdBy: frontDeskCoordinatorId,
      })
        .select("-__v")
        .populate("assignedDoctor", "firstName lastName email specialization")
        .populate("createdBy", "firstName lastName email role")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: patients,
        count: patients.length,
        message: `Found ${patients.length} patients created by you`,
      });
    } catch (error) {
      console.error("❌ Error fetching patients:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching patients",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/front-desk-coordinator/patients/:patientId/diagnosis
// @desc    Update patient diagnosis and notes (front desk coordinator only)
// @access  Private (front desk coordinator)
router.put(
  "/patients/:patientId/diagnosis",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        initialDiagnosis,
        symptoms,
        observations,
        assignedSeniorDoctorId,
      } = req.body;

      const frontDeskCoordinatorId = req.user._id;

      // Find patient by ID (do not restrict to creator)
      const patient = await Patient.findById(patientId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Validate senior doctor assignment if provided
      if (assignedSeniorDoctorId) {
        const seniorDoctor = await User.findOne({
          _id: assignedSeniorDoctorId,
          role: "senior_doctor",
        });
        if (!seniorDoctor) {
          return res.status(400).json({
            success: false,
            message: "Invalid senior doctor ID",
          });
        }
      }

      // Update patient with new diagnosis and notes
      const updateData = {
        "frontDeskNotes.initialDiagnosis":
          initialDiagnosis || patient.frontDeskNotes?.initialDiagnosis,
        "frontDeskNotes.symptoms": symptoms || patient.frontDeskNotes?.symptoms,
        "frontDeskNotes.observations":
          observations || patient.frontDeskNotes?.observations,
        "frontDeskNotes.updatedAt": new Date(),
        "frontDeskNotes.updatedBy": frontDeskCoordinatorId,
      };

      if (assignedSeniorDoctorId) {
        updateData.assignedDoctor = assignedSeniorDoctorId;
        updateData.status = "active";
      }

      const updatedPatient = await Patient.findByIdAndUpdate(
        patient._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(
        `✅ Patient diagnosis updated by front desk coordinator ${frontDeskCoordinatorId}: ${patientId}`
      );

      res.json({
        success: true,
        message: "Patient diagnosis updated successfully",
        data: {
          patientId: updatedPatient.patientId,
          name: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
          assignedDoctor: updatedPatient.assignedDoctor,
          status: updatedPatient.status,
          frontDeskNotes: updatedPatient.frontDeskNotes,
        },
      });
    } catch (error) {
      console.error("❌ Error updating patient diagnosis:", error);
      res.status(500).json({
        success: false,
        message: "Error updating patient diagnosis",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/front-desk-coordinator/patients/:patientId
// @desc    Get specific patient details (front desk coordinator only)
// @access  Private (front desk coordinator)
router.get(
  "/patients/:patientId",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const frontDeskCoordinatorId = req.user._id;

      const patient = await Patient.findOne({
        patientId,
        createdBy: frontDeskCoordinatorId,
      }).select("-__v");

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found or you don't have access",
        });
      }

      res.json({
        success: true,
        data: patient,
        message: "Patient details retrieved successfully",
      });
    } catch (error) {
      console.error("❌ Error fetching patient details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching patient details",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/front-desk-coordinator/patients/:patientId
// @desc    Update patient details (front desk coordinator only)
// @access  Private (front desk coordinator)
router.put(
  "/patients/:patientId",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        contactInfo,
        frontDeskNotes,
        assignedDoctor,
      } = req.body;

      const frontDeskCoordinatorId = req.user._id;

      // Find patient by ID (do not restrict to creator)
      const patient = await Patient.findById(patientId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Prepare update data
      const updateData = {};

      // Update personal information if provided
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (gender !== undefined) updateData.gender = gender;

      // Update contact information if provided
      if (contactInfo) {
        if (contactInfo.phone !== undefined)
          updateData["contactInfo.phone"] = contactInfo.phone;
        if (contactInfo.email !== undefined)
          updateData["contactInfo.email"] = contactInfo.email;
        if (contactInfo.address) {
          if (contactInfo.address.street !== undefined)
            updateData["contactInfo.address.street"] =
              contactInfo.address.street;
          if (contactInfo.address.city !== undefined)
            updateData["contactInfo.address.city"] = contactInfo.address.city;
          if (contactInfo.address.state !== undefined)
            updateData["contactInfo.address.state"] = contactInfo.address.state;
          if (contactInfo.address.zipCode !== undefined)
            updateData["contactInfo.address.zipCode"] =
              contactInfo.address.zipCode;
          if (contactInfo.address.country !== undefined)
            updateData["contactInfo.address.country"] =
              contactInfo.address.country;
        }
      }

      // Update front desk notes if provided
      if (frontDeskNotes) {
        if (frontDeskNotes.initialDiagnosis !== undefined)
          updateData["frontDeskNotes.initialDiagnosis"] =
            frontDeskNotes.initialDiagnosis;
        if (frontDeskNotes.symptoms !== undefined)
          updateData["frontDeskNotes.symptoms"] = frontDeskNotes.symptoms;
        if (frontDeskNotes.observations !== undefined)
          updateData["frontDeskNotes.observations"] =
            frontDeskNotes.observations;
        updateData["frontDeskNotes.updatedAt"] = new Date();
        updateData["frontDeskNotes.updatedBy"] = frontDeskCoordinatorId;
      }

      // Update assigned doctor if provided
      if (assignedDoctor !== undefined) {
        updateData.assignedDoctor = assignedDoctor;
        updateData.status = assignedDoctor ? "active" : "active";
      }

      // Update the patient
      const updatedPatient = await Patient.findByIdAndUpdate(
        patient._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      console.log(
        `✅ Patient details updated by front desk coordinator ${frontDeskCoordinatorId}: ${patientId}`
      );

      res.json({
        success: true,
        message: "Patient details updated successfully",
        data: {
          patientId: updatedPatient.patientId,
          name: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
          assignedDoctor: updatedPatient.assignedDoctor,
          status: updatedPatient.status,
          frontDeskNotes: updatedPatient.frontDeskNotes,
        },
      });
    } catch (error) {
      console.error("❌ Error updating patient details:", error);
      res.status(500).json({
        success: false,
        message: "Error updating patient details",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/front-desk-coordinator/senior-doctors
// @desc    Get list of available senior doctors for assignment
// @access  Private (front desk coordinator)
router.get(
  "/senior-doctors",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const seniorDoctors = await User.find({
        role: "senior_doctor",
        isActive: true,
      }).select("firstName lastName email specialization hospital department");

      res.json({
        success: true,
        data: seniorDoctors,
        count: seniorDoctors.length,
        message: `Found ${seniorDoctors.length} available senior doctors`,
      });
    } catch (error) {
      console.error("❌ Error fetching senior doctors:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching senior doctors",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/front-desk-coordinator/patients/:patientId/assign-doctor
// @desc    Assign a doctor to a patient (front desk coordinator only)
// @access  Private (front desk coordinator)
router.put(
  "/patients/:patientId/assign-doctor",
  authenticateToken,
  requireFrontDeskCoordinator,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { doctorId } = req.body;

      const frontDeskCoordinatorId = req.user._id;

      // Validate doctor ID
      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: "Doctor ID is required",
        });
      }

      // Find and validate the doctor
      const doctor = await User.findOne({
        _id: doctorId,
        role: { $in: ["senior_doctor", "consulting_doctor"] },
        isActive: true,
      });

      if (!doctor) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID or doctor not available",
        });
      }

      // Find patient and verify ownership
      const patient = await Patient.findOne({
        _id: patientId,
        createdBy: frontDeskCoordinatorId,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found or you don't have access",
        });
      }

      // Check if patient is already assigned to this doctor
      if (
        patient.assignedDoctor &&
        patient.assignedDoctor.toString() === doctorId
      ) {
        return res.status(400).json({
          success: false,
          message: "Patient is already assigned to this doctor",
        });
      }

      // Update patient with new doctor assignment
      const updatedPatient = await Patient.findByIdAndUpdate(
        patient._id,
        {
          $set: {
            assignedDoctor: doctorId,
            status: "active",
            lastVisited: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      console.log(
        `✅ Doctor ${doctorId} assigned to patient ${patientId} by front desk coordinator ${frontDeskCoordinatorId}`
      );

      res.json({
        success: true,
        message: "Doctor assigned successfully",
        data: {
          patientId: updatedPatient.patientId,
          name: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
          assignedDoctor: updatedPatient.assignedDoctor,
          status: updatedPatient.status,
          assignedDoctorName: `${doctor.firstName} ${doctor.lastName}`,
        },
      });
    } catch (error) {
      console.error("❌ Error assigning doctor to patient:", error);
      res.status(500).json({
        success: false,
        message: "Error assigning doctor to patient",
        error: error.message,
      });
    }
  }
);

module.exports = router;
