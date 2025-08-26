import axios from "axios";
import { LoginRequest, LoginResponse, ApiResponse, User } from "../types";

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

export default api;
