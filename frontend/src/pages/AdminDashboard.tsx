import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import {
  Users,
  Stethoscope,
  UserCheck,
  Shield,
  Activity,
  Filter,
  MoreVertical,
  Plus,
  Eye,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Database,
  BarChart3,
  Settings,
  Monitor,
  Server,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  Bell,
  Download,
  Upload,
  Cog,
  Key,
  Network,
  Zap,
  Heart,
  Brain,
  Pill,
  Syringe,
  Thermometer,
  Scale,
  LogOut,
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    isActive: true,
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    specialization: "",
    licenseNumber: "",
    startedWorking: "",
    lastLogin: "",
    documents: {
      idDocument: "",
      licenseDocument: "",
      otherDocuments: [],
    },
    assignedPatients: [],
  });
  const [createFormData, setCreateFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    specialization: "",
    licenseNumber: "",
    hospital: "",
    department: "",
    startedWorking: "",
    documents: {
      idDocument: "",
      licenseDocument: "",
      otherDocuments: [],
    },
  });
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "patients">(
    "overview"
  );
  const [systemStats, setSystemStats] = useState({
    totalPatients: 0,
    totalCases: 0,
    activeUsers: 0,
    systemUptime: "99.9%",
    storageUsed: "2.4 GB",
    lastBackup: "2 hours ago",
  });
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
    loadSystemStats();
    loadPatientAndDoctorCounts();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getUsers();
      if (response.success && response.users) {
        setUsers(response.users);
        // Recalculate doctor count after users are loaded
        const doctors = response.users.filter(
          (u) =>
            u.role === "senior_doctor" ||
            u.role === "consulting_doctor" ||
            u.role === "jr-doctor"
        );
        setDoctorCount(doctors.length);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemStats = async () => {
    // Mock system stats - in real app, these would come from API
    setSystemStats({
      totalPatients: 1247,
      totalCases: 892,
      activeUsers: 45,
      systemUptime: "99.9%",
      storageUsed: "2.4 GB",
      lastBackup: "2 hours ago",
    });
  };

  const loadPatientAndDoctorCounts = async () => {
    try {
      // Calculate doctor count from users
      const doctors = users.filter(
        (u) =>
          u.role === "senior_doctor" ||
          u.role === "consulting_doctor" ||
          u.role === "jr-doctor"
      );
      setDoctorCount(doctors.length);

      // Fetch patient count from API
      try {
        const response = await authAPI.getPatients();
        if (response.success && response.data) {
          setPatientCount(response.data.length);
        } else {
          // Fallback to system stats if API fails
          setPatientCount(systemStats.totalPatients);
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        // Fallback to system stats if API fails
        setPatientCount(systemStats.totalPatients);
      }
    } catch (error) {
      console.error("Failed to load patient and doctor counts:", error);
    }
  };

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      const response = await authAPI.getPatients();
      if (response.success && response.data) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setPatientsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName
        ?.toLowerCase()
        .includes(patientSearchTerm.toLowerCase()) ||
      patient.lastName
        ?.toLowerCase()
        .includes(patientSearchTerm.toLowerCase()) ||
      patient.patientId
        ?.toLowerCase()
        .includes(patientSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "senior_doctor":
        return <Stethoscope className="h-4 w-4" />;
      case "consulting_doctor":
        return <UserCheck className="h-4 w-4" />;
      case "front-desk-coordinator":
        return <UserCheck className="h-4 w-4" />;
      case "jr-doctor":
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (role) {
      case "admin":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case "senior_doctor":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Stethoscope className="h-3 w-3 mr-1" />
            Senior Doctor
          </span>
        );
      case "consulting_doctor":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <UserCheck className="h-3 w-3 mr-1" />
            Consulting Doctor
          </span>
        );
      case "front-desk-coordinator":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <UserCheck className="h-3 w-3 mr-1" />
            Front Desk
          </span>
        );
      case "jr-doctor":
        return (
          <span className={`${baseClasses} bg-indigo-100 text-indigo-800`}>
            <Stethoscope className="h-3 w-3 mr-1" />
            Junior Doctor
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <UserCheck className="h-3 w-3 mr-1" />
            {role}
          </span>
        );
    }
  };

  const getDashboardStats = () => {
    const frontDeskCount = users.filter(
      (u) => u.role === "front-desk-coordinator"
    ).length;

    return [
      {
        label: "Total Patients",
        value: patientCount,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        label: "Total Doctors",
        value: doctorCount,
        icon: Stethoscope,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
      {
        label: "Front Desk",
        value: frontDeskCount,
        icon: UserCheck,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
    ];
  };

  const getSystemHealthStats = () => {
    return [
      {
        label: "System Uptime",
        value: systemStats.systemUptime,
        icon: Server,
        color: "text-green-600",
        bgColor: "bg-green-50",
        status: "healthy",
      },
      {
        label: "Storage Used",
        value: systemStats.storageUsed,
        icon: Database,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        status: "normal",
      },
      {
        label: "Active Users",
        value: systemStats.activeUsers,
        icon: Users,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        status: "active",
      },
      {
        label: "Last Backup",
        value: systemStats.lastBackup,
        icon: Clock,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        status: "recent",
      },
    ];
  };

  const handleUserAction = (action: string, user: any) => {
    console.log(`${action} user:`, user);
    if (action === "view") {
      setSelectedUser(user);
      setShowUserDetailsModal(true);
    } else if (action === "edit") {
      setEditingUser(user);
      setEditFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "",
        isActive: user.isActive !== undefined ? user.isActive : true,
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
          country: user.address?.country || "",
        },
        specialization: user.specialization || "",
        licenseNumber: user.licenseNumber || "",
        startedWorking: user.startedWorking || "",
        lastLogin: user.lastLogin || "",
        documents: {
          idDocument: user.documents?.idDocument || "",
          licenseDocument: user.documents?.licenseDocument || "",
          otherDocuments: user.documents?.otherDocuments || [],
        },
        assignedPatients: user.assignedPatients || [],
      });
      setShowEditUserModal(true);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // In real app, call API to toggle user status
      setUsers(
        users.map((u) =>
          u._id === userId ? { ...u, isActive: !currentStatus } : u
        )
      );
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedFormChange = (
    parentField: string,
    childField: string,
    value: any
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof typeof prev] as any),
        [childField]: value,
      },
    }));
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;

    try {
      // In real app, call API to update user
      const updatedUser = {
        ...editingUser,
        ...editFormData,
        fullName: `${editFormData.firstName} ${editFormData.lastName}`,
      };

      setUsers(users.map((u) => (u._id === editingUser._id ? updatedUser : u)));

      // Close modal and reset state
      setShowEditUserModal(false);
      setEditingUser(null);
      setEditFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        isActive: true,
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        specialization: "",
        licenseNumber: "",
        startedWorking: "",
        lastLogin: "",
        documents: {
          idDocument: "",
          licenseDocument: "",
          otherDocuments: [],
        },
        assignedPatients: [],
      });

      // Show success message
      alert("User updated successfully!");
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
    setEditFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      isActive: true,
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      specialization: "",
      licenseNumber: "",
      startedWorking: "",
      lastLogin: "",
      documents: {
        idDocument: "",
        licenseDocument: "",
        otherDocuments: [],
      },
      assignedPatients: [],
    });
  };

  const handleCreateFormChange = (field: string, value: any) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateNestedFormChange = (
    parentField: string,
    childField: string,
    value: any
  ) => {
    setCreateFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof typeof prev] as any),
        [childField]: value,
      },
    }));
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (
        !createFormData.firstName ||
        !createFormData.lastName ||
        !createFormData.email ||
        !createFormData.password ||
        !createFormData.role
      ) {
        alert(
          "Please fill in all required fields (First Name, Last Name, Email, Password, Role)"
        );
        return;
      }

      // Call API to create user
      const payload: any = {
        email: createFormData.email,
        password: createFormData.password,
        firstName: createFormData.firstName,
        lastName: createFormData.lastName,
        role: createFormData.role,
        specialization: createFormData.specialization || undefined,
        licenseNumber: createFormData.licenseNumber || undefined,
        hospital: createFormData.hospital || undefined,
        department: createFormData.department || undefined,
        phone: createFormData.phone || undefined,
        startedWorking: createFormData.startedWorking || undefined,
        address: createFormData.address,
        documents: createFormData.documents,
      };

      const registerRes = await authAPI.registerUser(payload);
      if (!registerRes.success) {
        throw new Error(registerRes.message || "Registration failed");
      }

      // Refresh users list from server
      const usersRes = await authAPI.getUsers();
      if (usersRes.success) {
        setUsers(usersRes.users || usersRes.data?.users || []);
      }

      // Close modal and reset form
      setShowCreateUserModal(false);
      setCreateFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        specialization: "",
        licenseNumber: "",
        hospital: "",
        department: "",
        startedWorking: "",
        documents: {
          idDocument: "",
          licenseDocument: "",
          otherDocuments: [],
        },
      });

      // Show success message
      alert("User created successfully!");
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user. Please try again.");
    }
  };

  const handleCancelCreate = () => {
    setShowCreateUserModal(false);
    setCreateFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      specialization: "",
      licenseNumber: "",
      hospital: "",
      department: "",
      startedWorking: "",
      documents: {
        idDocument: "",
        licenseDocument: "",
        otherDocuments: [],
      },
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  MedLens AI - Admin
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </span>
                </div>
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Administrator {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Manage your system, monitor performance, and oversee all users and
            operations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              System Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => {
                setActiveTab("patients");
                if (patients.length === 0) {
                  loadPatients();
                }
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "patients"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Patient Management
            </button>
          </nav>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Quick Stats */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                System Overview
              </h3>
              <button
                onClick={loadPatientAndDoctorCounts}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Counts
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {getDashboardStats().map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* System Health & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* System Health */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Health
                  </h3>
                  <button
                    onClick={loadSystemStats}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {getSystemHealthStats().map((stat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {stat.label}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-900 mr-2">
                          {stat.value}
                        </span>
                        {stat.status === "healthy" && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {stat.status === "normal" && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                        {stat.status === "active" && (
                          <div className="h-2 w-2 bg-purple-500 rounded-full" />
                        )}
                        {stat.status === "recent" && (
                          <Clock className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      New patient registered
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      2 min ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      AI analysis completed
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      5 min ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">User login</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      8 min ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      System backup completed
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      2 hours ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* User Management Tab Content */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage all system users and their permissions
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button
                    onClick={loadUsers}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Users
                  </button>
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="senior_doctor">Senior Doctor</option>
                    <option value="consulting_doctor">Consulting Doctor</option>
                    <option value="front-desk-coordinator">Front Desk</option>
                    <option value="jr-doctor">Junior Doctor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUserAction("view", user)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction("edit", user)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                toggleUserStatus(user._id, user.isActive)
                              }
                              className={`p-1 ${
                                user.isActive
                                  ? "text-orange-600 hover:text-orange-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                              title={
                                user.isActive
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                            >
                              {user.isActive ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleUserAction("delete", user)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patient Management Tab Content */}
        {activeTab === "patients" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Patient Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    View and manage all patients in the system
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={loadPatients}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Patients
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Search */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visited
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientsLoading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Loading patients...
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No patients found
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient, index) => (
                      <tr key={patient._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {patient.patientId || patient._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.firstName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.lastName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.assignedDoctor
                            ? "Dr. " + patient.assignedDoctor
                            : "Unassigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.createdAt
                            ? new Date(patient.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.lastVisited
                            ? new Date(patient.lastVisited).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                // Open patient details in new tab
                                const patientDetailsUrl = `/admin/patient/${patient._id}`;
                                window.open(patientDetailsUrl, "_blank");
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Patient Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete patient ${patient.firstName} ${patient.lastName}?`
                                  )
                                ) {
                                  // TODO: Implement delete functionality
                                  console.log("Delete patient:", patient._id);
                                  alert(
                                    "Delete functionality will be implemented"
                                  );
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete Patient"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 text-left">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">
                  System Backup
                </h3>
                <p className="text-xs text-gray-500">Create system backup</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 text-left">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
                <p className="text-xs text-gray-500">View system analytics</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 text-left">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Settings</h3>
                <p className="text-xs text-gray-500">System configuration</p>
              </div>
            </div>
          </button>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 text-left">
            <div className="flex items-center">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Monitor className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Logs</h3>
                <p className="text-xs text-gray-500">
                  System logs & monitoring
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details - {selectedUser.fullName}
                </h3>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Basic Information
                    </h4>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Name:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.fullName}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.email}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Phone:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.phone || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Role:
                      </label>
                      <div className="mt-1">
                        {getRoleBadge(selectedUser.role)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Status:
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                          selectedUser.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Professional Information
                    </h4>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Specialization:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.specialization || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        License Number:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.licenseNumber || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Hospital:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.hospital || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Department:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.department || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Started Working:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.startedWorking
                          ? new Date(
                              selectedUser.startedWorking
                            ).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Login:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.lastLogin
                          ? new Date(selectedUser.lastLogin).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {selectedUser.address && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Street:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.address.street || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          City:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.address.city || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          State:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.address.state || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          ZIP Code:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.address.zipCode || "Not provided"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">
                          Country:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.address.country || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedUser.documents && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                      Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          ID Document:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.documents.idDocument || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          License Document:
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedUser.documents.licenseDocument ||
                            "Not provided"}
                        </p>
                      </div>
                      {selectedUser.documents.otherDocuments &&
                        selectedUser.documents.otherDocuments.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">
                              Other Documents:
                            </label>
                            <div className="mt-1 space-y-1">
                              {selectedUser.documents.otherDocuments.map(
                                (doc: any, index: number) => (
                                  <div
                                    key={index}
                                    className="text-sm text-gray-900 bg-gray-50 p-2 rounded"
                                  >
                                    {doc.name} - {doc.url}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Assigned Patients */}
                {selectedUser.assignedPatients &&
                  selectedUser.assignedPatients.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                        Assigned Patients (
                        {selectedUser.assignedPatients.length})
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="space-y-2">
                          {selectedUser.assignedPatients.map(
                            (patient: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white p-2 rounded border"
                              >
                                <span className="text-sm text-gray-700">
                                  {patient.firstName} {patient.lastName} (
                                  {patient.patientId})
                                </span>
                                <span className="text-xs text-gray-500">
                                  {patient.status || "Active"}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Account Information */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Account Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Created:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.createdAt
                          ? new Date(selectedUser.createdAt).toLocaleString()
                          : "Not available"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Last Updated:
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.updatedAt
                          ? new Date(selectedUser.updatedAt).toLocaleString()
                          : "Not available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    handleUserAction("edit", selectedUser);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit User - {editingUser.fullName}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Basic Information
                    </h4>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) =>
                          handleEditFormChange("firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) =>
                          handleEditFormChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          handleEditFormChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) =>
                          handleEditFormChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={editFormData.role}
                        onChange={(e) =>
                          handleEditFormChange("role", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select a role</option>
                        <option value="admin">Admin</option>
                        <option value="senior_doctor">Senior Doctor</option>
                        <option value="consulting_doctor">
                          Consulting Doctor
                        </option>
                        <option value="front-desk-coordinator">
                          Front Desk Coordinator
                        </option>
                        <option value="jr-doctor">Junior Doctor</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            checked={editFormData.isActive === true}
                            onChange={() =>
                              handleEditFormChange("isActive", true)
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Active
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            checked={editFormData.isActive === false}
                            onChange={() =>
                              handleEditFormChange("isActive", false)
                            }
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Inactive
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Professional Information
                    </h4>

                    {/* Specialization */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={editFormData.specialization}
                        onChange={(e) =>
                          handleEditFormChange("specialization", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Cardiology, Neurology"
                      />
                    </div>

                    {/* License Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.licenseNumber}
                        onChange={(e) =>
                          handleEditFormChange("licenseNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter license number"
                      />
                    </div>

                    {/* Started Working */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Started Working
                      </label>
                      <input
                        type="date"
                        value={editFormData.startedWorking}
                        onChange={(e) =>
                          handleEditFormChange("startedWorking", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    {/* Last Login */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Login
                      </label>
                      <input
                        type="datetime-local"
                        value={editFormData.lastLogin}
                        onChange={(e) =>
                          handleEditFormChange("lastLogin", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={editFormData.address.street}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "address",
                            "street",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editFormData.address.city}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "address",
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editFormData.address.state}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "address",
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={editFormData.address.zipCode}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "address",
                            "zipCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editFormData.address.country}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "address",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Document
                      </label>
                      <input
                        type="text"
                        value={editFormData.documents.idDocument}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "documents",
                            "idDocument",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="ID document reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Document
                      </label>
                      <input
                        type="text"
                        value={editFormData.documents.licenseDocument}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "documents",
                            "licenseDocument",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="License document reference"
                      />
                    </div>
                  </div>
                </div>

                {/* Assigned Patients */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Assigned Patients ({editFormData.assignedPatients.length})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {editFormData.assignedPatients.length > 0 ? (
                      <div className="space-y-2">
                        {editFormData.assignedPatients.map(
                          (patient: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-2 rounded border"
                            >
                              <span className="text-sm text-gray-700">
                                {patient.firstName} {patient.lastName} (
                                {patient.patientId})
                              </span>
                              <span className="text-xs text-gray-500">
                                {patient.status || "Active"}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No patients assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New User
                </h3>
                <button
                  onClick={handleCancelCreate}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Basic Information
                    </h4>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.firstName}
                        onChange={(e) =>
                          handleCreateFormChange("firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.lastName}
                        onChange={(e) =>
                          handleCreateFormChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter last name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={createFormData.email}
                        onChange={(e) =>
                          handleCreateFormChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter email address"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={createFormData.password}
                        onChange={(e) =>
                          handleCreateFormChange("password", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter password"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={createFormData.phone}
                        onChange={(e) =>
                          handleCreateFormChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={createFormData.role}
                        onChange={(e) =>
                          handleCreateFormChange("role", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select a role</option>
                        <option value="admin">Admin</option>
                        <option value="senior_doctor">Senior Doctor</option>
                        <option value="consulting_doctor">
                          Consulting Doctor
                        </option>
                        <option value="front-desk-coordinator">
                          Front Desk Coordinator
                        </option>
                        <option value="jr-doctor">Junior Doctor</option>
                      </select>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Professional Information
                    </h4>

                    {/* Specialization */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={createFormData.specialization}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "specialization",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Cardiology, Neurology"
                      />
                    </div>

                    {/* License Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={createFormData.licenseNumber}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "licenseNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter license number"
                      />
                    </div>

                    {/* Hospital */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hospital
                      </label>
                      <input
                        type="text"
                        value={createFormData.hospital}
                        onChange={(e) =>
                          handleCreateFormChange("hospital", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter hospital name"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={createFormData.department}
                        onChange={(e) =>
                          handleCreateFormChange("department", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter department name"
                      />
                    </div>

                    {/* Started Working */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Started Working
                      </label>
                      <input
                        type="date"
                        value={createFormData.startedWorking}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "startedWorking",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={createFormData.address.street}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "address",
                            "street",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={createFormData.address.city}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "address",
                            "city",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={createFormData.address.state}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "address",
                            "state",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={createFormData.address.zipCode}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "address",
                            "zipCode",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={createFormData.address.country}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "address",
                            "country",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                    Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Document
                      </label>
                      <input
                        type="text"
                        value={createFormData.documents.idDocument}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "documents",
                            "idDocument",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="ID document reference"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Document
                      </label>
                      <input
                        type="text"
                        value={createFormData.documents.licenseDocument}
                        onChange={(e) =>
                          handleCreateNestedFormChange(
                            "documents",
                            "licenseDocument",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="License document reference"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                <button
                  onClick={handleCancelCreate}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
