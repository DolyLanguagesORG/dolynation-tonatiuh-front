import { describe, expect, it, jest } from "@jest/globals";

import type { ApiTransport } from "@/lib/api-contracts";
import { AI_TIMEOUT_MS } from "@/lib/http-core";
import { createReadingsService } from "@/lib/services/readings-service";

describe("readingsService.deepExplain", () => {
  it("posts only word and context to the dedicated deep explanation endpoint", async () => {
    const post = jest.fn<ApiTransport["post"]>().mockResolvedValue({
      message: "Deep explanation",
      data: { text: "Explicación detallada." },
    });
    const service = createReadingsService({ post } as unknown as ApiTransport);

    const res = await service.deepExplain(42, {
      word: "rayo",
      context: "que me parta un rayo",
    });

    expect(res.data.text).toBe("Explicación detallada.");
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      "/readings/42/explanations/deep",
      { word: "rayo", context: "que me parta un rayo" },
      { timeoutMs: AI_TIMEOUT_MS },
    );
    const body = post.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("systemPrompt");
    expect(body).not.toHaveProperty("messages");
  });
});
