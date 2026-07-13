import type { GenerateOptions, LLMProvider } from "./LLMProvider";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (options.system) {
      requestBody.systemInstruction = { parts: [{ text: options.system }] };
    }
    if (options.jsonSchema) {
      requestBody.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: options.jsonSchema,
      };
    }
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini request failed (${response.status}): ${errorBody}`,
      );
    }
    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text === undefined) {
      throw new Error(
        `Gemini returned no text. Raw response: ${JSON.stringify(data)}`,
      );
    }

    return text;
  }
}
