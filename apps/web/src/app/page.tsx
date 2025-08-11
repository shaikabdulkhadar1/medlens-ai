"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to MedLens AI
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Advanced AI-powered medical imaging and document analysis for
          healthcare professionals. Upload medical images, documents, and
          patient data for intelligent diagnosis assistance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/cases/new"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            🚀 Create New Case
          </Link>
          <Link
            href="/cases"
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
          >
            📋 View All Cases
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🖼️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Medical Imaging
            </h3>
            <p className="text-gray-600">
              Upload X-rays, CT scans, MRIs and other medical images for AI
              analysis
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Document Analysis
            </h3>
            <p className="text-gray-600">
              Process lab reports, medical records, and clinical documentation
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Vital Signs
            </h3>
            <p className="text-gray-600">
              Analyze patient vital signs data and detect anomalies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
