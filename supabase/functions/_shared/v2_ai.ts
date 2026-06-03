import { HttpError } from "./v2_http.ts";
import { optionalEnv } from "./v2_supabase.ts";
import { normalizeWhitespace, sha256Hex } from "./v2_text.ts";

export interface EmbeddingResult {
  provider: "openai";
  model: string;
  embedding: number[];
  usage: Record<string, unknown>;
}

export interface LlmClassificationResult {
  provider: "openai" | "gemini";
  model: string;
  prompt_version: string;
  input_hash: string;
  output_json: Record<string, unknown>;
  usage_json: Record<string, unknown>;
  latency_ms: number;
}

export function confidenceLevel(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.8) {
    return "high";
  }
  if (confidence >= 0.55) {
    return "medium";
  }
  return "low";
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const apiKey = optionalEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new HttpError(424, "missing_openai_key", "OPENAI_API_KEY is required for embeddings.");
  }
  const model = optionalEnv("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
  const input = normalizeWhitespace(text).slice(0, 24000);

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, input }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new HttpError(502, "openai_embedding_error", "OpenAI embedding request failed.", body);
  }

  const embedding = body?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new HttpError(502, "invalid_embedding_response", "OpenAI did not return an embedding.");
  }

  return {
    provider: "openai",
    model,
    embedding,
    usage: (body.usage ?? {}) as Record<string, unknown>,
  };
}

function extractJsonObject(text: string): Record<string, unknown> {
  const clean = text.trim();
  try {
    return JSON.parse(clean) as Record<string, unknown>;
  } catch (_error) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as Record<string, unknown>;
    }
    throw new HttpError(502, "invalid_llm_json", "LLM response was not valid JSON.");
  }
}

async function classifyWithOpenAI(
  prompt: string,
): Promise<Omit<LlmClassificationResult, "input_hash">> {
  const apiKey = optionalEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new HttpError(424, "missing_openai_key", "OPENAI_API_KEY is not configured.");
  }
  const model = optionalEnv("OPENAI_CLASSIFIER_MODEL") ?? "gpt-4.1-mini";
  const started = performance.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You classify YouTube videos against an academic catalog. Return compact valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new HttpError(502, "openai_classification_error", "OpenAI classification failed.", body);
  }
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new HttpError(502, "invalid_openai_response", "OpenAI response did not include content.");
  }
  return {
    provider: "openai",
    model,
    prompt_version: "facodi_v2_classification_2026_06_03",
    output_json: extractJsonObject(content),
    usage_json: (body.usage ?? {}) as Record<string, unknown>,
    latency_ms: Math.round(performance.now() - started),
  };
}

async function classifyWithGemini(
  prompt: string,
): Promise<Omit<LlmClassificationResult, "input_hash">> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new HttpError(424, "missing_gemini_key", "GEMINI_API_KEY is not configured.");
  }
  const model = optionalEnv("GEMINI_CLASSIFIER_MODEL") ?? "gemini-2.5-flash";
  const started = performance.now();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new HttpError(502, "gemini_classification_error", "Gemini classification failed.", body);
  }
  const content = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string") {
    throw new HttpError(502, "invalid_gemini_response", "Gemini response did not include content.");
  }
  return {
    provider: "gemini",
    model,
    prompt_version: "facodi_v2_classification_2026_06_03",
    output_json: extractJsonObject(content),
    usage_json: (body.usageMetadata ?? {}) as Record<string, unknown>,
    latency_ms: Math.round(performance.now() - started),
  };
}

export async function classifyWithFallback(
  input: Record<string, unknown>,
): Promise<LlmClassificationResult> {
  const prompt = [
    "Classify the video using the candidate academic catalog records.",
    "Return JSON with keys: recommended_course_id, recommended_curricular_unit_id, confidence, needs_review, justification, evidence.",
    "Use IDs exactly as provided. If unsure, set needs_review true and confidence below 0.55.",
    JSON.stringify(input),
  ].join("\n\n");
  const inputHash = await sha256Hex(prompt);

  try {
    return { ...(await classifyWithOpenAI(prompt)), input_hash: inputHash };
  } catch (openAiError) {
    try {
      return { ...(await classifyWithGemini(prompt)), input_hash: inputHash };
    } catch (geminiError) {
      throw new HttpError(
        502,
        "llm_classification_failed",
        "OpenAI and Gemini classification failed.",
        {
          openai: openAiError instanceof Error ? openAiError.message : String(openAiError),
          gemini: geminiError instanceof Error ? geminiError.message : String(geminiError),
        },
      );
    }
  }
}
