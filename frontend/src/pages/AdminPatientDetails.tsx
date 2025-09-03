import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { patientAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  FileText,
  Clock,
  Shield,
  LogOut,
  Edit,
  Trash2,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  Brain,
} from "lucide-react";

interface PatientDetails {
  _id: string;
  patientId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  medicalConditions?: {
    diabetes?: boolean;
    hypertension?: boolean;
    heartDisease?: boolean;
    asthma?: boolean;
  };
  allergies?: string[];
  frontDeskNotes?: {
    initialDiagnosis?: string;
    symptoms?: string[];
    observations?: string;
  };
  assignedDoctor?: any;
  createdAt: string;
  lastVisited?: string;
  status?: string;
  bloodType?: string;
  maritalStatus?: string;
  occupation?: string;
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    coverageType?: string;
    effectiveDate?: string;
    expiryDate?: string;
    deductible?: string;
    copay?: string;
  };
  uploadedDocuments?: {
    _id: string;
    fileName: string;
    fileType: string;
    size: number;
    uploadDate: string;
    category: string;
  }[];
  aiAnalysisReports?: {
    _id: string;
    reportType: string;
    analysisDate: string;
    summary?: string;
    status: "completed" | "processing" | "failed";
    confidence?: number;
  }[];
  labResults?: {
    _id: string;
    testName: string;
    testDate: string;
    result: string;
    unit: string;
    notes?: string;
    status: "normal" | "abnormal" | "intermediate" | "outside range";
    normalRange?: string;
  }[];
}

const AdminPatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<PatientDetails | null>(
    null
  );

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getPatients();
      if (response.success && response.data) {
        const foundPatient = response.data.find(
          (p: any) => p._id === patientId
        );
        if (foundPatient) {
          // Ensure insuranceInfo field exists with default values
          const patientWithDefaults = {
            ...foundPatient,
            insuranceInfo: foundPatient.insuranceInfo || {
              provider: "",
              policyNumber: "",
              groupNumber: "",
              coverageType: "",
              effectiveDate: "",
              expiryDate: "",
              deductible: "",
              copay: "",
            },
          };
          setPatient(patientWithDefaults);
          setEditedPatient(patientWithDefaults); // Initialize editedPatient
        } else {
          setError("Patient not found");
        }
      } else {
        setError("Failed to load patient data");
      }
    } catch (error) {
      console.error("Error loading patient details:", error);
      setError("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;

    if (
      window.confirm(
        `Are you sure you want to delete patient ${patient.firstName} ${patient.lastName}? This action cannot be undone.`
      )
    ) {
      try {
        // TODO: Implement actual delete API call
        console.log("Deleting patient:", patient._id);
        alert("Delete functionality will be implemented");
      } catch (error) {
        console.error("Error deleting patient:", error);
        alert("Failed to delete patient");
      }
    }
  };

  const handleEdit = () => {
    if (!patient) return;

    setEditedPatient({
      ...patient,
      insuranceInfo: patient.insuranceInfo || {
        provider: "",
        policyNumber: "",
        groupNumber: "",
        coverageType: "",
        effectiveDate: "",
        expiryDate: "",
        deductible: "",
        copay: "",
      },
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPatient(patient); // Revert to original patient data
  };

  const handleSaveChanges = async () => {
    if (!editedPatient || !patient) return;

    try {
      const response = await patientAPI.updatePatient(
        patient._id,
        editedPatient
      );

      if (response.success) {
        setPatient(response.data);
        setIsEditing(false);
        setEditedPatient(null); // Clear editedPatient after saving
        alert("Patient updated successfully!");
      } else {
        alert("Failed to update patient: " + response.message);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Failed to update patient");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getDoctorName = (assignedDoctor: any) => {
    if (!assignedDoctor) return null;

    // If it's a string, return as is
    if (typeof assignedDoctor === "string") {
      return assignedDoctor;
    }

    // If it's an object, try to get the name
    if (typeof assignedDoctor === "object") {
      if (assignedDoctor.fullName) return assignedDoctor.fullName;
      if (assignedDoctor.firstName && assignedDoctor.lastName) {
        return `${assignedDoctor.firstName} ${assignedDoctor.lastName}`;
      }
      if (assignedDoctor.name) return assignedDoctor.name;
      if (assignedDoctor.email) return assignedDoctor.email;
    }

    return "Unknown Doctor";
  };

  const getVitalSignValue = (value: any) => {
    if (!value) return "N/A";

    // If it's a string or number, return as is
    if (typeof value === "string" || typeof value === "number") {
      return value.toString();
    }

    // If it's an object, try to extract the value and unit
    if (typeof value === "object") {
      if (value.value !== undefined && value.unit !== undefined) {
        return `${value.value} ${value.unit}`;
      }
      if (value.value !== undefined) {
        return value.value.toString();
      }
      if (value.unit !== undefined) {
        return value.unit.toString();
      }
      // If it's an object with other properties, try to find a meaningful value
      const keys = Object.keys(value);
      if (keys.length > 0) {
        return JSON.stringify(value);
      }
    }

    return "N/A";
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{error || "Patient not found"}</p>
            <button
              onClick={() => navigate("/admin")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin")}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Patient Details
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">
                  {patient.firstName?.charAt(0) || "P"}
                  {patient.lastName?.charAt(0) || "T"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-gray-600">
                  Patient ID: {patient.patientId || patient._id}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </span>
                  {patient.assignedDoctor && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Assigned to {getDoctorName(patient.assignedDoctor)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePatient}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPatient?.firstName || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            firstName: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    ) : (
                      patient.firstName || "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPatient?.lastName || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            lastName: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    ) : (
                      patient.lastName || "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedPatient?.dateOfBirth || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    ) : (
                      formatDate(patient.dateOfBirth)
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">
                    {isEditing ? (
                      <select
                        value={editedPatient?.gender || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            gender: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      patient.gender || "N/A"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPatient?.contactInfo?.phone || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            contactInfo: {
                              ...editedPatient!.contactInfo,
                              phone: e.target.value,
                            },
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    ) : (
                      patient.contactInfo?.phone || "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedPatient?.contactInfo?.email || ""}
                        onChange={(e) =>
                          setEditedPatient({
                            ...editedPatient!,
                            contactInfo: {
                              ...editedPatient!.contactInfo,
                              email: e.target.value,
                            },
                          })
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    ) : (
                      patient.contactInfo?.email || "N/A"
                    )}
                  </p>
                </div>
                {isEditing && patient.contactInfo?.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <div>
                        <label className="text-xs text-gray-500">Street</label>
                        <input
                          type="text"
                          value={
                            editedPatient?.contactInfo?.address?.street || ""
                          }
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient!,
                              contactInfo: {
                                ...editedPatient!.contactInfo,
                                address: {
                                  ...editedPatient!.contactInfo.address,
                                  street: e.target.value,
                                },
                              },
                            })
                          }
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">City</label>
                        <input
                          type="text"
                          value={
                            editedPatient?.contactInfo?.address?.city || ""
                          }
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient!,
                              contactInfo: {
                                ...editedPatient!.contactInfo,
                                address: {
                                  ...editedPatient!.contactInfo.address,
                                  city: e.target.value,
                                },
                              },
                            })
                          }
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">State</label>
                        <input
                          type="text"
                          value={
                            editedPatient?.contactInfo?.address?.state || ""
                          }
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient!,
                              contactInfo: {
                                ...editedPatient!.contactInfo,
                                address: {
                                  ...editedPatient!.contactInfo.address,
                                  state: e.target.value,
                                },
                              },
                            })
                          }
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          value={
                            editedPatient?.contactInfo?.address?.zipCode || ""
                          }
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient!,
                              contactInfo: {
                                ...editedPatient!.contactInfo,
                                address: {
                                  ...editedPatient!.contactInfo.address,
                                  zipCode: e.target.value,
                                },
                              },
                            })
                          }
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Country</label>
                        <input
                          type="text"
                          value={
                            editedPatient?.contactInfo?.address?.country || ""
                          }
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient!,
                              contactInfo: {
                                ...editedPatient!.contactInfo,
                                address: {
                                  ...editedPatient!.contactInfo.address,
                                  country: e.target.value,
                                },
                              },
                            })
                          }
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                Medical Information
              </h3>

              {/* Vital Signs */}
              {isEditing &&
                patient.vitalSigns &&
                Object.keys(patient.vitalSigns).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(patient.vitalSigns).map(
                        ([key, value]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </label>
                            <input
                              type="text"
                              value={
                                editedPatient?.vitalSigns?.[
                                  key as keyof typeof patient.vitalSigns
                                ] || ""
                              }
                              onChange={(e) =>
                                setEditedPatient({
                                  ...editedPatient!,
                                  vitalSigns: {
                                    ...editedPatient!.vitalSigns,
                                    [key]: e.target.value,
                                  },
                                })
                              }
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              {!isEditing &&
                patient.vitalSigns &&
                Object.keys(patient.vitalSigns).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Vital Signs
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(patient.vitalSigns).map(
                        ([key, value]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </label>
                            <p className="text-sm text-gray-900 mt-1">
                              {getVitalSignValue(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Medical Conditions */}
              {isEditing &&
                patient.medicalConditions &&
                Object.keys(patient.medicalConditions).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Medical Conditions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(patient.medicalConditions).map(
                        ([condition, hasCondition]) => (
                          <div key={condition} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={
                                editedPatient?.medicalConditions?.[
                                  condition as keyof typeof patient.medicalConditions
                                ] || false
                              }
                              onChange={(e) =>
                                setEditedPatient({
                                  ...editedPatient!,
                                  medicalConditions: {
                                    ...editedPatient!.medicalConditions,
                                    [condition]: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4 text-green-500 mr-2"
                            />
                            <span className="text-sm text-gray-900 capitalize">
                              {condition.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              {!isEditing &&
                patient.medicalConditions &&
                Object.keys(patient.medicalConditions).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Medical Conditions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(patient.medicalConditions).map(
                        ([condition, hasCondition]) => (
                          <div key={condition} className="flex items-center">
                            {hasCondition ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2" />
                            )}
                            <span className="text-sm text-gray-900 capitalize">
                              {condition.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Allergies */}
              {isEditing && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Allergies
                  </h4>
                  <div className="space-y-2">
                    {editedPatient?.allergies?.map((allergy, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={allergy}
                          onChange={(e) => {
                            const newAllergies = [
                              ...(editedPatient.allergies || []),
                            ];
                            newAllergies[index] = e.target.value;
                            setEditedPatient({
                              ...editedPatient,
                              allergies: newAllergies,
                            });
                          }}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1"
                        />
                        <button
                          onClick={() => {
                            const newAllergies =
                              editedPatient.allergies?.filter(
                                (_, i) => i !== index
                              ) || [];
                            setEditedPatient({
                              ...editedPatient,
                              allergies: newAllergies,
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditedPatient({
                          ...editedPatient!,
                          allergies: [...(editedPatient!.allergies || []), ""],
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Allergy
                    </button>
                  </div>
                </div>
              )}
              {!isEditing &&
                patient.allergies &&
                patient.allergies.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Allergies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Front Desk Notes */}
            {isEditing && patient.frontDeskNotes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Front Desk Notes
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Initial Diagnosis
                    </label>
                    <input
                      type="text"
                      value={
                        editedPatient?.frontDeskNotes?.initialDiagnosis || ""
                      }
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          frontDeskNotes: {
                            ...editedPatient!.frontDeskNotes,
                            initialDiagnosis: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Symptoms
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {patient.frontDeskNotes?.symptoms?.map(
                        (symptom, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                          >
                            <input
                              type="text"
                              value={
                                editedPatient?.frontDeskNotes?.symptoms?.[
                                  index
                                ] || ""
                              }
                              onChange={(e) => {
                                const newSymptoms = [
                                  ...(editedPatient?.frontDeskNotes?.symptoms ||
                                    []),
                                ];
                                newSymptoms[index] = e.target.value;
                                setEditedPatient({
                                  ...editedPatient!,
                                  frontDeskNotes: {
                                    ...editedPatient!.frontDeskNotes,
                                    symptoms: newSymptoms,
                                  },
                                });
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                            />
                          </span>
                        )
                      )}
                      <input
                        type="text"
                        placeholder="Add new symptom"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            const newSymptom = (
                              e.target as HTMLInputElement
                            ).value.trim();
                            if (
                              newSymptom &&
                              !patient.frontDeskNotes?.symptoms?.includes(
                                newSymptom
                              )
                            ) {
                              setEditedPatient({
                                ...editedPatient!,
                                frontDeskNotes: {
                                  ...editedPatient!.frontDeskNotes,
                                  symptoms: [
                                    ...(editedPatient!.frontDeskNotes
                                      ?.symptoms || []),
                                    newSymptom,
                                  ],
                                },
                              });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Observations
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.frontDeskNotes?.observations || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          frontDeskNotes: {
                            ...editedPatient!.frontDeskNotes,
                            observations: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            {!isEditing && patient.frontDeskNotes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Front Desk Notes
                </h3>
                <div className="space-y-4">
                  {patient.frontDeskNotes.initialDiagnosis && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Initial Diagnosis
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {patient.frontDeskNotes.initialDiagnosis}
                      </p>
                    </div>
                  )}
                  {patient.frontDeskNotes.symptoms &&
                    patient.frontDeskNotes.symptoms.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Symptoms
                        </label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {patient.frontDeskNotes.symptoms.map(
                            (symptom, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                              >
                                {symptom}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  {patient.frontDeskNotes.observations && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Observations
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {patient.frontDeskNotes.observations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Patient Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Patient Documents
              </h3>

              {/* Uploaded Documents */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Uploaded Documents
                </h4>
                {patient.uploadedDocuments &&
                patient.uploadedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {patient.uploadedDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.fileType} •{" "}
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-gray-400">
                              Uploaded {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {doc.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No documents uploaded
                  </p>
                )}
              </div>

              {/* AI Analysis Reports */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  AI Analysis Reports
                </h4>
                {patient.aiAnalysisReports &&
                patient.aiAnalysisReports.length > 0 ? (
                  <div className="space-y-3">
                    {patient.aiAnalysisReports.map((report, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {report.reportType}
                            </p>
                            <p className="text-xs text-gray-500">
                              Generated {formatDate(report.analysisDate)}
                            </p>
                            {report.summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {report.summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : report.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {report.status}
                          </span>
                          {report.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(report.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No AI analysis reports available
                  </p>
                )}
              </div>

              {/* Lab Results */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2 text-green-600" />
                  Lab Results
                </h4>
                {patient.labResults && patient.labResults.length > 0 ? (
                  <div className="space-y-3">
                    {patient.labResults.map((lab, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Stethoscope className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {lab.testName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Test Date: {formatDate(lab.testDate)}
                            </p>
                            <p className="text-xs text-gray-600">
                              Result: {lab.result} {lab.unit}
                            </p>
                            {lab.notes && (
                              <p className="text-xs text-gray-600 mt-1">
                                Notes: {lab.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lab.status === "normal"
                                ? "bg-green-100 text-green-800"
                                : lab.status === "abnormal"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {lab.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Range: {lab.normalRange}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No lab results available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - System Information */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            {isEditing && patient.emergencyContact && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.emergencyContact?.name || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          emergencyContact: {
                            ...editedPatient!.emergencyContact,
                            name: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={
                        editedPatient?.emergencyContact?.relationship || ""
                      }
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          emergencyContact: {
                            ...editedPatient!.emergencyContact,
                            relationship: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.emergencyContact?.phone || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          emergencyContact: {
                            ...editedPatient!.emergencyContact,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.emergencyContact?.email || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          emergencyContact: {
                            ...editedPatient!.emergencyContact,
                            email: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            {!isEditing && patient.emergencyContact && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.emergencyContact.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.emergencyContact.relationship || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.emergencyContact.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient.emergencyContact.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Details */}
            {isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Insurance Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.insuranceInfo?.provider || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            provider: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.insuranceInfo?.policyNumber || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            policyNumber: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Group Number
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.insuranceInfo?.groupNumber || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            groupNumber: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Coverage Type
                    </label>
                    <select
                      value={editedPatient?.insuranceInfo?.coverageType || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            coverageType: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value="">Select Coverage</option>
                      <option value="individual">Individual</option>
                      <option value="family">Family</option>
                      <option value="group">Group</option>
                      <option value="medicare">Medicare</option>
                      <option value="medicaid">Medicaid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={editedPatient?.insuranceInfo?.effectiveDate || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            effectiveDate: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editedPatient?.insuranceInfo?.expiryDate || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            expiryDate: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Deductible
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.insuranceInfo?.deductible || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            deductible: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Copay
                    </label>
                    <input
                      type="text"
                      value={editedPatient?.insuranceInfo?.copay || ""}
                      onChange={(e) =>
                        setEditedPatient({
                          ...editedPatient!,
                          insuranceInfo: {
                            ...editedPatient!.insuranceInfo,
                            copay: e.target.value,
                          },
                        })
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            {!isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Insurance Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Insurance Provider
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.provider || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Policy Number
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.policyNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Group Number
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.groupNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Coverage Type
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.coverageType ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {patient.insuranceInfo.coverageType}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Effective Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.effectiveDate
                        ? formatDate(patient.insuranceInfo.effectiveDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.expiryDate
                        ? formatDate(patient.insuranceInfo.expiryDate)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Deductible
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.deductible || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Copay
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {patient?.insuranceInfo?.copay || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPatientDetails;
