const API_BASE_URL = "http://localhost:8000";

export interface Case {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
}

export interface CreateCaseRequest {
  user_id: string;
  title: string | null;
}

export interface CreateCaseResponse {
  case_id: string;
}

export interface CasesResponse {
  cases: Case[];
}

export interface Artifact {
  id: string;
  kind: string;
  uri: string;
  meta_json: any;
  parsed_json: any;
  created_at: string;
}

export interface ModelRun {
  id: string;
  artifact_id: string | null;
  task: string;
  model_name: string;
  params_json: any;
  result_json: any;
  latency_ms: number | null;
  cache_hit: boolean;
  created_at: string;
}

export interface CaseDetail {
  id: string;
  user_id: string;
  title: string | null;
  status: string;
  created_at: string;
  artifacts: Artifact[];
  model_runs: ModelRun[];
  analysis_results?: AnalysisResult[];
}

export interface AnalysisResult {
  id: string;
  artifact_id: string;
  analysis_kind: string;
  analysis: any;
  model_used: string;
  processing_time: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface UploadResponse {
  s3_uri: string;
  artifact_id: string;
}

export interface IngestRequest {
  case_id: string;
  artifacts: {
    kind: string;
    s3_uri: string;
    meta?: any;
  }[];
}

export interface IngestResponse {
  queued: boolean;
  artifacts: number;
}

// API Functions
export const api = {
  // Cases
  async listCases(userId: string, limit: number = 50): Promise<CasesResponse> {
    const response = await fetch(
      `${API_BASE_URL}/cases?user_id=${userId}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch cases");
    }
    return response.json();
  },

  async createCase(data: CreateCaseRequest): Promise<CreateCaseResponse> {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create case");
    }
    return response.json();
  },

  async getCase(caseId: string): Promise<CaseDetail> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Case not found");
      }
      throw new Error("Failed to fetch case");
    }
    return response.json();
  },

  // File Upload
  async uploadFile(
    caseId: string,
    kind: string,
    file: File
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("case_id", caseId);
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/direct`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to upload file");
    }
    return response.json();
  },

  // Job Processing
  async ingestArtifacts(data: IngestRequest): Promise<IngestResponse> {
    const response = await fetch(`${API_BASE_URL}/cases/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to ingest artifacts");
    }
    return response.json();
  },

  // Health Check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    return response.json();
  },

  // AI Analysis Results
  async getAnalysisResults(caseId: string): Promise<AnalysisResult[]> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/analysis`);
    if (!response.ok) {
      throw new Error("Failed to fetch analysis results");
    }
    return response.json();
  },

  async getArtifactAnalysis(artifactId: string): Promise<AnalysisResult[]> {
    const response = await fetch(
      `${API_BASE_URL}/cases/artifacts/${artifactId}/analysis`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch artifact analysis");
    }
    return response.json();
  },

  async generateMedicalReport(caseId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/cases/${caseId}/generate-report`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to generate medical report");
    }
    return response.json();
  },

  // Delete case
  async deleteCase(
    caseId: string
  ): Promise<{ message: string; case_id: string }> {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete case");
    }
    return response.json();
  },
};
