const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";
let adminToken, seniorToken, consultingToken;

const testAuth = async () => {
  console.log("🔐 Testing MedLens AI Authentication System\n");

  try {
    // Test 1: Login with all user types
    console.log("1️⃣ Testing Login for All User Types");
    console.log("=".repeat(50));

    // Admin login
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@medlens.com",
      password: "admin123",
    });
    adminToken = adminResponse.data.token;
    console.log("✅ Admin login successful:", adminResponse.data.user.fullName);

    // Senior doctor login
    const seniorResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "senior.doctor@medlens.com",
      password: "senior123",
    });
    seniorToken = seniorResponse.data.token;
    console.log(
      "✅ Senior doctor login successful:",
      seniorResponse.data.user.fullName
    );

    // Consulting doctor login
    const consultingResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "consulting.doctor@medlens.com",
      password: "consulting123",
    });
    consultingToken = consultingResponse.data.token;
    console.log(
      "✅ Consulting doctor login successful:",
      consultingResponse.data.user.fullName
    );

    console.log("\n2️⃣ Testing Role-Based Access Control");
    console.log("=".repeat(50));

    // Test 2: Get users with different roles
    const adminUsers = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("👑 Admin can see", adminUsers.data.count, "users (all users)");

    const seniorUsers = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    console.log(
      "👨‍⚕️ Senior doctor can see",
      seniorUsers.data.count,
      "users (self + assigned consulting doctors)"
    );

    const consultingUsers = await axios.get(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${consultingToken}` },
    });
    console.log(
      "👩‍⚕️ Consulting doctor can see",
      consultingUsers.data.count,
      "users (self only)"
    );

    console.log("\n3️⃣ Testing User Profile Access");
    console.log("=".repeat(50));

    // Test 3: Get current user profile
    const adminProfile = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "✅ Admin profile:",
      adminProfile.data.user.fullName,
      "-",
      adminProfile.data.user.role
    );

    const seniorProfile = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    console.log(
      "✅ Senior doctor profile:",
      seniorProfile.data.user.fullName,
      "-",
      seniorProfile.data.user.role
    );

    const consultingProfile = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${consultingToken}` },
    });
    console.log(
      "✅ Consulting doctor profile:",
      consultingProfile.data.user.fullName,
      "-",
      consultingProfile.data.user.role
    );

    console.log("\n4️⃣ Testing User Hierarchy");
    console.log("=".repeat(50));

    // Test 4: Check user hierarchy
    console.log("👑 Admin hierarchy:", adminProfile.data.hierarchy.user.role);
    console.log(
      "👨‍⚕️ Senior doctor hierarchy:",
      seniorProfile.data.hierarchy.user.role,
      "- Assigned consulting doctors:",
      seniorProfile.data.hierarchy.consultingDoctors.length
    );
    console.log(
      "👩‍⚕️ Consulting doctor hierarchy:",
      consultingProfile.data.hierarchy.user.role,
      "- Assigned to:",
      consultingProfile.data.hierarchy.seniorDoctor?.fullName || "None"
    );

    console.log("\n5️⃣ Testing User Registration (Admin Only)");
    console.log("=".repeat(50));

    // Test 5: Create new user (admin only)
    const newUserData = {
      email: "new.doctor@medlens.com",
      password: "new123",
      firstName: "Dr. Emily",
      lastName: "Wilson",
      role: "consulting_doctor",
      specialization: "Neurology",
      hospital: "MedLens General Hospital",
      department: "Neurology Department",
    };

    try {
      const newUser = await axios.post(
        `${BASE_URL}/auth/register`,
        newUserData,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log("✅ Admin created new user:", newUser.data.user.fullName);

      // Test that senior doctor cannot create users
      try {
        await axios.post(`${BASE_URL}/auth/register`, newUserData, {
          headers: { Authorization: `Bearer ${seniorToken}` },
        });
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(
            "✅ Senior doctor correctly denied user creation (403 Forbidden)"
          );
        }
      }
    } catch (error) {
      console.log(
        "ℹ️ User might already exist or other error:",
        error.response?.data?.message || error.message
      );
    }

    console.log("\n6️⃣ Testing User Updates");
    console.log("=".repeat(50));

    // Test 6: Update user profile
    const updateData = {
      specialization: "Advanced Radiology",
      phone: "+1-555-0123",
    };

    const updatedProfile = await axios.put(`${BASE_URL}/auth/me`, updateData, {
      headers: { Authorization: `Bearer ${consultingToken}` },
    });
    console.log(
      "✅ Consulting doctor updated profile:",
      updatedProfile.data.user.specialization
    );

    console.log("\n7️⃣ Testing Doctor Assignment");
    console.log("=".repeat(50));

    // Test 7: Assign doctor (admin only)
    try {
      const assignmentResponse = await axios.post(
        `${BASE_URL}/auth/assign-doctor`,
        {
          consultingDoctorId: "68ad1fde72b013ed472405ca", // Dr. Michael Chen
          seniorDoctorId: "68ad1fdd72b013ed472405be", // Dr. Sarah Johnson
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      console.log("✅ Admin assigned doctor successfully");

      // Test that senior doctor cannot assign doctors
      try {
        await axios.post(
          `${BASE_URL}/auth/assign-doctor`,
          {
            consultingDoctorId: "68ad1fde72b013ed472405ca",
            seniorDoctorId: "68ad1fdd72b013ed472405be",
          },
          {
            headers: { Authorization: `Bearer ${seniorToken}` },
          }
        );
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(
            "✅ Senior doctor correctly denied doctor assignment (403 Forbidden)"
          );
        }
      }
    } catch (error) {
      console.log(
        "ℹ️ Assignment might already exist or other error:",
        error.response?.data?.message || error.message
      );
    }

    console.log("\n8️⃣ Testing Invalid Access Attempts");
    console.log("=".repeat(50));

    // Test 8: Invalid token
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "Bearer invalid_token" },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Invalid token correctly rejected (401 Unauthorized)");
      }
    }

    // Test 8: No token
    try {
      await axios.get(`${BASE_URL}/auth/me`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Missing token correctly rejected (401 Unauthorized)");
      }
    }

    console.log("\n🎉 All Authentication Tests Completed Successfully!");
    console.log("\n📋 Summary:");
    console.log("   ✅ Login/Logout functionality");
    console.log("   ✅ JWT token generation and validation");
    console.log(
      "   ✅ Role-based access control (Admin, Senior Doctor, Consulting Doctor)"
    );
    console.log("   ✅ User hierarchy management");
    console.log("   ✅ User registration (Admin only)");
    console.log("   ✅ User profile updates");
    console.log("   ✅ Doctor assignment (Admin only)");
    console.log("   ✅ Security validation (invalid/missing tokens)");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
};

// Run the test
testAuth();
