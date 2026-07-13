import { generateBlocks } from "../server/AIService";
import { getProvider } from "../server/llm/getProvider";
import { isProviderName } from "../shared/providers";

/*-----------------------------------------------------
@NOTE: Later when the Request schema becomes large we 
       can switch to Zod for runtime and compile time
       schema validation.
-------------------------------------------------------*/

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Get "prompt" out of request body
  const prompt = (body as Record<string, unknown>).prompt;
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  // Get "AI-provider" out of request body
  const providerName = (body as Record<string, unknown>).provider;
  if (!isProviderName(providerName)) {
    return Response.json({ error: "Unknown provider" }, { status: 400 });
  }

  try {
    const provider = getProvider(providerName);
    const blocks = await generateBlocks(prompt, provider);

    return Response.json({ blocks });
  } catch (error) {
    console.error("generate failed:", error);
    return Response.json(
      { error: "Failed to generate blocks" },
      { status: 502 },
    );
  }
}
