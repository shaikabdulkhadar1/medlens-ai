const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";
let authToken = "";

const testJuniorDoctorAPI = async () => {
  try {
    console.log("🧪 Testing Junior Doctor API Endpoints\n");

    // Step 1: Login as Junior Doctor
    console.log("1️⃣ Logging in as Junior Doctor...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "jr.doctor@medlens.com",
      password: "jr123456",
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.token;
      console.log("✅ Login successful!");
      console.log(
        `   User: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`
      );
      console.log(`   Role: ${loginResponse.data.user.role}`);
    } else {
      console.log("❌ Login failed:", loginResponse.data.message);
      return;
    }

    // Step 2: Get Available Senior Doctors
    console.log("\n2️⃣ Getting available senior doctors...");
    try {
      const seniorDoctorsResponse = await axios.get(
        `${BASE_URL}/junior-doctor/senior-doctors`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (seniorDoctorsResponse.data.success) {
        console.log("✅ Senior doctors retrieved successfully!");
        console.log(
          `   Found ${seniorDoctorsResponse.data.count} senior doctors`
        );
        seniorDoctorsResponse.data.data.forEach((doctor, index) => {
          console.log(
            `   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} - ${
              doctor.specialization
            }`
          );
        });
      } else {
        console.log(
          "❌ Failed to get senior doctors:",
          seniorDoctorsResponse.data.message
        );
      }
    } catch (error) {
      console.log(
        "❌ Error getting senior doctors:",
        error.response?.data?.message || error.message
      );
    }

    // Step 3: Get Current Patients (should be empty initially)
    console.log("\n3️⃣ Getting current patients...");
    try {
      const patientsResponse = await axios.get(
        `${BASE_URL}/junior-doctor/patients`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (patientsResponse.data.success) {
        console.log("✅ Patients retrieved successfully!");
        console.log(`   Found ${patientsResponse.data.count} patients`);
        if (patientsResponse.data.data.length > 0) {
          patientsResponse.data.data.forEach((patient, index) => {
            console.log(
              `   ${index + 1}. ${patient.firstName} ${patient.lastName} (${
                patient.patientId
              })`
            );
          });
        } else {
          console.log("   No patients found (expected for new junior doctor)");
        }
      } else {
        console.log(
          "❌ Failed to get patients:",
          patientsResponse.data.message
        );
      }
    } catch (error) {
      console.log(
        "❌ Error getting patients:",
        error.response?.data?.message || error.message
      );
    }

    // Step 4: Create a Test Patient
    console.log("\n4️⃣ Creating a test patient...");
    try {
      const createPatientResponse = await axios.post(
        `${BASE_URL}/junior-doctor/patients`,
        {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1990-01-01",
          gender: "male",
          contactInfo: {
            phone: "555-0123",
            email: "john.doe@example.com",
          },
          initialDiagnosis: "Patient presents with mild chest discomfort",
          symptoms: ["chest discomfort", "shortness of breath"],
          observations: "Patient appears anxious, vital signs normal",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (createPatientResponse.data.success) {
        console.log("✅ Patient created successfully!");
        console.log(
          `   Patient ID: ${createPatientResponse.data.data.patientId}`
        );
        console.log(`   Name: ${createPatientResponse.data.data.name}`);
        console.log(`   Status: ${createPatientResponse.data.data.status}`);
      } else {
        console.log(
          "❌ Failed to create patient:",
          createPatientResponse.data.message
        );
      }
    } catch (error) {
      console.log(
        "❌ Error creating patient:",
        error.response?.data?.message || error.message
      );
    }

    // Step 5: Get Patients Again (should now have 1 patient)
    console.log("\n5️⃣ Getting patients after creation...");
    try {
      const patientsResponse2 = await axios.get(
        `${BASE_URL}/junior-doctor/patients`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (patientsResponse2.data.success) {
        console.log("✅ Patients retrieved successfully!");
        console.log(`   Found ${patientsResponse2.data.count} patients`);
        patientsResponse2.data.data.forEach((patient, index) => {
          console.log(
            `   ${index + 1}. ${patient.firstName} ${patient.lastName} (${
              patient.patientId
            })`
          );
          if (patient.juniorDoctorNotes) {
            console.log(
              `      Diagnosis: ${patient.juniorDoctorNotes.initialDiagnosis}`
            );
            console.log(
              `      Symptoms: ${patient.juniorDoctorNotes.symptoms.join(", ")}`
            );
          }
        });
      } else {
        console.log(
          "❌ Failed to get patients:",
          patientsResponse2.data.message
        );
      }
    } catch (error) {
      console.log(
        "❌ Error getting patients:",
        error.response?.data?.message || error.message
      );
    }

    console.log("\n🎉 Junior Doctor API Testing Complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
};

// Run the test
testJuniorDoctorAPI();
