import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI, uploadAPI, timelineAPI } from "../services/api";
import { Patient, UploadResponse, UploadUrl, AIAnalysis } from "../types";
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

  // Filter files by document type
  const userUploadedFiles = patientFiles.filter(
    (file) => file.documentType === "user-uploaded" || !file.documentType
  );
  const aiAnalysisReportFiles = patientFiles.filter(
    (file) => file.documentType === "ai-analysis-report"
  );
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);
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

  const handleFileDelete = async (fileKey: string, fileName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      console.log("Attempting to delete file:", { fileKey, fileName });
      const response = await uploadAPI.deleteFile(fileKey);
      console.log("Delete response:", response);

      if (response.success) {
        // Reload patient files after deletion
        loadPatientFiles();
        alert(`File "${fileName}" deleted successfully.`);
      } else {
        console.error("Delete failed:", response);
        alert(`Failed to delete file: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        `Error deleting file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleBulkDeleteDocuments = async () => {
    if (selectedDocuments.size === 0) return;

    const fileKeys = Array.from(selectedDocuments);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedDocuments.size} selected document(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      console.log("Attempting bulk delete for files:", fileKeys);
      const response = await uploadAPI.bulkDeleteFiles(fileKeys);
      console.log("Bulk delete response:", response);

      if (response.success) {
        const { summary } = response;
        setSelectedDocuments(new Set());
        loadPatientFiles();

        if (summary.failed === 0) {
          alert(`Successfully deleted all ${summary.successful} document(s).`);
        } else {
          alert(
            `Bulk delete completed: ${summary.successful} successful, ${summary.failed} failed.`
          );
        }
      } else {
        if (response.unauthorizedFiles) {
          alert(
            `Cannot delete some files: ${response.unauthorizedFiles.join(
              ", "
            )}. You can only delete files you uploaded.`
          );
        } else {
          alert(
            `Failed to delete documents: ${response.message || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
      alert(
        `Error deleting documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleBulkDeleteAnalysisReports = async () => {
    if (selectedAnalysisReports.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedAnalysisReports.size} selected analysis report(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Note: This would need a backend endpoint to delete analysis reports
      // For now, we'll just show a placeholder message
      alert(
        "Analysis report deletion functionality will be implemented with backend support."
      );
      setSelectedAnalysisReports(new Set());
    } catch (error) {
      console.error("Error in bulk delete analysis reports:", error);
      alert(
        `Error deleting analysis reports: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const toggleDocumentSelection = (fileKey: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(fileKey)) {
      newSelected.delete(fileKey);
    } else {
      newSelected.add(fileKey);
    }
    setSelectedDocuments(newSelected);
  };

  const toggleAnalysisReportSelection = (analysisId: string) => {
    const newSelected = new Set(selectedAnalysisReports);
    if (newSelected.has(analysisId)) {
      newSelected.delete(analysisId);
    } else {
      newSelected.add(analysisId);
    }
    setSelectedAnalysisReports(newSelected);
  };

  const getFileIcon = (fileName: string, documentType?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Special handling for AI analysis reports
    if (documentType === "ai-analysis-report") {
      if (extension === "pdf") {
        return <Brain className="w-5 h-5 text-purple-600" />;
      }
      return <Brain className="w-5 h-5 text-purple-500" />;
    }

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
    if (uploadedFiles.length === 0 || !patientId) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    setUploadProgress({});

    try {
      // Step 1: Upload files to R2
      console.log("📤 Starting file upload to R2...");

      // Initialize progress for all files
      uploadedFiles.forEach((file) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      });

      // Generate presigned URLs
      const response: UploadResponse = await uploadAPI.generateUploadUrls(
        uploadedFiles,
        patientId
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to generate upload URLs");
      }

      // Upload each file using presigned URLs
      const uploadPromises = response.uploadUrls.map(
        async (uploadUrl: UploadUrl) => {
          try {
            // Update progress to 25% (uploading)
            setUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 25,
            }));

            // Extract metadata from presigned URL
            const url = new URL(uploadUrl.presignedUrl);
            const params = new URLSearchParams(url.search);
            const metadata = {
              originalname: params.get("x-amz-meta-originalname") || "",
              patientid: params.get("x-amz-meta-patientid") || "",
              uploadedby: params.get("x-amz-meta-uploadedby") || "",
            };

            await uploadAPI.uploadToPresignedUrl(
              uploadUrl.presignedUrl,
              uploadedFiles.find((f) => f.name === uploadUrl.fileName)!,
              metadata
            );

            // Update progress to 75% (uploaded, confirming)
            setUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 75,
            }));

            // Confirm upload
            const confirmResponse = await uploadAPI.confirmUpload(
              uploadUrl.uploadId,
              uploadUrl.key
            );

            // Update progress to 100% (completed)
            setUploadProgress((prev) => ({
              ...prev,
              [uploadUrl.fileName]: 100,
            }));

            console.log(`✅ File uploaded successfully: ${uploadUrl.fileName}`);
            return {
              success: true,
              uploadId: confirmResponse.uploadRecord?.id,
              fileName: uploadUrl.fileName,
            };
          } catch (error) {
            console.error(`❌ Error uploading ${uploadUrl.fileName}:`, error);
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

      if (successfulUploads.length === 0) {
        throw new Error("All uploads failed");
      }

      console.log(`📁 Successfully uploaded ${successfulUploads.length} files`);

      // Step 2: Trigger AI analysis for each uploaded file
      console.log("🤖 Starting AI analysis...");

      const analysisPromises = successfulUploads.map(async (upload) => {
        if (!upload.uploadId) return;

        try {
          console.log(`🔍 Analyzing file: ${upload.fileName}`);
          const analysisResponse = await uploadAPI.analyzeDocument(
            upload.uploadId,
            patientId
          );

          if (analysisResponse.success) {
            console.log(`✅ AI analysis completed for: ${upload.fileName}`);
            return analysisResponse.data;
          } else {
            console.error(`❌ AI analysis failed for: ${upload.fileName}`);
            return null;
          }
        } catch (error) {
          console.error(
            `❌ Error during AI analysis for ${upload.fileName}:`,
            error
          );
          return null;
        }
      });

      // Wait for all AI analyses to complete
      const analysisResults = await Promise.all(analysisPromises);
      const validResults = analysisResults.filter(
        (result: any) => result !== null
      );

      console.log(`🎯 AI analysis completed for ${validResults.length} files`);

      // Step 3: Reload AI analyses to show results
      await loadAIAnalyses();

      // Show success message
      const message =
        failedUploads.length > 0
          ? `Successfully uploaded and analyzed ${successfulUploads.length} files. ${failedUploads.length} files failed.`
          : `Successfully uploaded and analyzed ${successfulUploads.length} files!`;

      alert(message);
    } catch (error) {
      console.error("❌ Error during upload and analysis:", error);
      alert(
        `Error during upload and analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress({});
      setUploadedFiles([]); // Clear uploaded files after processing
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
                  {/* Uploaded Documents Section */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Uploaded Documents
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
                                      file.fileKey || file.key
                                    )}
                                    onChange={() =>
                                      toggleDocumentSelection(
                                        file.fileKey || file.key
                                      )
                                    }
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  {getFileIcon(
                                    file.originalName || file.fileName,
                                    file.documentType
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
                                    onClick={() => triggerAIAnalysis(file._id)}
                                    disabled={isAnalyzing}
                                    className="p-2 text-gray-400 hover:text-purple-600 rounded-md hover:bg-purple-50 disabled:opacity-50"
                                    title="Analyze with AI"
                                  >
                                    <Brain className="w-4 h-4" />
                                  </button>
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
                                      handleFileDelete(
                                        file.fileKey || file.key,
                                        file.originalName || file.fileName
                                      )
                                    }
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                    title="Delete"
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

                  {/* AI Analysis Reports Section */}
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
                            onClick={handleBulkDeleteAnalysisReports}
                            disabled={selectedAnalysisReports.size === 0}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>
                              Delete Selected ({selectedAnalysisReports.size})
                            </span>
                          </button>
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
                        {isLoadingAnalysis ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : aiAnalysisReportFiles.length === 0 ? (
                          <div className="text-center py-12">
                            <Brain className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              No AI analysis reports
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Run AI analysis on uploaded documents to see
                              reports here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {aiAnalysisReportFiles.map((file, index) => (
                              <div
                                key={index}
                                className="p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedAnalysisReports.has(
                                        file._id
                                      )}
                                      onChange={() =>
                                        toggleAnalysisReportSelection(file._id)
                                      }
                                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    {getFileIcon(
                                      file.originalName || "AI Analysis Report",
                                      file.documentType
                                    )}
                                    <div>
                                      <h4 className="text-base font-medium text-gray-900">
                                        {file.originalName ||
                                          "AI Analysis Report"}
                                      </h4>
                                      <p className="text-xs text-gray-500">
                                        Generated {formatDate(file.createdAt)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() =>
                                        setSelectedAnalysis(
                                          selectedAnalysis === file
                                            ? null
                                            : file
                                        )
                                      }
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      {selectedAnalysis === file ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {selectedAnalysis === file && (
                                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                                    <div className="text-sm text-gray-700">
                                      AI Analysis Report - {file.originalName}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Document analysis and model selection
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Text extraction and summarization
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Medical entity recognition
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Loader className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-xs text-gray-600">
                              Generating final AI report
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          This may take 30-60 seconds depending on document
                          complexity...
                        </p>
                      </div>
                    )}
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
                          {aiAnalyses.map((analysis) => (
                            <div
                              key={analysis._id}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">
                                  {analysis.fileName}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    analysis.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : analysis.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {analysis.status}
                                </span>
                              </div>

                              {analysis.status === "completed" &&
                                analysis.analysisResult && (
                                  <div className="space-y-4">
                                    {/* File Info Row */}
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                      {analysis.analysisResult.confidence && (
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">
                                            Confidence:
                                          </span>
                                          <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                              analysis.analysisResult
                                                .confidence > 0.8
                                                ? "bg-green-100 text-green-800"
                                                : analysis.analysisResult
                                                    .confidence > 0.6
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {(
                                              analysis.analysisResult
                                                .confidence * 100
                                            ).toFixed(1)}
                                            %
                                          </span>
                                        </div>
                                      )}
                                      {analysis.analysisResult
                                        .processingTime && (
                                        <div className="text-xs text-gray-500">
                                          Processed in{" "}
                                          {Math.round(
                                            analysis.analysisResult
                                              .processingTime / 1000
                                          )}
                                          s
                                        </div>
                                      )}
                                    </div>

                                    {/* AI Analysis Summary */}
                                    {analysis.analysisResult.summary && (
                                      <div>
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                                          🩺 AI Analysis
                                        </h6>
                                        <div className="bg-gray-50 rounded-lg p-4 w-full">
                                          <div className="text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto pr-2 whitespace-pre-line">
                                            {formatAIResponse(
                                              analysis.analysisResult.summary
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                              {analysis.status === "processing" && (
                                <div className="flex items-center space-x-2 text-blue-600">
                                  <Loader className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Processing...</span>
                                </div>
                              )}

                              {analysis.status === "failed" && (
                                <div className="text-red-600 text-sm">
                                  Analysis failed: {analysis.errorMessage}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No AI Analysis Results */}
                      {!isLoadingAnalysis && aiAnalyses.length === 0 && (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            No AI Analysis Results
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Upload files and run AI analysis to see detailed
                            insights here.
                          </p>
                        </div>
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
