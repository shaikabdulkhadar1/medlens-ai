"use client";
import { useState } from "react";
import { api } from "../lib/api";

interface FileUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

interface FileUpload {
  file: File;
  kind: "image" | "document" | "vitals" | "fhir";
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
}

export default function FileUpload({
  caseId,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const fileUpload = files[i];

        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, index) =>
            index === i ? { ...f, status: "uploading" } : f
          )
        );

        try {
          await api.uploadFile(caseId, fileUpload.kind, fileUpload.file);

          // Update status to completed
          setFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "completed", progress: 100 } : f
            )
          );
        } catch (err) {
          // Update status to error
          setFiles((prev) =>
            prev.map((f, index) =>
              index === i ? { ...f, status: "error" } : f
            )
          );
          throw err;
        }
      }

      // Clear files after successful upload
      setFiles([]);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
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
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* File Upload Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Medical Images */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            🖼️ Medical Images
          </h4>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, "image")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>

        {/* Documents */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            📄 Medical Documents
          </h4>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={(e) => handleFileSelect(e, "document")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>

        {/* Vitals Data */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            📊 Vital Signs
          </h4>
          <input
            type="file"
            accept=".csv"
            multiple
            onChange={(e) => handleFileSelect(e, "vitals")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>

        {/* FHIR Data */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            🏥 FHIR Data
          </h4>
          <input
            type="file"
            accept=".json,.xml"
            multiple
            onChange={(e) => handleFileSelect(e, "fhir")}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
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
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${files.length} File${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
