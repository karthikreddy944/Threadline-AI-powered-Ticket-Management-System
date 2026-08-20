/**
 * Thin wrapper around the Gemini API. This is the ONLY file that
 * knows which LLM provider is in use — codeAnalyzer.js just calls
 * generateAnalysis() and gets back raw text. Swapping providers later
 * means changing this file only.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { DEFAULT_MODEL } = require("../../config/aiPolicy");

class LlmServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "LlmServiceError";
    // "missing_api_key" | "provider_unavailable" | "timeout" | "rate_limit" | "invalid_response"
    this.code = code;
  }
}

const REQUEST_TIMEOUT_MS = 30000;

let cachedClient = null;
function getClient() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new LlmServiceError("LLM_API_KEY is not configured on the server.", "missing_api_key");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

/**
 * Sends system instructions + a user prompt to Gemini and returns the
 * raw text response (expected to be a JSON string, per the prompt).
 * Throws LlmServiceError on any provider-side failure.
 */
async function generateAnalysis({ systemInstructions, userPrompt }) {
  const genAI = getClient();
  const modelName = process.env.LLM_MODEL || DEFAULT_MODEL;

  const model = genAI.getGenerativeModel(
    {
      model: modelName,
      systemInstruction: systemInstructions,
      generationConfig: {
        responseMimeType: "application/json",
      },
    },
    { timeout: REQUEST_TIMEOUT_MS }
  );

  let result;
  try {
    result = await model.generateContent(userPrompt);
  } catch (error) {
    throw translateProviderError(error);
  }

  const text = result?.response?.text?.();
  if (!text) {
    throw new LlmServiceError("The AI provider returned an empty response.", "invalid_response");
  }
  return text;
}

function translateProviderError(error) {
  const status = error?.status || error?.response?.status;
  const message = String(error?.message || "");

  if (status === 429 || /rate.?limit|quota/i.test(message)) {
    return new LlmServiceError("The AI provider rate limit was reached. Try again shortly.", "rate_limit");
  }
  if (status === 401 || status === 403 || /api key|permission|unauthorized/i.test(message)) {
    return new LlmServiceError("The AI provider rejected the configured API key.", "missing_api_key");
  }
  if (/timeout|timed out|deadline/i.test(message)) {
    return new LlmServiceError("The AI provider timed out.", "timeout");
  }

  return new LlmServiceError(
    `The AI provider is currently unavailable (${message || "unknown error"}).`,
    "provider_unavailable"
  );
}

module.exports = { generateAnalysis, LlmServiceError };
