import axios, { AxiosProgressEvent } from "axios";
import {
  LoginRequest,
  LoginResponse,
  ApiResponse,
  User,
  UploadResponse,
  ConfirmUploadResponse,
  BulkDeleteResponse,
  DownloadUrlResponse,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>("/auth/me");
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>("/auth/me", data);
    return response.data;
  },

  getUsers: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>("/auth/users");
    return response.data;
  },

  getUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(`/auth/users/${userId}`);
    return response.data;
  },

  updateUser: async (
    userId: string,
    data: Partial<User>
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(`/auth/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/auth/users/${userId}`);
    return response.data;
  },

  registerUser: async (
    userData: Partial<User> & { password: string }
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/auth/register", userData);
    return response.data;
  },

  assignDoctor: async (
    consultingDoctorId: string,
    seniorDoctorId: string
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/auth/assign-doctor", {
      consultingDoctorId,
      seniorDoctorId,
    });
    return response.data;
  },

  getPatients: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>("/auth/patients");
    return response.data;
  },

  updatePatient: async (
    patientId: string,
    patientData: any
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/auth/patients/${patientId}`,
      patientData
    );
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  generateUploadUrls: async (
    files: File[],
    patientId: string
  ): Promise<UploadResponse> => {
    const filesInfo = files.map((file) => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }));

    const response = await api.post<UploadResponse>(
      "/upload/generate-upload-urls",
      {
        patientId,
        files: filesInfo,
      }
    );
    return response.data;
  },

  uploadToPresignedUrl: async (
    presignedUrl: string,
    file: File,
    metadata?: {
      patientId?: string;
      uploadedBy?: string;
      originalName?: string;
    }
  ): Promise<void> => {
    const headers: { [key: string]: string } = {};
    if (metadata?.originalName)
      headers["x-amz-meta-originalname"] = metadata.originalName;
    if (metadata?.patientId)
      headers["x-amz-meta-patientid"] = metadata.patientId;
    if (metadata?.uploadedBy)
      headers["x-amz-meta-uploadedby"] = metadata.uploadedBy;

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers,
      mode: "cors",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  },

  confirmUpload: async (
    uploadId: string,
    key: string
  ): Promise<ConfirmUploadResponse> => {
    const response = await api.post<ConfirmUploadResponse>(
      "/upload/confirm-upload",
      {
        uploadId,
        key,
      }
    );
    return response.data;
  },

  getPatientFiles: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      `/upload/patient/${patientId}/files`
    );
    return response.data;
  },

  getDownloadUrl: async (key: string): Promise<DownloadUrlResponse> => {
    const response = await api.get<DownloadUrlResponse>(
      `/upload/download/${encodeURIComponent(key)}`
    );
    return response.data;
  },

  deleteFile: async (key: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(
      `/upload/delete/${encodeURIComponent(key)}`
    );
    return response.data;
  },

  bulkDeleteFiles: async (fileKeys: string[]): Promise<BulkDeleteResponse> => {
    const response = await api.delete<BulkDeleteResponse>(
      "/upload/bulk-delete",
      {
        data: { fileKeys },
      }
    );
    return response.data;
  },

  // AI Analysis API
  analyzeDocument: async (
    uploadId: string,
    patientId: string
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/upload/analyze", {
      uploadId,
      patientId,
    });
    return response.data;
  },

  directUpload: async (
    file: File,
    patientId: string,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<ApiResponse> => {
    const form = new FormData();
    form.append("file", file);
    form.append("patientId", patientId);
    const response = await api.post<ApiResponse>("/upload/direct", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return response.data as ApiResponse;
  },

  getAnalysis: async (analysisId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      `/upload/analysis/${analysisId}`
    );
    return response.data;
  },

  getPatientAnalysis: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      `/upload/patient/${patientId}/analysis`
    );
    return response.data;
  },
};

// Timeline API
export const timelineAPI = {
  getPatientTimeline: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      `/timeline/patient/${patientId}`
    );
    return response.data;
  },

  addTimelineEntry: async (
    patientId: string,
    timelineData: any
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(
      `/timeline/patient/${patientId}`,
      timelineData
    );
    return response.data;
  },

  updateTimelineEntry: async (
    patientId: string,
    entryIndex: number,
    timelineData: any
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/timeline/${patientId}/${entryIndex}`,
      timelineData
    );
    return response.data;
  },

  deleteTimelineEntry: async (
    patientId: string,
    entryIndex: number
  ): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(
      `/timeline/${patientId}/${entryIndex}`
    );
    return response.data;
  },
};

