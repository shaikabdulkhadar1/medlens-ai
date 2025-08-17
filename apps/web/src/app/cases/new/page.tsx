"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

interface FileUpload {
  file: File;
  kind: "image" | "document" | "vitals" | "fhir";
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

export default function NewCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileUpload[]>([]);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: FileUpload["kind"]
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: FileUpload[] = selectedFiles.map((file) => ({
      file,
      kind,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createCase = async () => {
    if (!title.trim()) {
      setError("Please enter a case title");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the case first
      const caseData = await api.createCase({
        title: title.trim(),
        user_id: "e6de2df2-4bb4-43ed-b77a-50aa03526ba7",
      });
      const caseId = caseData.case_id;

      // Upload files if any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const fileUpload = files[i];

          // Update status to uploading
          setFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "uploading" } : f
            )
          );

          await api.uploadFile(caseId, fileUpload.kind, fileUpload.file);

          // Update status to completed
          setFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "completed", progress: 100 } : f
            )
          );
        }
      }

      // Redirect to the case detail page
      router.push(`/cases/${caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "uploading":
        return "⏳";
      case "error":
        return "❌";
      default:
        return "⏸️";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/cases"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Cases
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
        <p className="text-gray-600 mt-2">
          Start a new medical case and upload relevant files for AI analysis.
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Case Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Case Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter case title (e.g., 'Chest X-ray Analysis - Patient John Doe')"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* File Upload Sections */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>

            {/* Medical Images */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                🖼️ Medical Images
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Upload X-rays, CT scans, MRIs, or other medical images
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e, "image")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>

            {/* Documents */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📄 Medical Documents
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Upload lab reports, medical records, or clinical notes
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={(e) => handleFileSelect(e, "document")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>

            {/* Vitals Data */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                📊 Vital Signs
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Upload CSV files with patient vital signs data
              </p>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={(e) => handleFileSelect(e, "vitals")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>

            {/* FHIR Data */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                🏥 FHIR Data
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Upload FHIR-compliant healthcare data
              </p>
              <input
                type="file"
                accept=".json,.xml"
                multiple
                onChange={(e) => handleFileSelect(e, "fhir")}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Selected Files
              </h4>
              <div className="space-y-2">
                {files.map((fileUpload, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{getFileTypeIcon(fileUpload.kind)}</span>
                      <span className="text-sm font-medium">
                        {fileUpload.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({fileUpload.kind})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {getStatusIcon(fileUpload.status)}
                      </span>
                      {fileUpload.status === "uploading" && (
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileUpload.progress}%` }}
                          ></div>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/cases"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={createCase}
              disabled={loading || !title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Case"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
