"use client";
import { useState, useEffect } from "react";
import { AnalysisResult } from "../lib/api";

interface AIAnalysisDisplayProps {
  analysisResults: AnalysisResult[];
  onGenerateReport?: () => void;
}

export default function AIAnalysisDisplay({
  analysisResults,
  onGenerateReport,
}: AIAnalysisDisplayProps) {
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleAnalysis = (analysisId: string) => {
    setExpandedAnalysis(expandedAnalysis === analysisId ? null : analysisId);
  };

  const getAnalysisIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "vitals":
        return "📊";
      default:
        return "🔍";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "processing":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const renderImageAnalysis = (analysis: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900">Condition</h4>
          <p className="text-sm text-gray-600">
            {analysis.predicted_condition}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Confidence</h4>
          <p className="text-sm text-gray-600">
            {(analysis.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {analysis.image_quality && (
        <div>
          <h4 className="font-medium text-gray-900">Image Quality</h4>
          <div className="text-sm text-gray-600">
            <p>
              Overall:{" "}
              {analysis.image_quality.overall_quality?.toFixed(1) || "N/A"}
            </p>
            <p>
              Brightness:{" "}
              {analysis.image_quality.brightness?.toFixed(1) || "N/A"}
            </p>
            <p>
              Contrast: {analysis.image_quality.contrast?.toFixed(1) || "N/A"}
            </p>
          </div>
        </div>
      )}

      {analysis.anatomical_regions &&
        analysis.anatomical_regions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900">Anatomical Regions</h4>
            <div className="flex flex-wrap gap-1">
              {analysis.anatomical_regions.map(
                (region: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {region}
                  </span>
                )
              )}
            </div>
          </div>
        )}

      {analysis.findings && analysis.findings.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Clinical Findings</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {analysis.findings.map((finding: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Recommendations</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {analysis.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderDocumentAnalysis = (analysis: any) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900">Document Type</h4>
          <p className="text-sm text-gray-600">{analysis.document_type}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Word Count</h4>
          <p className="text-sm text-gray-600">{analysis.word_count}</p>
        </div>
      </div>

      {analysis.summary && (
        <div>
          <h4 className="font-medium text-gray-900">Summary</h4>
          <p className="text-sm text-gray-600">{analysis.summary}</p>
        </div>
      )}

      {analysis.key_entities && analysis.key_entities.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Key Entities</h4>
          <div className="flex flex-wrap gap-1">
            {analysis.key_entities.map((entity: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.entities_by_type &&
        Object.keys(analysis.entities_by_type).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900">Entities by Type</h4>
            <div className="space-y-2">
              {Object.entries(analysis.entities_by_type).map(
                ([type, entities]: [string, any]) => (
                  <div key={type}>
                    <h5 className="text-sm font-medium text-gray-700 capitalize">
                      {type}
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entities.map((entity: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );

  const renderVitalsAnalysis = (analysis: any) => (
    <div className="space-y-3">
      {analysis.averages && Object.keys(analysis.averages).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Vital Signs Averages</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(analysis.averages).map(
              ([vital, value]: [string, any]) => (
                <div key={vital} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {vital.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium">
                    {typeof value === "number" ? value.toFixed(1) : value}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {analysis.anomalies && Object.keys(analysis.anomalies).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Anomalies</h4>
          <div className="space-y-1">
            {Object.entries(analysis.anomalies).map(
              ([vital, isAnomaly]: [string, any]) => (
                <div key={vital} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {vital.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isAnomaly ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isAnomaly ? "⚠️ Anomaly" : "✅ Normal"}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {analysis.alerts && analysis.alerts.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Alerts</h4>
          <div className="space-y-2">
            {analysis.alerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">
                    {alert.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      alert.severity === "high"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">{alert.description}</p>
                {alert.value && (
                  <p className="text-xs text-red-600 mt-1">
                    Value: {alert.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.trends && Object.keys(analysis.trends).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900">Trends</h4>
          <div className="space-y-1">
            {Object.entries(analysis.trends).map(
              ([vital, trend]: [string, any]) => (
                <div key={vital} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {vital.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium text-blue-600 capitalize">
                    {trend}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisContent = (result: AnalysisResult) => {
    const analysis = result.analysis;

    switch (result.analysis_kind.toLowerCase()) {
      case "image":
        return renderImageAnalysis(analysis);
      case "document":
        return renderDocumentAnalysis(analysis);
      case "vitals":
        return renderVitalsAnalysis(analysis);
      default:
        return (
          <div className="text-sm text-gray-600">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (!mounted) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading analysis...</p>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No AI analysis results available yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Upload files to trigger AI analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          AI Analysis Results
        </h3>
        {onGenerateReport && (
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate Report
          </button>
        )}
      </div>

      <div className="space-y-3">
        {analysisResults.map((result) => (
          <div
            key={result.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleAnalysis(result.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getAnalysisIcon(result.analysis_kind)}
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {result.analysis_kind} Analysis
                    </h4>
                    <p className="text-sm text-gray-500">
                      Model: {result.model_used} •{" "}
                      {result.processing_time.toFixed(2)}s
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      result.status
                    )}`}
                  >
                    {result.status}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedAnalysis === result.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {expandedAnalysis === result.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {result.status === "error" ? (
                  <div className="text-red-600">
                    <p className="font-medium">Analysis failed</p>
                    <p className="text-sm">{result.error_message}</p>
                  </div>
                ) : (
                  renderAnalysisContent(result)
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
