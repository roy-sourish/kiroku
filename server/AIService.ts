import type { BlockIntent } from "../shared/types";
import { validateBlocks } from "./llm/blockValidator";
import type { LLMProvider } from "./llm/LLMProvider";

export const BLOCK_ARRAY_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "paragraph",
          "heading_1",
          "heading_2",
          "heading_3",
          "code",
          "quote",
          "todo",
          "divider",
        ],
      },
      content: { type: "string" },
    },
    required: ["type", "content"],
  },
};

export const SYSTEM_PROMPT = `You are a content generator for Kiroku, a block-based note-taking app. Given a topic or request from the user create a well-structured set of blocks that a person would actually want in their notes.
 Each block has a "type" and "content". Use the block types purposefully:
 - heading_1, heading_2, heading_3: section titles and subheadings, to give the notes structure and hierarchy.
 - paragraph: explanation and prose.
 - code: source code or commands. Put only the code in content.
 - quote: a notable line, definition, or highlighted takeaway.
 - todo: an actionable item, when the topic calls for steps or tasks. 
 - divider an optional visual break between major sections.

 Guidelines:
 - Return between 3 and 50 blocks.
 - Choose the block types and their order yourself, based on what best fits the topic. The user will describe a subject, not the name of the block types.
 - Give proper suitable answers based on the subject given by the user.
 - Use code blocks for formulas and equations.
 - Lead with a heading when it helps orient the reader. 
 - Keep each block's content focused and concise.
 - For a divider, leave content as empty string.`;

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateBlocks(
  prompt: string,
  provider: LLMProvider,
): Promise<BlockIntent[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await provider.generate(prompt, {
        system: SYSTEM_PROMPT,
        jsonSchema: BLOCK_ARRAY_SCHEMA,
      });

      // Validate response against our block schema
      const blocks = validateBlocks(JSON.parse(result));

      return blocks;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 500);
      }
    }
  }

  throw lastError;
}