// Visits API
export const visitsAPI = {
  getPatientVisits: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(`/visits/patient/${patientId}`);
    return response.data;
  },
  addVisit: async (
    patientId: string,
    visit: {
      visitDate: string | Date;
      initialDiagnosis?: string;
      updates?: string;
      summary?: string;
      medicationsGiven?: string[];
    }
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(
      `/visits/patient/${patientId}`,
      visit
    );
    return response.data;
  },
  updateVisit: async (
    patientId: string,
    visitIndex: number,
    visit: Partial<{
      visitDate: string | Date;
      initialDiagnosis: string;
      updates: string;
      summary: string;
      medicationsGiven: string[];
    }>
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/visits/${patientId}/${visitIndex}`,
      visit
    );
    return response.data;
  },
};

// Dashboard API (placeholder for future endpoints)
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse> => {
    // This will be implemented when we add dashboard endpoints
    return {
      success: true,
      data: {
        totalPatients: 0,
        totalCases: 0,
        pendingCases: 0,
        completedCases: 0,
        recentActivity: [],
      },
    };
  },
};

// Front Desk Coordinator API
export const frontDeskCoordinatorAPI = {
  // Patient Management
  createPatient: async (patientData: any): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(
      "/front-desk-coordinator/patients",
      patientData
    );
    return response.data;
  },

  getPatients: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      "/front-desk-coordinator/patients"
    );
    return response.data;
  },

  getMyPatients: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      "/front-desk-coordinator/my-patients"
    );
    return response.data;
  },

  getPatient: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      `/front-desk-coordinator/patients/${patientId}`
    );
    return response.data;
  },

  updatePatientDiagnosis: async (
    patientId: string,
    diagnosisData: any
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/front-desk-coordinator/patients/${patientId}/diagnosis`,
      diagnosisData
    );
    return response.data;
  },

  // Senior Doctor Management
  getSeniorDoctors: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(
      "/front-desk-coordinator/senior-doctors"
    );
    return response.data;
  },

  // Patient Update and Doctor Assignment
  updatePatient: async (
    patientId: string,
    patientData: any
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/front-desk-coordinator/patients/${patientId}`,
      patientData
    );
    return response.data;
  },

  assignDoctor: async (
    patientId: string,
    doctorId: string
  ): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/front-desk-coordinator/patients/${patientId}/assign-doctor`,
      { doctorId }
    );
    return response.data;
  },

  unassignDoctor: async (patientId: string): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(
      `/front-desk-coordinator/patients/${patientId}/unassign-doctor`
    );
    return response.data;
  },
};

// Patient Management API
export const patientAPI = {
  // Get all patients with pagination and filtering
  getPatients: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    assignedDoctor?: string;
  }) => {
    const response = await api.get("/patients", { params });
    return response.data;
  },

  // Get single patient by ID
  getPatient: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  // Create new patient
  createPatient: async (patientData: any) => {
    const response = await api.post("/patients", patientData);
    return response.data;
  },

  // Update patient
  updatePatient: async (id: string, patientData: any) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  // Delete patient
  deletePatient: async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  // Add document to patient
  addDocument: async (patientId: string, documentData: any) => {
    const response = await api.post(
      `/patients/${patientId}/documents`,
      documentData
    );
    return response.data;
  },

  // Add AI analysis report to patient
  addAIReport: async (patientId: string, reportData: any) => {
    const response = await api.post(
      `/patients/${patientId}/ai-reports`,
      reportData
    );
    return response.data;
  },

  // Add lab result to patient
  addLabResult: async (patientId: string, labData: any) => {
    const response = await api.post(
      `/patients/${patientId}/lab-results`,
      labData
    );
    return response.data;
  },

  // Get patient statistics
  getPatientStats: async () => {
    const response = await api.get("/patients/stats/overview");
    return response.data;
  },
};

export default api;
