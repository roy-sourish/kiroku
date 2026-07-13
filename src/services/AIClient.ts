import type { ProviderName } from "../../shared/providers";
import type { BlockIntent } from "../../shared/types";

export async function generateBlocks(
  prompt: string,
  provider: ProviderName,
): Promise<BlockIntent[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to generate blocks");
  }

  const data = (await response.json()) as { blocks: BlockIntent[] };

  return data.blocks;
}
