const axios = require("axios");
const FormData = require("form-data");

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || "http://localhost:5002";
    this.apiKey = process.env.AI_SERVICE_API_KEY;
  }

  async analyzeDocument(fileBuffer, fileName, patientId, uploadedBy) {
    try {
      console.log("🤖 Sending document to AI service for analysis:", fileName);

      // Convert buffer to base64 for easier transmission
      const base64Content = fileBuffer.toString("base64");
      const contentType = this.getContentType(fileName);

      const requestData = {
        fileName: fileName,
        fileType: contentType,
        fileSize: fileBuffer.length,
        content: base64Content,
        patientId: patientId,
        uploadedBy: uploadedBy,
      };

      const response = await axios.post(
        `${this.baseURL}/api/analysis/analyze-base64`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          timeout: 60000, // 60 second timeout for AI processing
        }
      );

      console.log("✅ AI analysis completed successfully");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("❌ AI analysis failed:", error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  getContentType(fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    const contentTypes = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };
    return contentTypes[ext] || "application/octet-stream";
  }

  async analyzeText(text, patientId, uploadedBy) {
    try {
      console.log("🤖 Sending text to AI service for analysis");

      const response = await axios.post(
        `${this.baseURL}/api/analysis/analyze-text`,
        {
          text,
          patientId,
          uploadedBy,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        }
      );

      console.log("✅ AI text analysis completed successfully");
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("❌ AI text analysis failed:", error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/analysis/models`, {
        timeout: 5000,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new AIService();
