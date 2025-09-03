export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | "admin"
    | "senior_doctor"
    | "consulting_doctor"
    | "front-desk-coordinator"
    | "jr-doctor";
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

export interface DownloadUrlResponse {
  success: boolean;
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
  contentType: string;
}

export interface UploadRecord {
  _id: string;
  patientId: string;
  fileKey: string;
  originalName: string;
  uploadedBy: string;
  status: "pending" | "completed" | "failed";
  documentType: "uploaded-by-user" | "ai-analysis-report";
  fileSize: number;
  contentType: string;
  uploadId?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  metadata?: {
    patientId: string;
    uploadedBy: string;
    originalName: string;
    analysisId?: string;
    originalDocumentId?: string;
    isPDF?: boolean;
  };
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
  rawResponse?: string;
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
  // Additional properties from backend response
  fileKey?: string;
  originalName?: string;
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
  bloodType?: string;
  maritalStatus?: string;
  occupation?: string;
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
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    coverageType?: string;
    effectiveDate?: string;
    expiryDate?: string;
    deductible?: string;
    copay?: string;
  };
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    bmi?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
  };
  medicalConditions?: {
    diabetes?: boolean;
    hypertension?: boolean;
    heartDisease?: boolean;
    asthma?: boolean;
    cancer?: boolean;
    kidneyDisease?: boolean;
    liverDisease?: boolean;
    thyroidDisorder?: boolean;
  };
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy?: string;
    notes?: string;
  }>;
  surgicalHistory?: Array<{
    procedure: string;
    date: string;
    hospital: string;
    surgeon: string;
    notes?: string;
  }>;
  familyHistory?: Array<{
    condition: string;
    relationship: string;
    ageOfOnset?: string;
    notes?: string;
  }>;
  lifestyleInfo?: {
    smokingStatus?: string;
    alcoholConsumption?: string;
    exerciseFrequency?: string;
    diet?: string;
    occupation?: string;
  };
  allergies?: string[];
  frontDeskNotes?: {
    chiefComplaint?: string;
    presentIllness?: string;
    initialDiagnosis?: string;
    symptoms?: string[];
    observations?: string;
    createdBy?: string | User;
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string | User;
  };
  uploadedDocuments?: Array<{
    fileName: string;
    fileType: string;
    size: number;
    uploadDate: string;
    category: string;
    url?: string;
  }>;
  aiAnalysisReports?: Array<{
    reportType: string;
    status: "completed" | "processing" | "failed";
    analysisDate: string;
    summary?: string;
    findings?: string;
    recommendations?: string;
    modelUsed?: string;
    confidence?: number;
  }>;
  labResults?: Array<{
    testName: string;
    testDate: string;
    result: string;
    normalRange: string;
    unit: string;
    status: string;
    notes?: string;
  }>;
  assignedDoctor?: string | User;
  createdBy?: string | User;
  status?:
    | "active"
    | "assigned_to_senior"
    | "under_treatment"
    | "discharged"
    | "archived";
  isActive: boolean;
  nextAppointment?: string;
  notes?: string;
  lastVisited?: string;
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

// Junior Doctor Types
export interface CreatePatientRequest {
  patientId?: string;
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
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  medicalConditions?: {
    diabetes?: boolean;
    hypertension?: boolean;
    heartDisease?: boolean;
    asthma?: boolean;
  };
  allergies?: string[];
  initialDiagnosis?: string;
  symptoms?: string[];
  assignedSeniorDoctorId?: string;
}

export interface UpdateDiagnosisRequest {
  initialDiagnosis?: string;
  symptoms?: string[];
  observations?: string;
  assignedSeniorDoctorId?: string;
}

export interface SeniorDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  hospital?: string;
  department?: string;
}
