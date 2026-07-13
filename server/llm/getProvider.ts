import type { ProviderName } from "../../shared/providers";
import { GeminiProvider } from "./GeminiProvider";
import type { LLMProvider } from "./LLMProvider";

export function getProvider(name: ProviderName): LLMProvider {
  switch (name) {
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is not set");
      return new GeminiProvider(key);
    }
    // @NOTE: Add other provider cases here - 2
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
