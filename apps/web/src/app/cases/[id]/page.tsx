"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Case {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
}

interface Artifact {
  id: string;
  kind: string;
  uri: string;
  meta_json: any;
  created_at: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate the case data since we don't have a specific endpoint
      // In a real implementation, you'd fetch from `/cases/{id}`
      const mockCase: Case = {
        id: caseId,
        title: "Sample Medical Case",
        status: "processing",
        created_at: new Date().toISOString(),
      };
      setCaseData(mockCase);

      // Mock artifacts data
      const mockArtifacts: Artifact[] = [
        {
          id: "1",
          kind: "image",
          uri: "s3://medlens/cases/123/xray.jpg",
          meta_json: { filename: "chest_xray.jpg", size: 1024000 },
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          kind: "document",
          uri: "s3://medlens/cases/123/lab_report.pdf",
          meta_json: { filename: "lab_report.pdf", size: 2048000 },
          created_at: new Date().toISOString(),
        },
      ];
      setArtifacts(mockArtifacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFileTypeIcon = (kind: string) => {
    switch (kind) {
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "vitals":
        return "📊";
      case "fhir":
        return "🏥";
      default:
        return "📎";
    }
  };

  const getFileTypeName = (kind: string) => {
    switch (kind) {
      case "image":
        return "Medical Image";
      case "document":
        return "Document";
      case "vitals":
        return "Vital Signs";
      case "fhir":
        return "FHIR Data";
      default:
        return "File";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading case</h3>
          <p className="text-red-600 mt-1">{error || "Case not found"}</p>
          <Link
            href="/cases"
            className="mt-3 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/cases"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Cases
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {caseData.title || "Untitled Case"}
            </h1>
            <p className="text-gray-600 mt-2">Case ID: {caseData.id}</p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
              caseData.status
            )}`}
          >
            {caseData.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Case Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Created
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(caseData.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    caseData.status
                  )}`}
                >
                  {caseData.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Files Uploaded
                </label>
                <p className="text-sm text-gray-900">
                  {artifacts.length} files
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Add More Files
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Edit Case
              </button>
              <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors">
                Delete Case
              </button>
            </div>
          </div>
        </div>

        {/* Files and Analysis */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uploaded Files
            </h3>

            {artifacts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No files uploaded
                </h4>
                <p className="text-gray-500 mb-4">
                  Upload medical images, documents, or data files to begin
                  analysis.
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Upload Files
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getFileTypeIcon(artifact.kind)}
                        </span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {artifact.meta_json?.filename || "Unknown file"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {getFileTypeName(artifact.kind)} •{" "}
                            {formatDate(artifact.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {(artifact.meta_json?.size / 1024 / 1024).toFixed(1)}{" "}
                          MB
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 text-sm">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              AI Analysis Results
            </h3>

            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Analysis in Progress
              </h4>
              <p className="text-gray-500 mb-4">
                AI is analyzing your uploaded files. Results will appear here
                shortly.
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Processing...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
