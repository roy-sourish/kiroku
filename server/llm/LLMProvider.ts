export interface GenerateOptions {
  system?: string;
  jsonSchema?: object;
}

export interface LLMProvider {
  generate(prompt: string, options: GenerateOptions): Promise<string>;
}
