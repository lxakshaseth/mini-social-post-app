const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.AI_SERVICE_MODEL || "llama-3.1-8b-instant";

function getApiKey() {
  return process.env.AI_SERVICE_API_KEY || process.env.GROQ_API_KEY || "";
}

async function requestGroqChat({
  messages,
  temperature = 0.4,
  maxTokens = 700,
  jsonMode = false,
}) {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("AI service API key is missing.");
  }

  const payload = {
    model: DEFAULT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || "Groq request failed unexpectedly.";
    throw new Error(message);
  }

  return data?.choices?.[0]?.message?.content || "";
}

module.exports = {
  requestGroqChat,
};

