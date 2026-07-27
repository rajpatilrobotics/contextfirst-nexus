import {
  OpenAIRequestedModelSchema,
  type OpenAIRequestedModel,
} from "../../contracts";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra" as const;

const DISPLAY_NAMES: Record<OpenAIRequestedModel, string> = {
  "gpt-5.6-sol": "GPT-5.6 Sol",
  "gpt-5.6-terra": "GPT-5.6 Terra",
  "gpt-5.6-luna": "GPT-5.6 Luna",
};

export type OpenAIModelConfiguration = {
  model: OpenAIRequestedModel;
  displayName: string;
  valid: boolean;
};

export function resolveOpenAIModel(
  configuredModel: string | undefined,
): OpenAIModelConfiguration {
  const candidate = configuredModel?.trim() || DEFAULT_OPENAI_MODEL;
  const parsed = OpenAIRequestedModelSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      model: DEFAULT_OPENAI_MODEL,
      displayName: DISPLAY_NAMES[DEFAULT_OPENAI_MODEL],
      valid: false,
    };
  }

  return {
    model: parsed.data,
    displayName: DISPLAY_NAMES[parsed.data],
    valid: true,
  };
}

export const OPENAI_MODEL_CONFIGURATION = resolveOpenAIModel(
  process.env.OPENAI_MODEL,
);
