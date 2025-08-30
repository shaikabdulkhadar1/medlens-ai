import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, uploadAPI, timelineAPI } from "../services/api";
import { Patient, UploadResponse, UploadUrl } from "../types";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  AlertTriangle,
  FileText,
  Clock,
  Upload,
  Brain,
  Edit,
  Plus,
  Download,
  Eye,
  Trash2,
  Stethoscope,
  LogOut,
  User as UserIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const PatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "documents" | "diagnosis"
  >("timeline");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [cloudUploadProgress, setCloudUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
  const [isClosingCase, setIsClosingCase] = useState(false);

  useEffect(() => {
    if (patientId && patientId !== undefined) {
      loadPatientDetails();
      loadPatientFiles();
    }
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      setIsLoading(true);
      // This will be replaced with actual patient details API call
      const response = await authAPI.getPatients();
      if (response.success && response.data) {
        const foundPatient = response.data.find(
          (p: Patient) => p._id === patientId
        );
        if (foundPatient) {
          setPatient(foundPatient);
        }
      }
    } catch (error) {
      console.error("Error loading patient details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientFiles = async () => {
    if (!patientId) return;

    try {
      setIsLoadingFiles(true);
      const response = await uploadAPI.getPatientFiles(patientId);
      if (response.success) {
        setPatientFiles(response.data || []);
      }
    } catch (error) {
      console.error("Error loading patient files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleFileDownload = async (fileKey: string, fileName: string) => {
    try {
      const response = await uploadAPI.getDownloadUrl(fileKey);
      if (response.success && response.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleFileDelete = async (fileKey: string) => {
    try {
      const response = await uploadAPI.deleteFile(fileKey);
      if (response.success) {
        // Reload patient files after deletion
        loadPatientFiles();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "txt":
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleCloseCase = async () => {
    if (!patient || !user) return;

    const confirmed = window.confirm(
      `Are you sure you want to close the case for ${patient.firstName} ${patient.lastName}? This will mark the patient as inactive.`
    );

    if (!confirmed) return;

    setIsClosingCase(true);

    try {
      // Update patient status to inactive
      const response = await authAPI.updatePatient(patient._id, {
        isActive: false,
      });

      if (response.success) {
        // Add timeline entry for case closure
        await timelineAPI.addTimelineEntry(patient._id, {
          title: "Case Closed",
          description: "Patient case has been closed and marked as inactive.",
          type: "case_closed",
          date: new Date(),
          time: new Date().toLocaleTimeString(),
          consultedBy: user._id,
          consultationSummary: `Case closed by ${user.firstName} ${user.lastName}. Patient is no longer active in the system.`,
          documentsCount: 0,
          metadata: {
            closedBy: user._id,
            closureReason: "Case completion",
          },
        });

        // Update local patient state
        setPatient({
          ...patient,
          isActive: false,
        });

        // Show success message
        alert(
          `Case closed successfully for ${patient.firstName} ${patient.lastName}`
        );

        // Navigate back to dashboard
        navigate("/dashboard");
      } else {
        throw new Error(response.message || "Failed to close case");
      }
    } catch (error) {
      console.error("Error closing case:", error);
      alert(
        `Error closing case: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsClosingCase(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFilesAndAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    setUploadProgress({});

    try {
      // Simulate file upload progress
      for (let i = 0; i < uploadedFiles.length; i++) {
        const fileName = uploadedFiles[i].name;
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress((prev) => ({ ...prev, [fileName]: progress }));
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Simulate AI analysis with different models
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock analysis results from different Hugging Face models
      const mockResults = {
        imageAnalysis: {
          model: "microsoft/resnet-50",
          findings: [
            "Normal cardiac silhouette detected",
            "No significant abnormalities in chest X-ray",
            "Clear lung fields observed",
          ],
          confidence: 92,
        },
        textAnalysis: {
          model: "facebook/bart-large-cnn",
          summary:
            "Patient shows signs of mild hypertension with normal heart rate. Previous medical history indicates controlled diabetes. Current medications appear to be effective.",
          keyPoints: [
            "Blood pressure readings consistently elevated",
            "Diabetes well-controlled with current medication",
            "No new symptoms reported",
          ],
          confidence: 88,
        },
        vitalsAnalysis: {
          model: "custom-vitals-model",
          anomalies: [
            "Systolic BP: 145 mmHg (slightly elevated)",
            "Heart Rate: 72 bpm (normal range)",
            "Temperature: 98.6°F (normal)",
          ],
          recommendations: [
            "Monitor blood pressure more frequently",
            "Consider lifestyle modifications",
            "Continue current medication regimen",
          ],
          confidence: 85,
        },
        timestamp: new Date().toISOString(),
      };

      setAnalysisResults(mockResults);
    } catch (error) {
      console.error("Error during upload and analysis:", error);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress({});
    }
  };

  const uploadFilesToCloud = async () => {
    if (uploadedFiles.length === 0 || !patientId) return;

    setIsUploadingToCloud(true);
    setCloudUploadProgress({});

    try {
      // Initialize progress for all files
      uploadedFiles.forEach((file) => {
        setCloudUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      });

      // Step 1: Generate presigned URLs
      const response: UploadResponse = await uploadAPI.generateUploadUrls(
        uploadedFiles,
        patientId
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to generate upload URLs");
      }

      // Step 2: Upload each file using presigned URLs
      const uploadPromises = response.uploadUrls.map(
        async (uploadUrl: UploadUrl) => {
          try {
            const file = uploadedFiles.find(
              (f) => f.name === uploadUrl.fileName
            );
            if (!file) {
              throw new Error(`File ${uploadUrl.fileName} not found`);
            }

            // Update progress to 50% (uploading)
            setCloudUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 50,
            }));

            // Upload to presigned URL
            // Extract metadata from presigned URL query parameters
            const url = new URL(uploadUrl.presignedUrl);
            const params = new URLSearchParams(url.search);

            const metadata = {
              originalname: params.get("x-amz-meta-originalname") || "",
              patientid: params.get("x-amz-meta-patientid") || "",
              uploadedby: params.get("x-amz-meta-uploadedby") || "",
            };

            await uploadAPI.uploadToPresignedUrl(
              uploadUrl.presignedUrl,
              file,
              metadata
            );

            // Update progress to 75% (uploaded, confirming)
            setCloudUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 75,
            }));

            // Step 3: Confirm upload
            await uploadAPI.confirmUpload(uploadUrl.uploadId, uploadUrl.key);

            // Update progress to 100% (completed)
            setCloudUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 100,
            }));

            return { success: true, fileName: uploadUrl.fileName };
          } catch (error) {
            console.error(`Error uploading ${uploadUrl.fileName}:`, error);
            return {
              success: false,
              fileName: uploadUrl.fileName,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        }
      );

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r) => r.success);
      const failedUploads = results.filter((r) => !r.success);

      // Clear uploaded files after successful upload
      setUploadedFiles([]);

      // Show success/error message
      if (successfulUploads.length > 0) {
        const message =
          failedUploads.length > 0
            ? `Successfully uploaded ${successfulUploads.length} files. ${failedUploads.length} files failed.`
            : `Successfully uploaded ${successfulUploads.length} files to cloud storage!`;
        alert(message);
      } else {
        throw new Error("All uploads failed");
      }
    } catch (error) {
      console.error("Error uploading files to cloud:", error);
      alert(
        `Error uploading files to cloud: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploadingToCloud(false);
      setCloudUploadProgress({});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Patient Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The patient you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-6 w-6 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">MedLens AI</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-gray-500">Consulting Doctor</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-6 px-6">
        <div className="flex h-[calc(100vh-120px)]">
          {/* Left Section - Patient Details (35%) */}
          <div className="w-[35%] bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Patient ID: {patient.patientId}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      {calculateAge(patient.dateOfBirth)} years old
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {patient.gender}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {patient.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {patient.contactInfo?.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {patient.contactInfo?.email || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      {patient.contactInfo?.address
                        ? `${patient.contactInfo.address.street}, ${patient.contactInfo.address.city}, ${patient.contactInfo.address.state} ${patient.contactInfo.address.zipCode}`
                        : "Address not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Medical History
                </h3>
                <div className="space-y-4">
                  {/* Allergies */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Allergies
                      </span>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3">
                      {patient.medicalHistory?.allergies &&
                      patient.medicalHistory.allergies.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.medicalHistory.allergies.map(
                            (allergy, index) => (
                              <li key={index} className="text-sm text-red-700">
                                • {allergy}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No allergies recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Medications */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Pill className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Current Medications
                      </span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      {patient.medicalHistory?.medications &&
                      patient.medicalHistory.medications.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.medicalHistory.medications.map(
                            (medication, index) => (
                              <li key={index} className="text-sm text-blue-700">
                                • {medication.name} - {medication.dosage}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No medications recorded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-gray-700">
                        Medical Conditions
                      </span>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      {patient.medicalHistory?.conditions &&
                      patient.medicalHistory.conditions.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.medicalHistory.conditions.map(
                            (condition, index) => (
                              <li
                                key={index}
                                className="text-sm text-green-700"
                              >
                                • {condition.name} (Diagnosed:{" "}
                                {condition.diagnosedDate
                                  ? formatDate(condition.diagnosedDate)
                                  : "Unknown"}
                                )
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No conditions recorded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              {patient.insurance && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Insurance
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider:</span>
                        <span className="text-sm font-medium">
                          {patient.insurance.provider}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Policy Number:
                        </span>
                        <span className="text-sm font-medium">
                          {patient.insurance.policyNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Group Number:
                        </span>
                        <span className="text-sm font-medium">
                          {patient.insurance.groupNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {patient.emergencyContact && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Emergency Contact
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">
                          {patient.emergencyContact.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({patient.emergencyContact.relationship})
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.emergencyContact.phone}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit Patient</span>
                </button>
                <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>New Case</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Content Area (65%) */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "timeline"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Timeline</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "documents"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Documents</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("diagnosis")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "diagnosis"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Diagnosis</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Medical Timeline
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button className="btn-primary flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Visit</span>
                      </button>
                      <button
                        onClick={handleCloseCase}
                        disabled={isClosingCase || !patient.isActive}
                        className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        <span>
                          {isClosingCase ? "Closing..." : "Case Closed"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Timeline Items - Most Recent First */}
                  <div className="relative">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                    <div className="space-y-6">
                      {/* Case Closed Entry - Show only if patient is inactive */}
                      {!patient.isActive && (
                        <div className="relative">
                          <div className="flex items-start">
                            {/* Timeline Node */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                <X className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            {/* Content Card */}
                            <div className="ml-6 flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                              {/* Collapsed View */}
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-semibold text-gray-900">
                                      Case Closed
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Patient case has been closed and marked as
                                      inactive.
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-3 ml-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-gray-900">
                                        {formatDate(new Date().toISOString())}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Case Closed
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setExpandedTimeline(
                                          expandedTimeline === "case-closed"
                                            ? null
                                            : "case-closed"
                                        )
                                      }
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    >
                                      {expandedTimeline === "case-closed" ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              {expandedTimeline === "case-closed" && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50">
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <UserIcon className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">
                                        Closed by: {user?.firstName}{" "}
                                        {user?.lastName}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      Patient case has been officially closed.
                                      The patient is no longer active in the
                                      system. All medical records and documents
                                      remain accessible for reference purposes.
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                      <span className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Case Status: Inactive</span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <UserIcon className="w-3 h-3" />
                                        <span>
                                          Patient: {patient.firstName}{" "}
                                          {patient.lastName}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Follow-up Consultation */}
                      <div className="relative">
                        <div className="flex items-start">
                          {/* Timeline Node */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className="ml-6 flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                            {/* Collapsed View */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-gray-900">
                                    Follow-up Consultation
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Patient returned for follow-up regarding
                                    diabetes management and blood pressure
                                    control.
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      April 12, 2024
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      2:30 PM
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedTimeline(
                                        expandedTimeline === "followup"
                                          ? null
                                          : "followup"
                                      )
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    {expandedTimeline === "followup" ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedTimeline === "followup" && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Consulted: Dr. Michael Chen
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Blood glucose levels improved with current
                                    medication. Blood pressure remains elevated
                                    at 140/90. Recommended lifestyle
                                    modifications including diet changes and
                                    increased physical activity. Prescribed
                                    Metformin dosage adjustment and added
                                    Lisinopril for blood pressure management.
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Duration: 45 minutes</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <FileText className="w-3 h-3" />
                                      <span>2 documents uploaded</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lab Results Review */}
                      <div className="relative">
                        <div className="flex items-start">
                          {/* Timeline Node */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className="ml-6 flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                            {/* Collapsed View */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-gray-900">
                                    Lab Results Review
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Review of blood work and diagnostic tests
                                    ordered during initial consultation.
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      March 28, 2024
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      10:15 AM
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedTimeline(
                                        expandedTimeline === "lab"
                                          ? null
                                          : "lab"
                                      )
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    {expandedTimeline === "lab" ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedTimeline === "lab" && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Consulted: Dr. Emily Wilson
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Blood glucose: 180 mg/dL (elevated), HbA1c:
                                    7.2% (diabetes range). Cholesterol panel
                                    shows high LDL at 160 mg/dL. Kidney function
                                    normal. Recommended starting Metformin 500mg
                                    twice daily and dietary consultation.
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Duration: 30 minutes</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <FileText className="w-3 h-3" />
                                      <span>5 documents uploaded</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Initial Consultation */}
                      <div className="relative">
                        <div className="flex items-start">
                          {/* Timeline Node */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-12 h-12 bg-purple-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                              <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className="ml-6 flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                            {/* Collapsed View */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-gray-900">
                                    Initial Consultation
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    First visit for evaluation of diabetes
                                    symptoms and general health assessment.
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      March 15, 2024
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      9:00 AM
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedTimeline(
                                        expandedTimeline === "initial"
                                          ? null
                                          : "initial"
                                      )
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    {expandedTimeline === "initial" ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedTimeline === "initial" && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Consulted: Dr. Michael Chen
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Patient presented with frequent urination,
                                    increased thirst, and fatigue. Family
                                    history of diabetes noted. Physical
                                    examination revealed elevated blood
                                    pressure. Ordered comprehensive blood work
                                    including glucose, HbA1c, and lipid panel.
                                    Scheduled follow-up for results review.
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Duration: 60 minutes</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <FileText className="w-3 h-3" />
                                      <span>3 documents uploaded</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Patient Registration */}
                      <div className="relative">
                        <div className="flex items-start">
                          {/* Timeline Node */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className="ml-6 flex-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                            {/* Collapsed View */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-gray-900">
                                    Patient Registration
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    New patient registration and initial medical
                                    history collection.
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(patient.createdAt)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Registration
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedTimeline(
                                        expandedTimeline === "registration"
                                          ? null
                                          : "registration"
                                      )
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    {expandedTimeline === "registration" ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedTimeline === "registration" && (
                              <div className="border-t border-gray-100 p-4 bg-gray-50">
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Registered by: System Admin
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Patient {patient.firstName}{" "}
                                    {patient.lastName} was registered in the
                                    system. Initial demographic information,
                                    contact details, and basic medical history
                                    were collected. Insurance information
                                    verified and patient assigned to Dr. Michael
                                    Chen for primary care.
                                  </p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span className="flex items-center space-x-1">
                                      <UserIcon className="w-3 h-3" />
                                      <span>
                                        Patient ID: {patient.patientId}
                                      </span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <UserIcon className="w-3 h-3" />
                                      <span>Assigned to: Dr. Michael Chen</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Uploaded Documents
                    </h3>
                    <button className="btn-primary flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Document</span>
                    </button>
                  </div>

                  {/* Patient Files */}
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : patientFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No documents uploaded
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload documents to see them here.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">
                          All Documents ({patientFiles.length})
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {patientFiles.map((file, index) => (
                          <div key={index} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {getFileIcon(
                                  file.originalName || file.fileName
                                )}
                                <div>
                                  <p className="text-base font-medium text-gray-900">
                                    {file.originalName || file.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {file.fileSize
                                      ? `${(
                                          file.fileSize /
                                          1024 /
                                          1024
                                        ).toFixed(2)} MB`
                                      : "Unknown size"}
                                  </p>
                                  {file.createdAt && (
                                    <p className="text-xs text-gray-400">
                                      Uploaded {formatDate(file.createdAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    handleFileDownload(
                                      file.fileKey || file.key,
                                      file.originalName || file.fileName
                                    )
                                  }
                                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleFileDelete(file.fileKey || file.key)
                                  }
                                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "diagnosis" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      AI Diagnosis
                    </h3>
                    <button
                      onClick={uploadFilesAndAnalyze}
                      disabled={
                        uploadedFiles.length === 0 || isUploading || isAnalyzing
                      }
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Brain className="w-4 h-4" />
                      <span>
                        {isUploading || isAnalyzing
                          ? "Analyzing..."
                          : "Run New Analysis"}
                      </span>
                    </button>
                  </div>

                  {/* File Upload Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-medium text-gray-900">
                        Upload New Files for Analysis
                      </h4>
                      <div className="flex items-center space-x-2">
                        <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Select Files</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        {uploadedFiles.length > 0 && (
                          <button
                            onClick={uploadFilesToCloud}
                            disabled={isUploadingToCloud}
                            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Upload className="w-4 h-4" />
                            <span>
                              {isUploadingToCloud ? "Uploading..." : "Upload"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-base font-medium text-gray-700">
                          Selected Files:
                        </h5>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {getFileIcon(file.name)}
                              <div>
                                <p className="text-base font-medium text-gray-900">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {uploadProgress[file.name] !== undefined && (
                                <div className="flex items-center space-x-2">
                                  <Loader className="w-4 h-4 animate-spin text-primary-600" />
                                  <span className="text-xs text-gray-500">
                                    {uploadProgress[file.name]}%
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => removeFile(index)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Loader className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Uploading files...
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                Object.values(uploadProgress).reduce(
                                  (a, b) => a + b,
                                  0
                                ) / Object.keys(uploadProgress).length
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Cloud Upload Progress */}
                    {isUploadingToCloud && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Loader className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Uploading to cloud storage...
                          </span>
                        </div>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-700">
                                  {file.name}
                                </span>
                                <span className="text-green-600">
                                  {cloudUploadProgress[file.name] || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-green-200 rounded-full h-1">
                                <div
                                  className="bg-green-600 h-1 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${
                                      cloudUploadProgress[file.name] || 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis Progress */}
                    {isAnalyzing && !isUploading && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 animate-pulse text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            Analyzing with AI models...
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-gray-600">
                              Image analysis (ResNet-50)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-gray-600">
                              Text summarization (BART)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Vitals analysis (Custom model)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Results */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-6">
                      {/* Model Analysis Results */}
                      {analysisResults ? (
                        <>
                          {/* Image Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span>Image Analysis</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {analysisResults.imageAnalysis.model}
                              </span>
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="space-y-2">
                                {analysisResults.imageAnalysis.findings.map(
                                  (finding: string, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-start space-x-2"
                                    >
                                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                      <p className="text-sm text-blue-800">
                                        {finding}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-blue-600">
                                  Confidence:{" "}
                                  {analysisResults.imageAnalysis.confidence}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Text Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-green-500" />
                              <span>Text Analysis</span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {analysisResults.textAnalysis.model}
                              </span>
                            </h4>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-green-800 mb-2">
                                  Summary:
                                </h5>
                                <p className="text-sm text-green-700">
                                  {analysisResults.textAnalysis.summary}
                                </p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-green-800 mb-2">
                                  Key Points:
                                </h5>
                                <div className="space-y-1">
                                  {analysisResults.textAnalysis.keyPoints.map(
                                    (point: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-start space-x-2"
                                      >
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></div>
                                        <p className="text-sm text-green-700">
                                          {point}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-green-600">
                                  Confidence:{" "}
                                  {analysisResults.textAnalysis.confidence}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vitals Analysis */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                              <Heart className="w-5 h-5 text-purple-500" />
                              <span>Vitals Analysis</span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {analysisResults.vitalsAnalysis.model}
                              </span>
                            </h4>
                            <div className="bg-purple-50 rounded-lg p-4">
                              <div className="mb-3">
                                <h5 className="text-sm font-medium text-purple-800 mb-2">
                                  Vital Signs:
                                </h5>
                                <div className="space-y-1">
                                  {analysisResults.vitalsAnalysis.anomalies.map(
                                    (vital: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                      >
                                        <AlertCircle className="w-4 h-4 text-purple-600" />
                                        <p className="text-sm text-purple-700">
                                          {vital}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-purple-800 mb-2">
                                  Recommendations:
                                </h5>
                                <div className="space-y-1">
                                  {analysisResults.vitalsAnalysis.recommendations.map(
                                    (rec: string, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-start space-x-2"
                                      >
                                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
                                        <p className="text-sm text-purple-700">
                                          {rec}
                                        </p>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-purple-600">
                                  Confidence:{" "}
                                  {analysisResults.vitalsAnalysis.confidence}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Overall Confidence */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                              Overall Analysis Confidence
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">
                                    {analysisResults.imageAnalysis.confidence}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Image Analysis
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">
                                    {analysisResults.textAnalysis.confidence}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Text Analysis
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-purple-600">
                                    {analysisResults.vitalsAnalysis.confidence}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Vitals Analysis
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                Analysis completed:{" "}
                                {new Date(
                                  analysisResults.timestamp
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Default Analysis Summary */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                              Analysis Summary
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-sm text-blue-800">
                                Upload new files to get comprehensive AI
                                analysis using multiple Hugging Face models. The
                                system will analyze images, text documents, and
                                vital signs to provide detailed insights.
                              </p>
                            </div>
                          </div>

                          {/* Key Findings */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                              Key Findings
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                                <div>
                                  <h5 className="font-medium text-yellow-800">
                                    Elevated Blood Pressure
                                  </h5>
                                  <p className="text-sm text-yellow-700 mt-1">
                                    Consistent readings above normal range
                                    detected in recent measurements.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <Heart className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                  <h5 className="font-medium text-green-800">
                                    Normal Heart Rate
                                  </h5>
                                  <p className="text-sm text-green-700 mt-1">
                                    Heart rate measurements are within normal
                                    range.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                              AI Recommendations
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                <p className="text-sm text-gray-700">
                                  Schedule follow-up appointment for blood
                                  pressure monitoring
                                </p>
                              </div>
                              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                <p className="text-sm text-gray-700">
                                  Consider lifestyle modifications for
                                  cardiovascular health
                                </p>
                              </div>
                              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                <p className="text-sm text-gray-700">
                                  Review current medication interactions
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Confidence Score */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">
                              Analysis Confidence
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                  Confidence Level
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  85%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-500 h-2 rounded-full"
                                  style={{ width: "85%" }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Based on 6 analyzed documents and patient
                                history
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
