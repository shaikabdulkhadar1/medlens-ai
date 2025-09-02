const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";

const testFrontDeskCoordinatorAPI = async () => {
  console.log("🧪 Testing Front Desk Coordinator API Endpoints\n");

  try {
    // 1. Login as Front Desk Coordinator
    console.log("1️⃣ Logging in as Front Desk Coordinator...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "jr.doctor@medlens.com",
      password: "jr123456",
    });

    if (!loginResponse.data.success) {
      throw new Error("Login failed");
    }

    const authToken = loginResponse.data.token;
    const user = loginResponse.data.user;

    console.log("✅ Login successful!");
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}\n`);

    // 2. Get available senior doctors
    console.log("2️⃣ Getting available senior doctors...");
    const seniorDoctorsResponse = await axios.get(
      `${BASE_URL}/front-desk-coordinator/senior-doctors`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (seniorDoctorsResponse.data.success) {
      const doctors = seniorDoctorsResponse.data.data || [];
      console.log("✅ Senior doctors retrieved successfully!");
      console.log(`   Found ${doctors.length} senior doctors`);
      doctors.forEach((doctor, index) => {
        console.log(
          `   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} - ${
            doctor.specialization
          }`
        );
      });
    } else {
      console.log("❌ Failed to get senior doctors");
    }
    console.log("");

    // 3. Get current patients
    console.log("3️⃣ Getting current patients...");
    const patientsResponse = await axios.get(
      `${BASE_URL}/front-desk-coordinator/patients`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (patientsResponse.data.success) {
      const patients = patientsResponse.data.data || [];
      console.log("✅ Patients retrieved successfully!");
      console.log(`   Found ${patients.length} patients`);
      patients.slice(0, 5).forEach((patient, index) => {
        console.log(
          `   ${index + 1}. ${patient.firstName} ${patient.lastName} (${
            patient.patientId
          })`
        );
        if (patient.frontDeskNotes?.initialDiagnosis) {
          console.log(
            `      Diagnosis: ${patient.frontDeskNotes.initialDiagnosis}`
          );
        }
        if (
          patient.frontDeskNotes?.symptoms &&
          patient.frontDeskNotes.symptoms.length > 0
        ) {
          console.log(
            `      Symptoms: ${patient.frontDeskNotes.symptoms.join(", ")}`
          );
        }
      });
    } else {
      console.log("❌ Failed to get patients");
    }
    console.log("");

    // 4. Create a test patient
    console.log("4️⃣ Creating a test patient...");
    const createPatientResponse = await axios.post(
      `${BASE_URL}/front-desk-coordinator/patients`,
      {
        firstName: "Jane",
        lastName: "Smith",
        dateOfBirth: "1985-05-15",
        gender: "female",
        contactInfo: {
          phone: "555-0124",
          email: "jane.smith@example.com",
        },
        initialDiagnosis: "Patient presents with headache and fatigue",
        symptoms: ["headache", "fatigue", "dizziness"],
        observations: "Patient appears tired, vital signs normal",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (createPatientResponse.data.success) {
      const patient = createPatientResponse.data.data;
      console.log("✅ Patient created successfully!");
      console.log(`   Patient ID: ${patient.patientId}`);
      console.log(`   Name: ${patient.name}`);
      console.log(`   Status: ${patient.status}`);
    } else {
      console.log("❌ Failed to create patient");
    }
    console.log("");

    // 5. Get patients after creation
    console.log("5️⃣ Getting patients after creation...");
    const updatedPatientsResponse = await axios.get(
      `${BASE_URL}/front-desk-coordinator/patients`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (updatedPatientsResponse.data.success) {
      const patients = updatedPatientsResponse.data.data || [];
      console.log("✅ Patients retrieved successfully!");
      console.log(`   Found ${patients.length} patients`);
      patients.slice(0, 6).forEach((patient, index) => {
        console.log(
          `   ${index + 1}. ${patient.firstName} ${patient.lastName} (${
            patient.patientId
          })`
        );
        if (patient.frontDeskNotes?.initialDiagnosis) {
          console.log(
            `      Diagnosis: ${patient.frontDeskNotes.initialDiagnosis}`
          );
        }
        if (
          patient.frontDeskNotes?.symptoms &&
          patient.frontDeskNotes.symptoms.length > 0
        ) {
          console.log(
            `      Symptoms: ${patient.frontDeskNotes.symptoms.join(", ")}`
          );
        }
      });
    } else {
      console.log("❌ Failed to get patients");
    }

    console.log("\n🎉 Front Desk Coordinator API Testing Complete!");
  } catch (error) {
    console.error(
      "❌ Error during testing:",
      error.response?.data || error.message
    );
  }
};

// Run the test
testFrontDeskCoordinatorAPI();
