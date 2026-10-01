import OpenAI, { AzureOpenAI } from "openai";
import { MODEL_MAP, OPENAI_MODEL_MAP, type ModelTier } from "@/lib/model-map";

export type ChatCompletionOptions = {
  modelTier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  requestName?: string;
};

type ModelAttempt = {
  deployment: string;
  modelName: string;
  stage: "primary" | "fallback";
};

let openaiClient: AzureOpenAI | null = null;
let directClient: OpenAI | null = null;

function getProvider(): "openai" | "azure" {
  const provider = process.env.STUDYMATE_AI_PROVIDER?.trim() || (process.env.OPENAI_API_KEY?.trim() ? "openai" : "azure");
  if (provider !== "openai" && provider !== "azure") throw new Error("Invalid STUDYMATE_AI_PROVIDER.");
  return provider;
}

function getDirectClient() {
  if (directClient) return directClient;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  directClient = new OpenAI({ apiKey, timeout: 60_000, maxRetries: 0 });
  return directClient;
}

function safeError(error: unknown) {
  if (!error || typeof error !== "object") return { name: "UnknownError" };
  const details = error as { name?: string; status?: number; code?: string };
  return { name: details.name, status: details.status, code: details.code };
}

function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_KEY?.trim();
  const apiVersion = process.env.OPENAI_API_VERSION?.trim() ?? "2024-10-21";

  if (!endpoint) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT.");
  }

  if (!apiKey) {
    throw new Error("Missing AZURE_OPENAI_KEY.");
  }

  openaiClient = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
  });

  return openaiClient;
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }

  return trimmed;
}

function parseJsonSafely<T>(content: string): T | null {
  const normalized = stripCodeFences(content);

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const arrayMatch = normalized.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]) as T;
      } catch {
        // keep trying
      }
    }

    const objectMatch = normalized.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // keep trying
      }
    }
  }

  return null;
}

function getRequestLabel(requestName?: string) {
  return requestName ? `:${requestName}` : "";
}

function buildAttempts(modelTier: ModelTier, provider: "openai" | "azure"): ModelAttempt[] {
  const config = (provider === "openai" ? OPENAI_MODEL_MAP : MODEL_MAP)[modelTier];
  const attempts: ModelAttempt[] = [
    {
      deployment: config.primary,
      modelName: config.primary,
      stage: "primary",
    },
  ];

  if (config.fallback && config.fallback !== config.primary) {
    attempts.push({
      deployment: config.fallback,
      modelName: config.fallback,
      stage: "fallback",
    });
  }

  return attempts;
}

function flattenModelContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }

        if (block && typeof block === "object" && "text" in block) {
          const text = (block as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function callAzureChatCompletion(
  prompt: string,
  systemPrompt: string,
  deployment: string,
  modelTier: ModelTier,
  stage: "primary" | "fallback",
  options?: ChatCompletionOptions,
) {
  const config = MODEL_MAP[modelTier];
  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens ?? config.maxTokens;
  const requestLabel = getRequestLabel(options?.requestName);

  console.info(`[AI${requestLabel}] Azure model ${deployment} (${modelTier}, ${stage})`);

  const completion = await getOpenAIClient().chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  return flattenModelContent(completion.choices[0]?.message?.content);
}

async function callDirectCompletion(prompt: string, systemPrompt: string, model: string, tier: ModelTier, options?: ChatCompletionOptions) {
  console.info(`[AI${getRequestLabel(options?.requestName)}] OpenAI model ${model} (${tier})`);
  const response = await getDirectClient().responses.create({
    model,
    instructions: systemPrompt,
    input: prompt,
    max_output_tokens: options?.maxTokens ?? OPENAI_MODEL_MAP[tier].maxTokens,
    store: false,
  });
  if (response.status !== "completed") throw new Error("AI response did not complete.");
  return response.output_text?.trim() || "";
}

export async function getChatCompletionText(
  prompt: string,
  systemPrompt: string,
  options?: ChatCompletionOptions,
): Promise<string | null> {
  const modelTier = options?.modelTier ?? "standard";
  const provider = getProvider();
  const attempts = buildAttempts(modelTier, provider);
  let lastError: unknown = null;

  for (const attempt of attempts) {
    try {
      const content = provider === "openai"
        ? await callDirectCompletion(prompt, systemPrompt, attempt.modelName, modelTier, options)
        : await callAzureChatCompletion(
        prompt,
        systemPrompt,
        attempt.deployment,
        modelTier,
        attempt.stage,
        options,
      );

      if (content) {
        return content;
      }

      throw new Error("Empty response from model.");
    } catch (error) {
      lastError = error;
      const requestLabel = getRequestLabel(options?.requestName);
      console.warn(
        `[AI${requestLabel}] ${attempt.modelName} (${attempt.stage}) failed.`,
        safeError(error),
      );
    }
  }

  console.error(`[AI${getRequestLabel(options?.requestName)}] All model attempts failed.`, safeError(lastError));
  return null;
}

export async function getChatCompletion<T = unknown>(
  prompt: string,
  systemPrompt: string,
  options?: ChatCompletionOptions,
): Promise<T | null> {
  const content = await getChatCompletionText(prompt, systemPrompt, options);
  if (!content) {
    return null;
  }

  const parsed = parseJsonSafely<T>(content);
  if (!parsed) {
    console.error("Failed to parse AI JSON response.", { characters: content.length });
  }

  return parsed;
}
