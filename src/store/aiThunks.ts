import { generateBlocks } from "../services/AIClient";
import { createBlock } from "../services/BlockEngine";

import { insertAIBlocks } from "./pageSlice";
import type { ProviderName } from "../../shared/providers";
import { createAppAsyncThunk } from "./appThunk";

export const generateAIBlocks = createAppAsyncThunk(
  "ai/generateBlocks",
  async (
    args: { prompt: string; provider: ProviderName; afterId: string | null },
    thunkAPI,
  ) => {
    const { prompt, provider, afterId } = args;

    // 1. Call the client -> BlockIntent[]
    const intents = await generateBlocks(prompt, provider);

    // 2. mint real Blocks from intents
    // @NOTE: nanoid() and Date.now() are impure, so we prepare the full block
    //        here and dispatch.
    const blocks = intents.map((intent) =>
      createBlock(intent.type, intent.content),
    );

    // 3. dispatch the pure reducer with finished blocks
    thunkAPI.dispatch(insertAIBlocks({ blocks, afterId }));
  },
);
