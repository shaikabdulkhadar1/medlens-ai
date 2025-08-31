export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "senior_doctor" | "consulting_doctor";
  specialization?: string;
  licenseNumber?: string;
  hospital?: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  profileImage?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  assignedSeniorDoctor?: string;
  assignedConsultingDoctors?: string[];
  assignedPatients?: string[];
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

export interface UserHierarchy {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  seniorDoctor?: User;
  consultingDoctors?: User[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
  hierarchy: UserHierarchy;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  users?: User[];
  user?: User;
  hierarchy?: UserHierarchy;
}

export interface UploadedFile {
  success: boolean;
  url: string;
  key: string;
  originalName: string;
  size: number;
  contentType: string;
}

export interface UploadUrl {
  fileName: string;
  presignedUrl: string;
  uploadId: string;
  key: string;
  expiresIn: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  uploadUrls: UploadUrl[];
  errors?: Array<{
    fileName: string;
    error: string;
  }>;
}

export interface ConfirmUploadResponse {
  success: boolean;
  message: string;
  uploadRecord: {
    id: string;
    key: string;
    originalName: string;
    status: string;
  };
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  results: {
    successful: Array<{
      fileKey: string;
      fileName: string;
      success: boolean;
    }>;
    failed: Array<{
      fileKey: string;
      fileName: string;
      error: string;
    }>;
  };
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  unauthorizedFiles?: string[];
}

// AI Analysis Types
export interface MedicalEntity {
  entity: string;
  type:
    | "symptom"
    | "diagnosis"
    | "medication"
    | "procedure"
    | "body_part"
    | "condition"
    | "measurement";
  confidence: number;
}

export interface ImageFinding {
  finding: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Abnormality {
  abnormality: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
}

export interface AIAnalysisResult {
  confidence?: number;
  extractedText?: string;
  summary?: string;
  keyFindings: string[];
  recommendations: string[];
  medicalEntities: MedicalEntity[];
  imageFindings: ImageFinding[];
  abnormalities: Abnormality[];
  modelResults: Record<string, any>;
  finalReport?: string;
  processingTime?: number;
}

export interface AIAnalysis {
  _id: string;
  patientId: string | User;
  documentId: string;
  analysisId: string;
  fileName: string;
  analysisType: string;
  documentType?: "image" | "text" | "pdf" | "mixed";
  contentType?: string;
  analysisResult: AIAnalysisResult;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  processedBy?: string | User;
  metadata?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  formattedProcessingTime?: string;
  statusBadge?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface Patient {
  _id: string;
  patientId: string;
  mrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      startDate?: string;
      endDate?: string;
    }>;
    conditions?: Array<{
      name: string;
      diagnosedDate?: string;
      status?: "active" | "resolved" | "chronic";
    }>;
    surgeries?: Array<{
      procedure: string;
      date?: string;
      hospital?: string;
      surgeon?: string;
    }>;
  };
  insurance?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    effectiveDate?: string;
    expiryDate?: string;
  };
  vitalSigns?: {
    height?: {
      value?: number;
      unit?: "cm" | "inches";
    };
    weight?: {
      value?: number;
      unit?: "kg" | "lbs";
    };
    bloodPressure?: {
      systolic?: number;
      diastolic?: number;
    };
    heartRate?: number;
    temperature?: number;
    lastUpdated?: string;
  };
  assignedDoctor: string | User;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  age?: number;
}

export interface DashboardStats {
  totalPatients: number;
  totalCases: number;
  pendingCases: number;
  completedCases: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}
