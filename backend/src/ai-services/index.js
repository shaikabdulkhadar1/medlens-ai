import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, "../../.env") });

const toekn = process.env.HUGGING_FACE_API_KEY;
const client = new InferenceClient(toekn);

const chatCompletion = await client.chatCompletion({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "user",
      content: "How many 'G's in 'huggingface'?",
    },
  ],
});

console.log(chatCompletion.choices[0].message.content);
