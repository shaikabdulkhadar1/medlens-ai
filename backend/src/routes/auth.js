const express = require("express");
const Joi = require("joi");
const { User, Patient } = require("../db");
const {
  authenticateToken,
  requireAdmin,
  requireSeniorDoctorOrAdmin,
  canAccessUser,
  generateToken,
  getUserHierarchy,
} = require("../middleware/auth");

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string()
    .valid("admin", "senior_doctor", "consulting_doctor")
    .required(),
  specialization: Joi.string().max(100),
  licenseNumber: Joi.string(),
  hospital: Joi.string().max(100),
  department: Joi.string().max(100),
  phone: Joi.string(),
  assignedSeniorDoctor: Joi.string().hex().length(24), // MongoDB ObjectId
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  specialization: Joi.string().max(100),
  licenseNumber: Joi.string(),
  hospital: Joi.string().max(100),
  department: Joi.string().max(100),
  phone: Joi.string(),
  isActive: Joi.boolean(),
  assignedSeniorDoctor: Joi.string().hex().length(24),
  assignedConsultingDoctors: Joi.array().items(Joi.string().hex().length(24)),
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get user hierarchy
    const hierarchy = await getUserHierarchy(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.toPublicJSON(),
      hierarchy,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private (Admin)
router.post("/register", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      specialization,
      licenseNumber,
      hospital,
      department,
      phone,
      assignedSeniorDoctor,
    } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Validate assigned senior doctor if provided
    if (assignedSeniorDoctor) {
      const seniorDoctor = await User.findById(assignedSeniorDoctor);
      if (!seniorDoctor || seniorDoctor.role !== "senior_doctor") {
        return res.status(400).json({
          success: false,
          message: "Invalid senior doctor assignment",
        });
      }
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      specialization,
      licenseNumber,
      hospital,
      department,
      phone,
      assignedSeniorDoctor,
    });

    await user.save();

    // If consulting doctor is assigned to a senior doctor, update senior doctor's list
    if (assignedSeniorDoctor && role === "consulting_doctor") {
      await User.findByIdAndUpdate(assignedSeniorDoctor, {
        $push: { assignedConsultingDoctors: user._id },
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const hierarchy = await getUserHierarchy(req.user._id);

    res.json({
      success: true,
      user: req.user.toPublicJSON(),
      hierarchy,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put("/me", authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: value },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (with role-based filtering)
// @access  Private
router.get("/users", authenticateToken, async (req, res) => {
  try {
    let query = {};

    // Role-based filtering
    if (req.user.role === "admin") {
      // Admin can see all users
    } else if (req.user.role === "senior_doctor") {
      // Senior doctor can see their assigned consulting doctors
      query = {
        $or: [
          { _id: req.user._id }, // Include themselves
          { _id: { $in: req.user.assignedConsultingDoctors } }, // Their consulting doctors
        ],
      };
    } else if (req.user.role === "consulting_doctor") {
      // Consulting doctor can only see themselves
      query = { _id: req.user._id };
    }

    const users = await User.find(query).select("-password");

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
});

// @route   GET /api/auth/users/:userId
// @desc    Get specific user
// @access  Private (with role-based access control)
router.get(
  "/users/:userId",
  authenticateToken,
  canAccessUser,
  async (req, res) => {
    try {
      res.json({
        success: true,
        user: req.targetUser.toPublicJSON(),
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user",
      });
    }
  }
);

// @route   PUT /api/auth/users/:userId
// @desc    Update specific user
// @access  Private (Admin or Senior Doctor for their assigned doctors)
router.put(
  "/users/:userId",
  authenticateToken,
  canAccessUser,
  async (req, res) => {
    try {
      // Only admin and senior doctors can update other users
      if (
        req.user.role === "consulting_doctor" &&
        req.user._id.toString() !== req.params.userId
      ) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      // Validate input
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: value },
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }
);

// @route   DELETE /api/auth/users/:userId
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete(
  "/users/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      await User.findByIdAndDelete(req.params.userId);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);

// @route   POST /api/auth/assign-doctor
// @desc    Assign consulting doctor to senior doctor (Admin only)
// @access  Private (Admin)
router.post(
  "/assign-doctor",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { consultingDoctorId, seniorDoctorId } = req.body;

      if (!consultingDoctorId || !seniorDoctorId) {
        return res.status(400).json({
          success: false,
          message: "Both consulting doctor and senior doctor IDs are required",
        });
      }

      // Validate users exist and have correct roles
      const consultingDoctor = await User.findById(consultingDoctorId);
      const seniorDoctor = await User.findById(seniorDoctorId);

      if (!consultingDoctor || !seniorDoctor) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (consultingDoctor.role !== "consulting_doctor") {
        return res.status(400).json({
          success: false,
          message: "First user must be a consulting doctor",
        });
      }

      if (seniorDoctor.role !== "senior_doctor") {
        return res.status(400).json({
          success: false,
          message: "Second user must be a senior doctor",
        });
      }

      // Update assignments
      await User.findByIdAndUpdate(consultingDoctorId, {
        assignedSeniorDoctor: seniorDoctorId,
      });

      await User.findByIdAndUpdate(seniorDoctorId, {
        $addToSet: { assignedConsultingDoctors: consultingDoctorId },
      });

      res.json({
        success: true,
        message: "Doctor assignment successful",
      });
    } catch (error) {
      console.error("Assign doctor error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to assign doctor",
      });
    }
  }
);

// @route   GET /api/auth/patients
// @desc    Get patients for the authenticated user (role-based access)
// @access  Private
router.get("/patients", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    let patients = [];

    if (user.role === "admin") {
      // Admin can see all patients
      patients = await Patient.find().populate(
        "assignedDoctor",
        "firstName lastName email"
      );
    } else if (user.role === "senior_doctor") {
      // Senior doctor can see patients of their assigned consulting doctors
      const assignedConsultingDoctors = await User.find({
        assignedSeniorDoctor: user._id,
        role: "consulting_doctor",
      }).select("_id");

      const consultingDoctorIds = assignedConsultingDoctors.map(
        (doc) => doc._id
      );
      patients = await Patient.find({
        assignedDoctor: { $in: consultingDoctorIds },
      }).populate("assignedDoctor", "firstName lastName email");
    } else if (user.role === "consulting_doctor") {
      // Consulting doctor can only see their own patients
      patients = await Patient.find({
        assignedDoctor: user._id,
      }).populate("assignedDoctor", "firstName lastName email");
    }

    res.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
