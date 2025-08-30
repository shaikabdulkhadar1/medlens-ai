const jwt = require("jsonwebtoken");
const { User, Patient } = require("../db");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(["admin"]);

// Middleware to check if user is senior doctor or admin
const requireSeniorDoctorOrAdmin = requireRole(["admin", "senior_doctor"]);

// Middleware to check if user is consulting doctor, senior doctor, or admin
const requireAnyDoctor = requireRole([
  "admin",
  "senior_doctor",
  "consulting_doctor",
]);

// Middleware to check if user can access specific user data
const canAccessUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admin can access any user
    if (req.user.role === "admin") {
      req.targetUser = targetUser;
      return next();
    }

    // Senior doctor can access their assigned consulting doctors
    if (req.user.role === "senior_doctor") {
      const hasAccess = req.user.assignedConsultingDoctors.some(
        (doctorId) => doctorId.toString() === targetUserId
      );

      if (hasAccess) {
        req.targetUser = targetUser;
        return next();
      }
    }

    // Consulting doctor can only access themselves
    if (req.user.role === "consulting_doctor") {
      if (req.user._id.toString() === targetUserId) {
        req.targetUser = targetUser;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: "Access denied to this user",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking user access",
    });
  }
};

// Helper function to check if user can access patient data
const canAccessPatient = (user, patient) => {
  try {
    // Admin can access any patient
    if (user.role === "admin") {
      return true;
    }

    // Senior doctor can access patients of their assigned consulting doctors
    if (user.role === "senior_doctor") {
      // For now, senior doctors can access all patients
      // TODO: Implement proper hierarchy check when patient-doctor relationships are added
      return true;
    }

    // Consulting doctor can only access their own patients
    if (user.role === "consulting_doctor") {
      // Check if the patient is assigned to this consulting doctor
      return (
        patient.assignedDoctor &&
        patient.assignedDoctor.toString() === user._id.toString()
      );
    }

    return false;
  } catch (error) {
    console.error("Error in canAccessPatient:", error);
    return false;
  }
};

// Middleware to check if user can access patient data (for route middleware)
const canAccessPatientMiddleware = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID required",
      });
    }

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check access using the helper function
    if (!canAccessPatient(req.user, patient)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this patient",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking patient access",
    });
  }
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Helper function to get user hierarchy
const getUserHierarchy = async (userId) => {
  const user = await User.findById(userId)
    .populate("assignedSeniorDoctor", "firstName lastName email role")
    .populate("assignedConsultingDoctors", "firstName lastName email role");

  if (!user) return null;

  const hierarchy = {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    seniorDoctor: user.assignedSeniorDoctor,
    consultingDoctors: user.assignedConsultingDoctors,
  };

  return hierarchy;
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSeniorDoctorOrAdmin,
  requireAnyDoctor,
  canAccessUser,
  canAccessPatient,
  canAccessPatientMiddleware,
  generateToken,
  getUserHierarchy,
};
