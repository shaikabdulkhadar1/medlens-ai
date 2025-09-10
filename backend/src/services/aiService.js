const axios = require("axios");
const FormData = require("form-data");
const { InferenceClient } = require("@huggingface/inference");

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || "http://localhost:5002";
    this.apiKey = process.env.HUGGING_FACE_API_KEY;

    // Initialize Hugging Face client
    if (this.apiKey) {
      try {
        this.hfClient = new InferenceClient({ accessToken: this.apiKey });
        this.modelName =
          process.env.HF_MODEL_NAME || "microsoft/DialoGPT-medium";
        console.log(
          "✅ Hugging Face client initialized with model:",
          this.modelName
        );
      } catch (error) {
        console.error(
          "❌ Failed to initialize Hugging Face client:",
          error.message
        );
        this.hfClient = null;
      }
    } else {
      console.warn(
        "⚠️ No Hugging Face API key found, will use external service or mock"
      );
      this.hfClient = null;
    }
  }

  async analyzeDocument(fileBuffer, fileName, patientId, uploadedBy) {
    try {
      console.log("🤖 Sending document to AI service for analysis:", fileName);
      console.log("🔍 AI Service Config:", {
        baseURL: this.baseURL,
        hasApiKey: !!this.apiKey,
        hasHfClient: !!this.hfClient,
        modelName: this.modelName,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      });

      // Try Hugging Face first if available
      if (this.hfClient) {
        console.log("🔄 Using Hugging Face for analysis...");
        return await this.analyzeWithHuggingFace(
          fileBuffer,
          fileName,
          patientId,
          uploadedBy
        );
      }

      // Fallback to external service
      console.log("🔄 Using external AI service...");
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
      console.error("❌ Full error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        },
      });

      // If connection refused, provide mock analysis
      if (error.code === "ECONNREFUSED") {
        console.log(
          "🔄 External AI service not available, providing mock analysis..."
        );
        return {
          success: true,
          data: {
            confidence: 0.75,
            summary: `Mock analysis for ${fileName}: This appears to be a medical document. Based on the file type (${this.getContentType(
              fileName
            )}), this could be a medical image, lab report, or consultation note. Please review the document manually for accurate analysis.`,
            keyFindings: [
              `Document type: ${this.getContentType(fileName)}`,
              "File size: " + (fileBuffer.length / 1024).toFixed(1) + " KB",
              "Analysis method: Mock (external AI service unavailable)",
            ],
            recommendations: [
              "Review document manually for accurate analysis",
              "Consider setting up external AI service for automated analysis",
              "Verify document content and quality",
            ],
            models: {
              mock: {
                model: "mock-analysis",
                response:
                  "Mock analysis provided due to external service unavailability",
                rawResponse: "External AI service not available",
              },
            },
            processingTime: Date.now(),
          },
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async analyzeWithHuggingFace(fileBuffer, fileName, patientId, uploadedBy) {
    try {
      console.log("🤖 Starting Hugging Face analysis...");

      // Create analysis prompt
      const prompt = this.createAnalysisPrompt(fileName, fileBuffer);

      // Use text generation for analysis
      const response = await this.hfClient.textGeneration({
        model: this.modelName,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      const aiResponse = response.generated_text;
      console.log("✅ Hugging Face analysis completed successfully");

      return {
        success: true,
        data: {
          confidence: 0.85,
          summary: aiResponse,
          keyFindings: this.extractKeyFindings(aiResponse),
          recommendations: this.extractRecommendations(aiResponse),
          models: {
            huggingface: {
              model: this.modelName,
              response: aiResponse,
              rawResponse: aiResponse,
            },
          },
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      console.error("❌ Hugging Face analysis failed:", error.message);
      throw error; // Re-throw to be handled by the main error handler
    }
  }

  createAnalysisPrompt(fileName, fileBuffer) {
    const fileSize = fileBuffer.length;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    const contentType = this.getContentType(fileName);

    let prompt = `Analyze this medical document: ${fileName} (${fileSize} bytes, ${fileExtension} format, ${contentType}). `;
    prompt += `Please provide a comprehensive medical analysis including: `;
    prompt += `1. Document type and purpose, `;
    prompt += `2. Key medical findings or observations, `;
    prompt += `3. Potential diagnoses or conditions mentioned, `;
    prompt += `4. Recommendations for further action, `;
    prompt += `5. Any urgent medical concerns that need attention. `;
    prompt += `Format your response in a clear, structured manner suitable for medical professionals.`;

    return prompt;
  }

  extractKeyFindings(aiResponse) {
    const lines = aiResponse.split("\n");
    const findings = lines.filter(
      (line) =>
        line.toLowerCase().includes("finding") ||
        line.toLowerCase().includes("diagnosis") ||
        line.toLowerCase().includes("condition") ||
        line.toLowerCase().includes("observation")
    );
    return findings.length > 0 ? findings : ["Analysis completed successfully"];
  }

  extractRecommendations(aiResponse) {
    const lines = aiResponse.split("\n");
    const recommendations = lines.filter(
      (line) =>
        line.toLowerCase().includes("recommend") ||
        line.toLowerCase().includes("suggest") ||
        line.toLowerCase().includes("action") ||
        line.toLowerCase().includes("follow-up")
    );
    return recommendations.length > 0
      ? recommendations
      : ["Review analysis results"];
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
