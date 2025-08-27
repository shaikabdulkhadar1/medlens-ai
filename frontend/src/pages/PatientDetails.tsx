import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, uploadAPI } from "../services/api";
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

  useEffect(() => {
    if (patientId && patientId !== undefined) {
      loadPatientDetails();
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
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Section - Patient Details (35%) */}
          <div className="w-[35%] bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              {/* Patient Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-gray-600">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
          <div className="flex-1 flex flex-col">
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
                    <h3 className="text-xl font-semibold text-gray-900">
                      Patient Timeline
                    </h3>
                    <button className="btn-primary flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Entry</span>
                    </button>
                  </div>

                  {/* Timeline Items */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-primary-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              Patient Registration
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(patient.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Patient {patient.firstName} {patient.lastName} was
                            registered in the system.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              Initial Consultation
                            </h4>
                            <span className="text-sm text-gray-500">
                              March 15, 2024
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Initial consultation completed. Patient reported
                            symptoms and medical history was reviewed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              Lab Tests Ordered
                            </h4>
                            <span className="text-sm text-gray-500">
                              March 20, 2024
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Blood work and imaging tests ordered for further
                            diagnosis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Uploaded Documents
                    </h3>
                    <button className="btn-primary flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Document</span>
                    </button>
                  </div>

                  {/* Document Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Medical Reports
                        </h4>
                        <span className="text-sm text-gray-500">3 files</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">
                            Blood Test Results.pdf
                          </span>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">
                            X-Ray Report.pdf
                          </span>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Prescriptions
                        </h4>
                        <span className="text-sm text-gray-500">2 files</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">
                            Current Medications.pdf
                          </span>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Consultation Notes
                        </h4>
                        <span className="text-sm text-gray-500">1 file</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">
                            Initial Consultation.pdf
                          </span>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "diagnosis" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
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
                      <h4 className="text-lg font-medium text-gray-900">
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
                        <h5 className="text-sm font-medium text-gray-700">
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
                                <p className="text-sm font-medium text-gray-900">
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
