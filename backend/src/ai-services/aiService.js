const { InferenceClient } = require("@huggingface/inference");
require("dotenv").config();

class AIService {
  constructor() {
    const rawToken = process.env.HUGGING_FACE_API_KEY || "";
    // Sanitize token: remove leading 'Bearer ' if present and strip wrapping quotes
    const sanitizedToken = rawToken
      .trim()
      .replace(/^Bearer\s+/i, "")
      .replace(/^"([\s\S]*)"$/u, "$1")
      .replace(/^'([\s\S]*)'$/u, "$1");

    this.token = sanitizedToken;
    this.client = new InferenceClient(this.token);
  }

  async analyzeDocument(fileBuffer, fileName, patientId, uploadedBy) {
    try {
      console.log("🤖 Starting AI analysis with Hugging Face model");

      // Try to use the real Hugging Face model first
      try {
        const chatCompletion = await this.client.chatCompletion({
          model: "Qwen/Qwen2.5-VL-7B-Instruct",
          messages: [
            {
              role: "user",
              content: this.createAnalysisPrompt(fileName, fileBuffer),
            },
          ],
        });

        const aiResponse = chatCompletion.choices[0].message.content;

        console.log("✅ Real AI analysis completed successfully");

        return {
          success: true,
          data: {
            confidence: 0.85,
            summary: aiResponse,
            keyFindings: this.extractKeyFindings(aiResponse),
            recommendations: this.extractRecommendations(aiResponse),
            models: {
              huggingface: {
                model: "Qwen/Qwen2.5-VL-7B-Instruct",
                response: aiResponse,
                rawResponse: aiResponse,
              },
            },
            processingTime: Date.now(),
          },
        };
      } catch (hfError) {
        console.log("❌ Hugging Face API failed:", hfError.message);

        // Return error instead of mock analysis
        return {
          success: false,
          error: hfError.message,
        };
      }
    } catch (error) {
      console.error("❌ AI analysis failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  formatAIResponse(response) {
    // Clean up the response and format it properly
    let formatted = response
      // Remove HTML tags first
      .replace(/<[^>]*>/g, "")
      // Remove markdown code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove horizontal rules
      .replace(/^---$/gm, "")
      // Remove extra asterisks
      .replace(/\*+/g, "")
      .trim();

    // First, split the content by headers to create proper sections
    const sections = formatted.split(/(###\s+\d+\.\s+[^:]+:)/);

    if (sections.length > 1) {
      // Process each section
      const processedSections = [];

      for (let i = 0; i < sections.length; i++) {
        let section = sections[i].trim();

        if (!section) continue;

        // Check if this is a header
        if (section.match(/^###\s+\d+\.\s+/)) {
          // Format header
          section = section.replace(/^###\s+/, "");
          section = `\n\n${section.toUpperCase()}\n`;
          processedSections.push(section);
        } else {
          // Process content section
          const lines = section.split("\n");
          const processedLines = [];

          for (const line of lines) {
            let processedLine = line.trim();

            if (!processedLine) {
              processedLines.push("");
              continue;
            }

            // Format bullet points
            if (processedLine.match(/^•\s+/)) {
              processedLine = `  ${processedLine}`;
            } else if (processedLine.match(/^[-*]\s+/)) {
              processedLine = processedLine.replace(/^[-*]\s+/, "• ");
              processedLine = `  ${processedLine}`;
            }

            processedLines.push(processedLine);
          }

          // Join lines and add proper spacing
          let processedSection = processedLines.join("\n");

          // Add spacing after bullet points
          processedSection = processedSection.replace(
            /\n  • ([^\n]+)\n([^•\n])/g,
            "\n  • $1\n\n$2"
          );

          processedSections.push(processedSection);
        }
      }

      formatted = processedSections.join("");
    } else {
      // Fallback: process as single text block
      const lines = formatted.split("\n");
      const processedLines = [];

      for (const line of lines) {
        let processedLine = line.trim();

        if (!processedLine) {
          processedLines.push("");
          continue;
        }

        // Format headers
        if (processedLine.match(/^#{1,3}\s+/)) {
          processedLine = processedLine.replace(/^#{1,3}\s+/, "");
          processedLine = `\n\n${processedLine.toUpperCase()}\n`;
        }

        // Format bullet points
        if (processedLine.match(/^•\s+/)) {
          processedLine = `  ${processedLine}`;
        } else if (processedLine.match(/^[-*]\s+/)) {
          processedLine = processedLine.replace(/^[-*]\s+/, "• ");
          processedLine = `  ${processedLine}`;
        }

        processedLines.push(processedLine);
      }

      formatted = processedLines.join("\n");
    }

    // Final cleanup
    formatted = formatted
      // Clean up multiple newlines
      .replace(/\n{4,}/g, "\n\n\n")
      // Clean up multiple spaces
      .replace(/\s{2,}/g, " ")
      // Clean up final formatting
      .trim();

    return formatted;
  }

  createAnalysisPrompt(fileName, fileBuffer) {
    const fileSize = fileBuffer.length;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    let prompt = `Analyze this medical document: ${fileName} (${fileSize} bytes, ${fileExtension} format). `;
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
}

module.exports = AIService;
