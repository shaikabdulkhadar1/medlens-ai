import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, uploadAPI, timelineAPI } from "../services/api";
import {
  Patient,
  UploadResponse,
  UploadUrl,
  AIAnalysis,
  UploadRecord,
} from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [patientFiles, setPatientFiles] = useState<UploadRecord[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadRecord | null>(null);
  const [activeDocumentTab, setActiveDocumentTab] = useState<"uploaded" | "ai">(
    "uploaded"
  );

  // Filter files by document type
  const userUploadedFiles = patientFiles.filter(
    (file) => file.documentType === "uploaded-by-user" || !file.documentType
  );
  const aiAnalysisReportFiles = patientFiles.filter(
    (file) => file.documentType === "ai-analysis-report"
  );
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [expandedDocuments, setExpandedDocuments] = useState<boolean>(true);
  const [expandedAnalysisReports, setExpandedAnalysisReports] =
    useState<boolean>(true);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [selectedAnalysisReports, setSelectedAnalysisReports] = useState<
    Set<string>
  >(new Set());
  const [isClosingCase, setIsClosingCase] = useState(false);
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(
    null
  );

  useEffect(() => {
    if (patientId && patientId !== undefined) {
      loadPatientDetails();
      loadPatientFiles();
      loadAIAnalyses();
      loadTimelineData();
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

  const loadAIAnalyses = async () => {
    if (!patientId) return;

    try {
      setIsLoadingAnalysis(true);
      const response = await uploadAPI.getPatientAnalysis(patientId);
      if (response.success) {
        setAiAnalyses(response.data || []);
      }
    } catch (error) {
      console.error("Error loading AI analyses:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const loadTimelineData = async () => {
    if (!patientId) return;

    try {
      setLoadingTimeline(true);
      const response = await timelineAPI.getPatientTimeline(patientId);
      if (response.success) {
        // Sort timeline entries by visitDate in descending order (most recent first)
        const sortedTimeline = (response.data || []).sort((a: any, b: any) => {
          const dateA = new Date(a.visitDate).getTime();
          const dateB = new Date(b.visitDate).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setTimelineData(sortedTimeline);
      }
    } catch (error) {
      console.error("Error loading timeline data:", error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const triggerAIAnalysis = async (uploadId: string) => {
    if (!patientId) return;

    try {
      setIsAnalyzing(true);
      const response = await uploadAPI.analyzeDocument(uploadId, patientId);
      if (response.success) {
        // Reload AI analyses to show the new result
        await loadAIAnalyses();
      }
    } catch (error) {
      console.error("Error triggering AI analysis:", error);
    } finally {
      setIsAnalyzing(false);
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

  const formatAIResponse = (response: string) => {
    // Clean up the response and format it properly
    let formatted = response
      // Remove HTML tags first
      .replace(/<[^>]*>/g, "")
      // Remove markdown code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove horizontal rules
      .replace(/^---$/gm, "")
      // Remove extra asterisks
      .replace(/\*+/g, "")
      .trim();

    // Split the content by headers (both # and numbered formats)
    const sections = formatted.split(/(?:#\s+)?(\d+\.\s+[^:]+:)/);

    if (sections.length > 1) {
      // Process each section
      const processedSections = [];

      for (let i = 0; i < sections.length; i++) {
        let section = sections[i].trim();

        if (!section) continue;

        // Check if this is a header
        if (section.match(/^\d+\.\s+/)) {
          // Format header
          section = `\n\n${section.toUpperCase()}\n`;
          processedSections.push(section);
        } else {
          // Process content section
          const lines = section.split("\n");
          const processedLines = [];

          for (const line of lines) {
            let processedLine = line.trim();

            if (!processedLine) {
              processedLines.push("");
              continue;
            }

            // Remove # symbols from the beginning of lines
            processedLine = processedLine.replace(/^#+\s*/, "");

            // Format bullet points
            if (processedLine.match(/^•\s+/)) {
              processedLine = `  ${processedLine}`;
            } else if (processedLine.match(/^[-*]\s+/)) {
              processedLine = processedLine.replace(/^[-*]\s+/, "• ");
              processedLine = `  ${processedLine}`;
            }

            processedLines.push(processedLine);
          }

          // Join lines and add proper spacing
          let processedSection = processedLines.join("\n");

          // Add spacing after bullet points
          processedSection = processedSection.replace(
            /\n  • ([^\n]+)\n([^•\n])/g,
            "\n  • $1\n\n$2"
          );

          processedSections.push(processedSection);
        }
      }

      formatted = processedSections.join("");
    } else {
      // Fallback: process as single text block with # headers
      const lines = formatted.split("\n");
      const processedLines = [];

      for (const line of lines) {
        let processedLine = line.trim();

        if (!processedLine) {
          processedLines.push("");
          continue;
        }

        // Format headers (remove # and make uppercase)
        if (processedLine.match(/^#+\s+\d+\.\s+/)) {
          processedLine = processedLine.replace(/^#+\s+/, "");
          processedLine = `\n\n${processedLine.toUpperCase()}\n`;
        } else if (processedLine.match(/^#+\s+/)) {
          processedLine = processedLine.replace(/^#+\s+/, "");
          processedLine = `\n\n${processedLine.toUpperCase()}\n`;
        }

        // Format bullet points
        if (processedLine.match(/^•\s+/)) {
          processedLine = `  ${processedLine}`;
        } else if (processedLine.match(/^[-*]\s+/)) {
          processedLine = processedLine.replace(/^[-*]\s+/, "• ");
          processedLine = `  ${processedLine}`;
        }

        processedLines.push(processedLine);
      }

      formatted = processedLines.join("\n");
    }

    // Final cleanup
    formatted = formatted
      // Clean up multiple newlines
      .replace(/\n{4,}/g, "\n\n\n")
      // Clean up multiple spaces
      .replace(/\s{2,}/g, " ")
      // Clean up final formatting
      .trim();

    return formatted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownloadFile = async (fileKey: string) => {
    try {
      const response = await uploadAPI.getDownloadUrl(fileKey);
      if (response.success && response.downloadUrl) {
        const link = document.createElement("a");
        link.href = response.downloadUrl;
        link.download = fileKey;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDeleteFile = async (fileKey: string) => {
    try {
      const response = await uploadAPI.deleteFile(fileKey);
      if (response.success) {
        loadPatientFiles();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleBulkDeleteDocuments = async () => {
    if (selectedDocuments.size === 0) return;

    const fileKeys = Array.from(selectedDocuments);

    try {
      const response = await uploadAPI.bulkDeleteFiles(fileKeys);
      if (response.success) {
        setSelectedDocuments(new Set());
        loadPatientFiles();
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
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
          visitDate: new Date(),
          visitType: "consultation",
          diagnosis: "Case closed",
          notes: `Case closed by ${user.firstName} ${user.lastName}. Patient is no longer active in the system.`,
          doctor: user._id,
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
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.allergies.map((allergy, index) => (
                            <li key={index} className="text-sm text-red-700">
                              • {allergy}
                            </li>
                          ))}
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
                      {patient.medications && patient.medications.length > 0 ? (
                        <ul className="space-y-1">
                          {patient.medications.map((medication, index) => (
                            <li key={index} className="text-sm text-blue-700">
                              • {medication.name} - {medication.dosage}
                            </li>
                          ))}
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
                      {patient.medicalConditions &&
                      Object.values(patient.medicalConditions).some(Boolean) ? (
                        <ul className="space-y-1">
                          {Object.entries(patient.medicalConditions).map(
                            ([condition, hasCondition]) =>
                              hasCondition && (
                                <li
                                  key={condition}
                                  className="text-sm text-green-700"
                                >
                                  •{" "}
                                  {condition.replace(/([A-Z])/g, " $1").trim()}
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
              {patient.insuranceInfo && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Insurance
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider:</span>
                        <span className="text-sm font-medium">
                          {patient.insuranceInfo?.provider || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Policy Number:
                        </span>
                        <span className="text-sm font-medium">
                          {patient.insuranceInfo?.policyNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Group Number:
                        </span>
                        <span className="text-sm font-medium">
                          {patient.insuranceInfo?.groupNumber || "N/A"}
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

                    {loadingTimeline ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <span className="ml-2 text-gray-600">
                          Loading timeline...
                        </span>
                      </div>
                    ) : timelineData.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Timeline Entries
                        </h3>
                        <p className="text-gray-600">
                          No visit history recorded for this patient yet.
                        </p>
                      </div>
                    ) : (
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
                                        Patient case has been closed and marked
                                        as inactive.
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
                                        system. All medical records and
                                        documents remain accessible for
                                        reference purposes.
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

                        {/* Patient Registration Entry */}
                        <div className="relative">
                          <div className="flex items-start">
                            {/* Timeline Node */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
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
                                      Patient {patient.firstName}{" "}
                                      {patient.lastName} was registered in the
                                      system.
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-3 ml-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-gray-900">
                                        {formatDate(
                                          patient.createdAt ||
                                            patient.dateOfBirth
                                        )}
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
                                        Patient ID: {patient.patientId}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      Initial patient registration completed.
                                      Basic demographic information, contact
                                      details, and medical history were
                                      collected. Patient was assigned to the
                                      system for ongoing care management.
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                      <span className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          Status:{" "}
                                          {patient.isActive
                                            ? "Active"
                                            : "Inactive"}
                                        </span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <UserIcon className="w-3 h-3" />
                                        <span>
                                          Age:{" "}
                                          {calculateAge(patient.dateOfBirth)}{" "}
                                          years
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Timeline Entries */}
                        {timelineData.map((entry, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-start">
                              {/* Timeline Node */}
                              <div className="relative z-10 flex-shrink-0">
                                <div
                                  className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                                    entry.visitType === "initial"
                                      ? "bg-blue-500"
                                      : entry.visitType === "follow-up"
                                      ? "bg-green-500"
                                      : entry.visitType === "emergency"
                                      ? "bg-red-500"
                                      : entry.visitType === "consultation"
                                      ? "bg-purple-500"
                                      : entry.visitType === "procedure"
                                      ? "bg-orange-500"
                                      : "bg-gray-500"
                                  }`}
                                >
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
                                        {entry.visitType
                                          .charAt(0)
                                          .toUpperCase() +
                                          entry.visitType
                                            .slice(1)
                                            .replace("-", " ")}{" "}
                                        Visit
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {entry.diagnosis ||
                                          entry.notes ||
                                          "Visit details not specified"}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-3 ml-4">
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                          {formatDate(entry.visitDate)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {entry.doctor?.firstName}{" "}
                                          {entry.doctor?.lastName}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          setExpandedTimeline(
                                            expandedTimeline ===
                                              `entry-${index}`
                                              ? null
                                              : `entry-${index}`
                                          )
                                        }
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                      >
                                        {expandedTimeline ===
                                        `entry-${index}` ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedTimeline === `entry-${index}` && (
                                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                                    <div className="space-y-4">
                                      {entry.doctor && (
                                        <div className="flex items-center space-x-2">
                                          <UserIcon className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm font-medium text-gray-700">
                                            Doctor: {entry.doctor.firstName}{" "}
                                            {entry.doctor.lastName}
                                          </span>
                                        </div>
                                      )}
                                      {entry.diagnosis && (
                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                                            Diagnosis:
                                          </h5>
                                          <p className="text-sm text-gray-600">
                                            {entry.diagnosis}
                                          </p>
                                        </div>
                                      )}
                                      {entry.symptoms &&
                                        entry.symptoms.length > 0 && (
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                                              Symptoms:
                                            </h5>
                                            <p className="text-sm text-gray-600">
                                              {entry.symptoms.join(", ")}
                                            </p>
                                          </div>
                                        )}
                                      {entry.treatment && (
                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                                            Treatment:
                                          </h5>
                                          <p className="text-sm text-gray-600">
                                            {entry.treatment}
                                          </p>
                                        </div>
                                      )}
                                      {entry.medications &&
                                        entry.medications.length > 0 && (
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                                              Medications:
                                            </h5>
                                            <p className="text-sm text-gray-600">
                                              {entry.medications.join(", ")}
                                            </p>
                                          </div>
                                        )}
                                      {entry.notes && (
                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                                            Notes:
                                          </h5>
                                          <p className="text-sm text-gray-600">
                                            {entry.notes}
                                          </p>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                        <span className="flex items-center space-x-1">
                                          <Clock className="w-3 h-3" />
                                          <span>
                                            Visit Type: {entry.visitType}
                                          </span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <UserIcon className="w-3 h-3" />
                                          <span>
                                            Created:{" "}
                                            {formatDate(entry.createdAt)}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  {/* User Uploaded Documents Section - Files stored in patients/{patientId}/uploaded-by-user/ */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            User Uploaded Documents
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {userUploadedFiles.length}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button className="btn-primary flex items-center space-x-2">
                            <Upload className="w-4 h-4" />
                            <span>Upload Document</span>
                          </button>
                          <button
                            onClick={handleBulkDeleteDocuments}
                            disabled={selectedDocuments.size === 0}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>
                              Delete Selected ({selectedDocuments.size})
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              setExpandedDocuments(!expandedDocuments)
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                          >
                            {expandedDocuments ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedDocuments && (
                      <div className="p-6">
                        {/* Patient Files */}
                        {isLoadingFiles ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : userUploadedFiles.length === 0 ? (
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
                          <div className="space-y-4">
                            {userUploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedDocuments.has(
                                      file.fileKey || file.originalName
                                    )}
                                    onChange={(e) => {
                                      const key =
                                        file.fileKey || file.originalName;
                                      if (e.target.checked) {
                                        setSelectedDocuments(
                                          new Set([
                                            ...Array.from(selectedDocuments),
                                            key,
                                          ])
                                        );
                                      } else {
                                        const newSet = new Set(
                                          selectedDocuments
                                        );
                                        newSet.delete(key);
                                        setSelectedDocuments(newSet);
                                      }
                                    }}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {file.originalName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.contentType} •{" "}
                                      {formatFileSize(file.fileSize)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleDownloadFile(file.fileKey)
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteFile(file.fileKey)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Reports Section - Files stored in patients/{patientId}/ai-analysis-reports/ */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            AI Analysis Reports
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {aiAnalysisReportFiles.length}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setExpandedAnalysisReports(
                                !expandedAnalysisReports
                              )
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                          >
                            {expandedAnalysisReports ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedAnalysisReports && (
                      <div className="p-6">
                        {/* AI Analysis Reports */}
                        {isLoadingAnalysis ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : aiAnalysisReportFiles.length === 0 ? (
                          <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No AI analysis reports
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              AI analysis reports will appear here after
                              analysis.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {aiAnalysisReportFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileText className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {file.originalName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.contentType} •{" "}
                                      {formatFileSize(file.fileSize)}
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
                                    onClick={() => triggerAIAnalysis(file._id)}
                                    disabled={isAnalyzing}
                                    className="p-2 text-gray-400 hover:text-purple-600 rounded-md hover:bg-purple-50 disabled:opacity-50"
                                    title="Analyze with AI"
                                  >
                                    <Brain className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDownloadFile(file.fileKey)
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteFile(file.fileKey)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Upload Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-medium text-gray-900">
                        Upload New Files for Analysis
                      </h4>
                      <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Upload Document</span>
                      </label>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.dcm"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="text-sm text-gray-500">
                      Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TIFF,
                      DCM
                    </div>
                  </div>

                  {/* AI Analysis Results */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-6">
                      {/* Real AI Analysis Results */}
                      {!isLoadingAnalysis && aiAnalyses.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            AI Analysis Results
                          </h4>
                          {aiAnalyses.map((analysis, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-md font-medium text-gray-900">
                                  {analysis.analysisType || "Medical Analysis"}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    analysis.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : analysis.status === "processing"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {analysis.status}
                                </span>
                              </div>
                              {analysis.analysisResult?.summary && (
                                <div className="mb-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-1">
                                    Summary:
                                  </h6>
                                  <p className="text-sm text-gray-600">
                                    {analysis.analysisResult.summary}
                                  </p>
                                </div>
                              )}
                              {analysis.analysisResult?.keyFindings &&
                                analysis.analysisResult.keyFindings.length >
                                  0 && (
                                  <div className="mb-3">
                                    <h6 className="text-sm font-medium text-gray-700 mb-1">
                                      Key Findings:
                                    </h6>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                      {analysis.analysisResult.keyFindings.map(
                                        (finding, idx) => (
                                          <li key={idx}>{finding}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {analysis.analysisResult?.recommendations &&
                                analysis.analysisResult.recommendations.length >
                                  0 && (
                                  <div className="mb-3">
                                    <h6 className="text-sm font-medium text-gray-700 mb-1">
                                      Recommendations:
                                    </h6>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                      {analysis.analysisResult.recommendations.map(
                                        (rec, idx) => (
                                          <li key={idx}>{rec}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <span>
                                  Analyzed: {formatDate(analysis.createdAt)}
                                </span>
                                {analysis.analysisResult?.confidence && (
                                  <span>
                                    Confidence:{" "}
                                    {analysis.analysisResult.confidence}%
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Loading State */}
                      {isLoadingAnalysis && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                          <p className="text-gray-600">
                            Analyzing documents...
                          </p>
                        </div>
                      )}

                      {/* No Analysis State */}
                      {!isLoadingAnalysis && aiAnalyses.length === 0 && (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            No AI Analysis Yet
                          </h4>
                          <p className="text-gray-600">
                            Upload documents and click "Analyze with AI" to get
                            AI-powered medical analysis.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "diagnosis" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Patient Diagnosis
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Diagnosis
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter primary diagnosis"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secondary Diagnosis
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter secondary diagnosis"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Treatment Plan
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter treatment plan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter additional notes"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button className="btn-primary">Save Diagnosis</button>
                      </div>
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
