export type ModelTier = "light" | "standard" | "complex";

type ModelRouteConfig = {
  primary: string;
  fallback: string | null;
  temperature: number;
  maxTokens: number;
};

function readModelEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

export const MODEL_MAP: Record<ModelTier, ModelRouteConfig> = {
  light: {
    primary: readModelEnv("STUDYMATE_MODEL_LIGHT", "gpt-5.4-mini"),
    fallback: readModelEnv("STUDYMATE_MODEL_FALLBACK", "gpt-chat-latest"),
    temperature: 0.2,
    maxTokens: 1200,
  },
  standard: {
    primary: readModelEnv("STUDYMATE_MODEL_STANDARD", "gpt-5.4"),
    fallback: readModelEnv("STUDYMATE_MODEL_FALLBACK", "gpt-chat-latest"),
    temperature: 0.3,
    maxTokens: 4000,
  },
  complex: {
    primary: readModelEnv("STUDYMATE_MODEL_COMPLEX", "gpt-5.4"),
    fallback: readModelEnv("STUDYMATE_MODEL_FALLBACK", "gpt-chat-latest"),
    temperature: 0.25,
    maxTokens: 6000,
  },
};
