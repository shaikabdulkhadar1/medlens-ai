import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Users,
  FileText,
  UserCheck,
  Plus,
  Edit,
  Search,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  LogOut,
} from "lucide-react";
import { frontDeskCoordinatorAPI, authAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Patient, CreatePatientRequest, User } from "../types";

const FrontDeskCoordinatorDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "patients" | "create-patient"
  >("overview");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [showUnassignedModal, setShowUnassignedModal] = useState(false);
  const [showUpdatePatientModal, setShowUpdatePatientModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreatePatientRequest>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male",
    contactInfo: {},
    emergencyContact: {},
    vitalSigns: {},
    medicalConditions: {},
    allergies: [],
    initialDiagnosis: "",
    symptoms: [],
  });

  const [diagnosisFormData, setDiagnosisFormData] = useState<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    contactInfo?: {
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
    initialDiagnosis: string;
    symptoms: string[];
    observations: string;
    assignedSeniorDoctorId?: string;
  }>({
    initialDiagnosis: "",
    symptoms: [],
    observations: "",
  });

  const [newSymptom, setNewSymptom] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  // Update patient form data
  const [updatePatientData, setUpdatePatientData] = useState<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    contactInfo?: {
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
      phone?: string;
      relationship?: string;
    };
    vitals?: {
      bloodPressure?: string;
      heartRate?: string;
      temperature?: string;
      weight?: string;
      height?: string;
      bmi?: string;
    };
    assignedDoctorId?: string;
    frontDeskNotes?: {
      initialDiagnosis?: string;
      symptoms?: string;
      observations?: string;
    };
  }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientsResponse, allDoctorsResponse] = await Promise.all([
        frontDeskCoordinatorAPI.getPatients(),
        authAPI.getUsers(),
      ]);

      if (patientsResponse.success) {
        setPatients(patientsResponse.data || []);
      }

      if (allDoctorsResponse.success) {
        // Filter to only include doctors (senior_doctor, consulting_doctor) - exclude admin
        const doctors =
          allDoctorsResponse.users?.filter(
            (user) =>
              user.role === "senior_doctor" || user.role === "consulting_doctor"
          ) || [];
        setAllDoctors(doctors);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePatient = async () => {
    try {
      const response = await frontDeskCoordinatorAPI.createPatient(
        createFormData
      );
      if (response.success) {
        alert("Patient created successfully!");
        setShowCreateForm(false);
        setCreateFormData({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "male",
          contactInfo: {},
          emergencyContact: {},
          vitalSigns: {},
          medicalConditions: {},
          allergies: [],
          initialDiagnosis: "",
          symptoms: [],
        });
        loadData();
      } else {
        alert(`Failed to create patient: ${response.message}`);
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Error creating patient");
    }
  };

  const handleUpdateDiagnosis = async () => {
    console.log("handleUpdateDiagnosis called");
    console.log("selectedPatient:", selectedPatient);
    console.log("showDiagnosisForm:", showDiagnosisForm);

    if (!selectedPatient) {
      console.error("selectedPatient is null in handleUpdateDiagnosis");
      alert("No patient selected. Please try again.");
      return;
    }

    if (!selectedPatient._id) {
      console.error("selectedPatient._id is null/undefined:", selectedPatient);
      alert("Patient ID is missing. Please try again.");
      return;
    }

    try {
      console.log(
        "Updating diagnosis and personal details for patient:",
        selectedPatient
      );
      console.log("Patient ID:", selectedPatient._id);
      console.log("Form data:", diagnosisFormData);

      // Prepare update data for both personal details and diagnosis
      const updateData = {
        firstName: diagnosisFormData.firstName,
        lastName: diagnosisFormData.lastName,
        dateOfBirth: diagnosisFormData.dateOfBirth,
        gender: diagnosisFormData.gender,
        contactInfo: diagnosisFormData.contactInfo,
        frontDeskNotes: {
          initialDiagnosis: diagnosisFormData.initialDiagnosis,
          symptoms: diagnosisFormData.symptoms,
          observations: diagnosisFormData.observations,
        },
        assignedDoctor: diagnosisFormData.assignedSeniorDoctorId || null,
      };

      const response = await frontDeskCoordinatorAPI.updatePatient(
        selectedPatient._id,
        updateData
      );
      if (response.success) {
        alert("Patient details and diagnosis updated successfully!");
        setShowDiagnosisForm(false);
        setSelectedPatient(null);
        setDiagnosisFormData({
          initialDiagnosis: "",
          symptoms: [],
          observations: "",
        });
        loadData();
      } else {
        alert(`Failed to update patient: ${response.message}`);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Error updating patient");
    }
  };

  const addSymptom = () => {
    if (
      newSymptom.trim() &&
      !diagnosisFormData.symptoms?.includes(newSymptom.trim())
    ) {
      setDiagnosisFormData((prev) => ({
        ...prev,
        symptoms: [...(prev.symptoms || []), newSymptom.trim()],
      }));
      setNewSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setDiagnosisFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms?.filter((s) => s !== symptom) || [],
    }));
  };

  const openDiagnosisForm = (patient: Patient) => {
    console.log("openDiagnosisForm called with patient:", patient);
    console.log("Patient ID:", patient._id);

    setSelectedPatient(patient);
    setDiagnosisFormData({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dateOfBirth: patient.dateOfBirth || "",
      gender: patient.gender || "",
      contactInfo: {
        phone: patient.contactInfo?.phone || "",
        email: patient.contactInfo?.email || "",
        address: {
          street: patient.contactInfo?.address?.street || "",
          city: patient.contactInfo?.address?.city || "",
          state: patient.contactInfo?.address?.state || "",
          zipCode: patient.contactInfo?.address?.zipCode || "",
          country: patient.contactInfo?.address?.country || "",
        },
      },
      initialDiagnosis: patient.frontDeskNotes?.initialDiagnosis || "",
      symptoms: patient.frontDeskNotes?.symptoms || [],
      observations: patient.frontDeskNotes?.observations || "",
      assignedSeniorDoctorId:
        patient.assignedDoctor && typeof patient.assignedDoctor === "object"
          ? patient.assignedDoctor._id
          : patient.assignedDoctor || "",
    });
    setShowDiagnosisForm(true);

    console.log("Diagnosis form opened, selectedPatient should be set");
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    // Only allow active or case closed status
    const normalizedStatus =
      status === "case_closed" ? "case_closed" : "active";

    const statusConfig = {
      active: {
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
        label: "Active",
      },
      case_closed: {
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle,
        label: "Case Closed",
      },
    };

    const config = statusConfig[normalizedStatus as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      // Calculate BMI if weight and height are provided
      let bmi = "";
      if (
        updatePatientData.vitals?.weight &&
        updatePatientData.vitals?.height
      ) {
        const weightKg = parseFloat(updatePatientData.vitals.weight) * 0.453592; // Convert lbs to kg
        const heightM = parseFloat(updatePatientData.vitals.height) * 0.0254; // Convert inches to meters
        bmi = (weightKg / (heightM * heightM)).toFixed(1);
      }

      const updateData = {
        ...updatePatientData,
        vitals: {
          ...updatePatientData.vitals,
          bmi: bmi || updatePatientData.vitals?.bmi,
        },
      };

      const response = await frontDeskCoordinatorAPI.updatePatient(
        selectedPatient._id,
        updateData
      );

      if (response.success) {
        alert("Patient updated successfully!");
        setShowUpdatePatientModal(false);
        setUpdatePatientData({});
        loadData();
      } else {
        alert(`Failed to update patient: ${response.message}`);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Error updating patient");
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedPatient || !updatePatientData.assignedDoctorId) return;

    try {
      const response = await frontDeskCoordinatorAPI.assignDoctor(
        selectedPatient._id,
        updatePatientData.assignedDoctorId
      );

      if (response.success) {
        alert("Doctor assigned successfully!");
        setUpdatePatientData((prev) => ({ ...prev, assignedDoctorId: "" }));
        loadData();
      } else {
        alert(`Failed to assign doctor: ${response.message}`);
      }
    } catch (error) {
      console.error("Error assigning doctor:", error);
      alert("Error assigning doctor");
    }
  };

  const handleAssignDoctorFromModal = async (doctorId: string) => {
    if (!selectedPatient) return;

    try {
      const response = await frontDeskCoordinatorAPI.assignDoctor(
        selectedPatient._id,
        doctorId
      );

      if (response.success) {
        alert("Doctor assigned successfully!");
        setShowAssignDoctorModal(false);
        setSelectedPatient(null);
        loadData();
      } else {
        alert(`Failed to assign doctor: ${response.message}`);
      }
    } catch (error) {
      console.error("Error assigning doctor:", error);
      alert("Error assigning doctor");
    }
  };

  const handleUnassignDoctor = async () => {
    if (!selectedPatient) return;

    try {
      const response = await frontDeskCoordinatorAPI.unassignDoctor(
        selectedPatient._id
      );

      if (response.success) {
        alert("Doctor unassigned successfully!");
        loadData();
      } else {
        alert(`Failed to unassign doctor: ${response.message}`);
      }
    } catch (error) {
      console.error("Error unassigning doctor:", error);
      alert("Error unassigning doctor");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Front Desk Coordinator Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Manage patients and provide initial assessments
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Patient</span>
              </button>
              <button
                onClick={logout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: Users },
              { id: "patients", label: "All Patients", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Patients
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patients.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Cases
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {patients.filter((p) => p.status === "active").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={() => setShowDoctorsModal(true)}
                  className="w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Available Doctors
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {allDoctors.length}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={() => setShowUnassignedModal(true)}
                  className="w-full text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Unassigned Patients
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {patients.filter((p) => !p.assignedDoctor).length}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Patients
                </h3>
              </div>
              <div className="p-6">
                {patients.slice(0, 5).length > 0 ? (
                  <div className="space-y-4">
                    {patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {patient.firstName[0]}
                              {patient.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              ID: {patient.patientId}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Last visited:{" "}
                                  {formatDate(
                                    patient.lastVisited || patient.updatedAt
                                  )}
                                </span>
                              </span>
                            </div>
                            {patient.assignedDoctor && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Dr.{" "}
                                  {typeof patient.assignedDoctor === "object"
                                    ? `${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}`
                                    : "Assigned"}
                                </span>
                              </div>
                            )}
                            {!patient.assignedDoctor && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Unassigned
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(patient.status || "active")}
                          <button
                            onClick={() => openDiagnosisForm(patient)}
                            className="btn-secondary text-sm"
                          >
                            Update Diagnosis
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No patients yet. Create your first patient to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search patients by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Patient</span>
                </button>
              </div>
            </div>

            {/* Patients List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  All Patients ({filteredPatients.length})
                </h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading patients...</p>
                  </div>
                ) : filteredPatients.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium text-lg">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Patient ID: {patient.patientId}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(patient.status || "active")}
                            <button
                              onClick={() => openDiagnosisForm(patient)}
                              className="btn-secondary text-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <UserCheck className="w-4 h-4" />
                            <span>Gender: {patient.gender}</span>
                          </div>
                          {patient.contactInfo?.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{patient.contactInfo.phone}</span>
                            </div>
                          )}
                          {patient.contactInfo?.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{patient.contactInfo.email}</span>
                            </div>
                          )}
                          {patient.contactInfo?.address?.city && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {patient.contactInfo.address.city},{" "}
                                {patient.contactInfo.address.state}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Last Visit:{" "}
                              {formatDate(
                                patient.lastVisited || patient.updatedAt
                              )}
                            </span>
                          </div>
                          {patient.assignedDoctor && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <UserCheck className="w-4 h-4" />
                              <span>
                                Assigned: Dr.{" "}
                                {typeof patient.assignedDoctor === "object"
                                  ? `${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}`
                                  : "Senior Doctor"}
                              </span>
                            </div>
                          )}
                          {!patient.assignedDoctor && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <UserCheck className="w-4 h-4" />
                              <span className="text-yellow-600 font-medium">
                                Unassigned
                              </span>
                            </div>
                          )}
                        </div>

                        {patient.frontDeskNotes && (
                          <div className="border-t border-gray-200 pt-4">
                            <h5 className="font-medium text-gray-900 mb-2">
                              Initial Assessment
                            </h5>
                            <div className="space-y-2">
                              {patient.frontDeskNotes.initialDiagnosis && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Diagnosis:{" "}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {patient.frontDeskNotes.initialDiagnosis}
                                  </span>
                                </div>
                              )}
                              {patient.frontDeskNotes.symptoms &&
                                patient.frontDeskNotes.symptoms.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">
                                      Symptoms:{" "}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {patient.frontDeskNotes.symptoms.map(
                                        (symptom, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
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
                                  <span className="text-sm font-medium text-gray-700">
                                    Observations:{" "}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {patient.frontDeskNotes.observations}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!patient.assignedDoctor && (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <UserCheck className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Assignment Status
                                </span>
                              </div>
                              <span className="text-sm text-yellow-600 font-medium">
                                Unassigned - Available for Assignment
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {searchTerm
                        ? "No patients found matching your search."
                        : "No patients yet. Create your first patient to get started."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New Patient
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2">
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.firstName}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.lastName}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={createFormData.dateOfBirth}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender *
                      </label>
                      <select
                        value={createFormData.gender}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            gender: e.target.value as any,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={createFormData.contactInfo?.phone || ""}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={createFormData.contactInfo?.email || ""}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="patient@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={
                            createFormData.contactInfo?.address?.street || ""
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo?.address,
                                  street: e.target.value,
                                },
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Street Address"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={
                            createFormData.contactInfo?.address?.city || ""
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo?.address,
                                  city: e.target.value,
                                },
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="City"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <input
                          type="text"
                          value={
                            createFormData.contactInfo?.address?.state || ""
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo?.address,
                                  state: e.target.value,
                                },
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="State"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={
                            createFormData.contactInfo?.address?.zipCode || ""
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo?.address,
                                  zipCode: e.target.value,
                                },
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="ZIP Code"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={
                            createFormData.contactInfo?.address?.country || ""
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                address: {
                                  ...prev.contactInfo?.address,
                                  country: e.target.value,
                                },
                              },
                            }))
                          }
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Country"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Emergency Contact *
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.emergencyContact?.name || ""}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              name: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Relationship *
                      </label>
                      <input
                        type="text"
                        value={
                          createFormData.emergencyContact?.relationship || ""
                        }
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              relationship: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Spouse, Parent, etc."
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Phone *
                      </label>
                      <input
                        type="tel"
                        value={createFormData.emergencyContact?.phone || ""}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Contact Email *
                      </label>
                      <input
                        type="email"
                        value={createFormData.emergencyContact?.email || ""}
                        onChange={(e) =>
                          setCreateFormData((prev) => ({
                            ...prev,
                            emergencyContact: {
                              ...prev.emergencyContact,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="emergency@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Medical Information *
                  </h4>

                  {/* Symptoms */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptoms *
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add a symptom..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newSymptom.trim()) {
                            e.preventDefault();
                            setCreateFormData((prev) => ({
                              ...prev,
                              symptoms: [
                                ...(prev.symptoms || []),
                                newSymptom.trim(),
                              ],
                            }));
                            setNewSymptom("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSymptom.trim()) {
                            setCreateFormData((prev) => ({
                              ...prev,
                              symptoms: [
                                ...(prev.symptoms || []),
                                newSymptom.trim(),
                              ],
                            }));
                            setNewSymptom("");
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {createFormData.symptoms &&
                      createFormData.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {createFormData.symptoms.map((symptom, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {symptom}
                              <button
                                type="button"
                                onClick={() =>
                                  setCreateFormData((prev) => ({
                                    ...prev,
                                    symptoms:
                                      prev.symptoms?.filter(
                                        (_, i) => i !== index
                                      ) || [],
                                  }))
                                }
                                className="ml-1.5 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    {(!createFormData.symptoms ||
                      createFormData.symptoms.length === 0) && (
                      <p className="text-sm text-red-600 mt-1">
                        At least one symptom is required
                      </p>
                    )}
                  </div>

                  {/* Initial Diagnosis */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Diagnosis *
                    </label>
                    <textarea
                      value={createFormData.initialDiagnosis}
                      onChange={(e) =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          initialDiagnosis: e.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter initial diagnosis..."
                      required
                    />
                  </div>

                  {/* Initial Vitals */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Vitals *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Blood Pressure
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.bloodPressure || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                bloodPressure: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 120/80 mmHg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Heart Rate
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.heartRate || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                heartRate: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 72 bpm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Temperature
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.temperature || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                temperature: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 98.6°F"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Weight
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.weight || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                weight: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 70 kg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          Height
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.height || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                height: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 170 cm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">
                          BMI
                        </label>
                        <input
                          type="text"
                          value={createFormData.vitalSigns?.bmi || ""}
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              vitalSigns: {
                                ...prev.vitalSigns,
                                bmi: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 24.2"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions *
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="diabetes"
                          checked={
                            createFormData.medicalConditions?.diabetes || false
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              medicalConditions: {
                                ...prev.medicalConditions,
                                diabetes: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="diabetes"
                          className="text-sm text-gray-700"
                        >
                          Diabetes
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="hypertension"
                          checked={
                            createFormData.medicalConditions?.hypertension ||
                            false
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              medicalConditions: {
                                ...prev.medicalConditions,
                                hypertension: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="hypertension"
                          className="text-sm text-gray-700"
                        >
                          Hypertension
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="heartDisease"
                          checked={
                            createFormData.medicalConditions?.heartDisease ||
                            false
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              medicalConditions: {
                                ...prev.medicalConditions,
                                heartDisease: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="heartDisease"
                          className="text-sm text-gray-700"
                        >
                          Heart Disease
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="asthma"
                          checked={
                            createFormData.medicalConditions?.asthma || false
                          }
                          onChange={(e) =>
                            setCreateFormData((prev) => ({
                              ...prev,
                              medicalConditions: {
                                ...prev.medicalConditions,
                                asthma: e.target.checked,
                              },
                            }))
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="asthma"
                          className="text-sm text-sm text-gray-700"
                        >
                          Asthma
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies *
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add an allergy..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newAllergy.trim()) {
                            e.preventDefault();
                            setCreateFormData((prev) => ({
                              ...prev,
                              allergies: [
                                ...(prev.allergies || []),
                                newAllergy.trim(),
                              ],
                            }));
                            setNewAllergy("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAllergy.trim()) {
                            setCreateFormData((prev) => ({
                              ...prev,
                              allergies: [
                                ...(prev.allergies || []),
                                newAllergy.trim(),
                              ],
                            }));
                            setNewAllergy("");
                          }
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {createFormData.allergies &&
                      createFormData.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {createFormData.allergies.map((allergy, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {allergy}
                              <button
                                type="button"
                                onClick={() =>
                                  setCreateFormData((prev) => ({
                                    ...prev,
                                    allergies:
                                      prev.allergies?.filter(
                                        (_, i) => i !== index
                                      ) || [],
                                  }))
                                }
                                className="ml-1.5 text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    {(!createFormData.allergies ||
                      createFormData.allergies.length === 0) && (
                      <p className="text-sm text-red-600 mt-1">
                        At least one allergy is required (or mark as "None" if
                        no allergies)
                      </p>
                    )}
                  </div>
                </div>

                {/* Doctor Assignment Section */}
                <div className="pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Doctor Assignment
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assign to Doctor
                    </label>
                    <select
                      value={createFormData.assignedSeniorDoctorId || ""}
                      onChange={(e) =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          assignedSeniorDoctorId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a doctor...</option>
                      {allDoctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName} -{" "}
                          {doctor.specialization || doctor.role} -{" "}
                          {doctor.hospital || "General"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePatient}
                  disabled={
                    !createFormData.firstName ||
                    !createFormData.lastName ||
                    !createFormData.dateOfBirth ||
                    !createFormData.contactInfo?.phone ||
                    !createFormData.contactInfo?.email ||
                    !createFormData.contactInfo?.address?.street ||
                    !createFormData.contactInfo?.address?.city ||
                    !createFormData.contactInfo?.address?.state ||
                    !createFormData.contactInfo?.address?.zipCode ||
                    !createFormData.contactInfo?.address?.country ||
                    !createFormData.emergencyContact?.name ||
                    !createFormData.emergencyContact?.relationship ||
                    !createFormData.emergencyContact?.phone ||
                    !createFormData.emergencyContact?.email ||
                    !createFormData.vitalSigns?.bloodPressure ||
                    !createFormData.vitalSigns?.heartRate ||
                    !createFormData.vitalSigns?.temperature ||
                    !createFormData.vitalSigns?.weight ||
                    !createFormData.vitalSigns?.height ||
                    !createFormData.vitalSigns?.bmi ||
                    !createFormData.symptoms ||
                    createFormData.symptoms.length === 0 ||
                    !createFormData.initialDiagnosis ||
                    !createFormData.allergies ||
                    createFormData.allergies.length === 0
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Diagnosis Modal */}
      {showDiagnosisForm && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Update Details - {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </h3>
                <button
                  onClick={() => setShowDiagnosisForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.firstName ||
                          selectedPatient.firstName ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.lastName ||
                          selectedPatient.lastName ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={
                          diagnosisFormData.dateOfBirth ||
                          selectedPatient.dateOfBirth ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            dateOfBirth: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        value={
                          diagnosisFormData.gender ||
                          selectedPatient.gender ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={
                          diagnosisFormData.contactInfo?.phone ||
                          selectedPatient.contactInfo?.phone ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={
                          diagnosisFormData.contactInfo?.email ||
                          selectedPatient.contactInfo?.email ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.contactInfo?.address?.street ||
                          selectedPatient.contactInfo?.address?.street ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo?.address,
                                street: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.contactInfo?.address?.city ||
                          selectedPatient.contactInfo?.address?.city ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo?.address,
                                city: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.contactInfo?.address?.state ||
                          selectedPatient.contactInfo?.address?.state ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo?.address,
                                state: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={
                          diagnosisFormData.contactInfo?.address?.zipCode ||
                          selectedPatient.contactInfo?.address?.zipCode ||
                          ""
                        }
                        onChange={(e) =>
                          setDiagnosisFormData((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo?.address,
                                zipCode: e.target.value,
                              },
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Medical Information
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Diagnosis
                    </label>
                    <textarea
                      value={diagnosisFormData.initialDiagnosis}
                      onChange={(e) =>
                        setDiagnosisFormData((prev) => ({
                          ...prev,
                          initialDiagnosis: e.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter initial diagnosis..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Symptoms
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add a symptom..."
                      />
                      <button
                        onClick={addSymptom}
                        className="btn-secondary px-4 py-2"
                      >
                        Add
                      </button>
                    </div>
                    {diagnosisFormData.symptoms &&
                      diagnosisFormData.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {diagnosisFormData.symptoms.map((symptom, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                              {symptom}
                              <button
                                onClick={() => removeSymptom(symptom)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Observations
                    </label>
                    <textarea
                      value={diagnosisFormData.observations}
                      onChange={(e) =>
                        setDiagnosisFormData((prev) => ({
                          ...prev,
                          observations: e.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter observations..."
                    />
                  </div>
                </div>

                {/* Doctor Assignment Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Doctor Assignment
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assign to Doctor
                    </label>
                    <select
                      value={diagnosisFormData.assignedSeniorDoctorId || ""}
                      onChange={(e) =>
                        setDiagnosisFormData((prev) => ({
                          ...prev,
                          assignedSeniorDoctorId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a doctor...</option>
                      {allDoctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.firstName} {doctor.lastName} -{" "}
                          {doctor.specialization || doctor.role} -{" "}
                          {doctor.hospital || "General"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDiagnosisForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleUpdateDiagnosis} className="btn-primary">
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Modal */}
      {showDoctorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Available Doctors ({allDoctors.length})
                </h3>
                <button
                  onClick={() => setShowDoctorsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {allDoctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allDoctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-xl">
                            {doctor.firstName[0]}
                            {doctor.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {doctor.specialization || "General Medicine"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {doctor.role.replace("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {doctor.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{doctor.email}</span>
                          </div>
                        )}

                        {doctor.hospital && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.department && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Department: {doctor.department}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No doctors available at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Patients Modal */}
      {showUnassignedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Unassigned Patients (
                  {patients.filter((p) => !p.assignedDoctor).length})
                </h3>
                <button
                  onClick={() => setShowUnassignedModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {patients.filter((p) => !p.assignedDoctor).length > 0 ? (
                <div className="space-y-4">
                  {patients
                    .filter((p) => !p.assignedDoctor)
                    .map((patient) => (
                      <div
                        key={patient._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                ID: {patient.patientId}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Last visited:{" "}
                                    {formatDate(
                                      patient.lastVisited || patient.updatedAt
                                    )}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <UserCheck className="w-3 h-3" />
                                  <span>Unassigned</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowAssignDoctorModal(true);
                                setShowUnassignedModal(false);
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              Assign to Doctor
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No unassigned patients at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Patient Modal */}
      {showUpdatePatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Update Patient: {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </h3>
                <button
                  onClick={() => setShowUpdatePatientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={
                            updatePatientData.firstName ||
                            selectedPatient.firstName
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={
                            updatePatientData.lastName ||
                            selectedPatient.lastName
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={
                            updatePatientData.dateOfBirth ||
                            selectedPatient.dateOfBirth
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              dateOfBirth: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={
                            updatePatientData.gender || selectedPatient.gender
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              gender: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Contact Information
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={
                            updatePatientData.contactInfo?.phone ||
                            selectedPatient.contactInfo?.phone ||
                            ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                phone: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={
                            updatePatientData.contactInfo?.email ||
                            selectedPatient.contactInfo?.email ||
                            ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              contactInfo: {
                                ...prev.contactInfo,
                                email: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street
                          </label>
                          <input
                            type="text"
                            value={
                              updatePatientData.contactInfo?.address?.street ||
                              (typeof selectedPatient.contactInfo?.address ===
                              "object"
                                ? selectedPatient.contactInfo.address.street
                                : "") ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                contactInfo: {
                                  ...prev.contactInfo,
                                  address: {
                                    ...prev.contactInfo?.address,
                                    street: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={
                              updatePatientData.contactInfo?.address?.city ||
                              (typeof selectedPatient.contactInfo?.address ===
                              "object"
                                ? selectedPatient.contactInfo.address.city
                                : "") ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                contactInfo: {
                                  ...prev.contactInfo,
                                  address: {
                                    ...prev.contactInfo?.address,
                                    city: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={
                              updatePatientData.contactInfo?.address?.state ||
                              (typeof selectedPatient.contactInfo?.address ===
                              "object"
                                ? selectedPatient.contactInfo.address.state
                                : "") ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                contactInfo: {
                                  ...prev.contactInfo,
                                  address: {
                                    ...prev.contactInfo?.address,
                                    state: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={
                              updatePatientData.contactInfo?.address?.zipCode ||
                              (typeof selectedPatient.contactInfo?.address ===
                              "object"
                                ? selectedPatient.contactInfo.address.zipCode
                                : "") ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                contactInfo: {
                                  ...prev.contactInfo,
                                  address: {
                                    ...prev.contactInfo?.address,
                                    zipCode: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Emergency Contact
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            value={
                              updatePatientData.emergencyContact?.name ||
                              selectedPatient.emergencyContact?.name ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                emergencyContact: {
                                  ...prev.emergencyContact,
                                  name: e.target.value,
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact Phone
                          </label>
                          <input
                            type="tel"
                            value={
                              updatePatientData.emergencyContact?.phone ||
                              selectedPatient.emergencyContact?.phone ||
                              ""
                            }
                            onChange={(e) =>
                              setUpdatePatientData((prev) => ({
                                ...prev,
                                emergencyContact: {
                                  ...prev.emergencyContact,
                                  phone: e.target.value,
                                },
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          value={
                            updatePatientData.emergencyContact?.relationship ||
                            selectedPatient.emergencyContact?.relationship ||
                            ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              emergencyContact: {
                                ...prev.emergencyContact,
                                relationship: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information & Doctor Assignment */}
                <div className="space-y-6">
                  {/* Vitals */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Vitals & Medical Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Pressure
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 120/80"
                          value={updatePatientData.vitals?.bloodPressure || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              vitals: {
                                ...prev.vitals,
                                bloodPressure: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heart Rate (BPM)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 72"
                          value={updatePatientData.vitals?.heartRate || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              vitals: {
                                ...prev.vitals,
                                heartRate: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature (°F)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 98.6"
                          value={updatePatientData.vitals?.temperature || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              vitals: {
                                ...prev.vitals,
                                temperature: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (lbs)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 150"
                          value={updatePatientData.vitals?.weight || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              vitals: {
                                ...prev.vitals,
                                weight: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height (inches)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g., 65"
                          value={updatePatientData.vitals?.height || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              vitals: {
                                ...prev.vitals,
                                height: e.target.value,
                              },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          BMI
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Auto-calculated"
                          value={updatePatientData.vitals?.bmi || ""}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Doctor Assignment */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Doctor Assignment
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Assigned Doctor
                        </label>
                        <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-md">
                          {selectedPatient.assignedDoctor ? (
                            <>
                              <UserCheck className="w-5 h-5 text-green-600" />
                              <span className="text-gray-900">
                                Dr.{" "}
                                {typeof selectedPatient.assignedDoctor ===
                                "object"
                                  ? `${selectedPatient.assignedDoctor.firstName} ${selectedPatient.assignedDoctor.lastName}`
                                  : "Unknown Doctor"}
                              </span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-5 h-5 text-red-600" />
                              <span className="text-gray-500">
                                No doctor assigned
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign/Reassign Doctor
                        </label>
                        <select
                          value={updatePatientData.assignedDoctorId || ""}
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              assignedDoctorId: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select a doctor...</option>
                          {allDoctors.map((doctor) => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.firstName} {doctor.lastName} -{" "}
                              {doctor.specialization || doctor.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUnassignDoctor()}
                          disabled={!selectedPatient.assignedDoctor}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Unassign Doctor
                        </button>
                        <button
                          onClick={() => handleAssignDoctor()}
                          disabled={!updatePatientData.assignedDoctorId}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Assign Doctor
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Front Desk Notes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Front Desk Notes
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Diagnosis
                        </label>
                        <textarea
                          value={
                            updatePatientData.frontDeskNotes
                              ?.initialDiagnosis || ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              frontDeskNotes: {
                                ...prev.frontDeskNotes,
                                initialDiagnosis: e.target.value,
                              },
                            }))
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter initial diagnosis..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Symptoms
                        </label>
                        <textarea
                          value={
                            updatePatientData.frontDeskNotes?.symptoms || ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              frontDeskNotes: {
                                ...prev.frontDeskNotes,
                                symptoms: e.target.value,
                              },
                            }))
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter symptoms..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observations
                        </label>
                        <textarea
                          value={
                            updatePatientData.frontDeskNotes?.observations || ""
                          }
                          onChange={(e) =>
                            setUpdatePatientData((prev) => ({
                              ...prev,
                              frontDeskNotes: {
                                ...prev.frontDeskNotes,
                                observations: e.target.value,
                              },
                            }))
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter observations..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowUpdatePatientModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePatient}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Update Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignDoctorModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Doctor to {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </h3>
                <button
                  onClick={() => setShowAssignDoctorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {allDoctors.length > 0 ? (
                <div className="space-y-4">
                  {allDoctors.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow w-full"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-xl">
                            {doctor.firstName[0]}
                            {doctor.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {doctor.specialization || "General Medicine"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {doctor.role.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAssignDoctorFromModal(doctor._id)
                          }
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                          Assign
                        </button>
                      </div>

                      <div className="space-y-3">
                        {doctor.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{doctor.email}</span>
                          </div>
                        )}

                        {doctor.hospital && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.department && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Department: {doctor.department}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Available for Assignment
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No doctors available for assignment at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontDeskCoordinatorDashboard;
