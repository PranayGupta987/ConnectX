import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { aiService } from "../services/ai.service.js";

/**
 * The chat endpoint streams tokens as Server-Sent Events.
 * Each event is a JSON object on a single `data:` line.
 * Event shapes:
 *   { type: "start",   provider }
 *   { type: "user",    message }
 *   { type: "token",   token }
 *   { type: "done",    message, provider }
 *   { type: "error",   message }
 */
export const aiController = {
  chat: asyncHandler(async (req, res) => {
    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return ApiResponse.send(res, 400, "Prompt is required");
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const controller = new AbortController();
    req.on("close", () => controller.abort());

    const write = (obj) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    try {
      write({ type: "start", provider: aiService.provider() });
      const { userMessage, assistantMessage, provider } = await aiService.chatStream({
        userId: req.userId,
        prompt,
        signal: controller.signal,
        onToken: (token) => write({ type: "token", token }),
      });
      write({ type: "user", message: userMessage });
      write({ type: "done", message: assistantMessage, provider });
    } catch (err) {
      write({ type: "error", message: err.message || "AI request failed" });
    } finally {
      res.end();
    }
  }),

  history: asyncHandler(async (req, res) => {
    const convo = await aiService.history({ userId: req.userId });
    return ApiResponse.ok(res, convo);
  }),

  clear: asyncHandler(async (req, res) => {
    const data = await aiService.clear({ userId: req.userId });
    return ApiResponse.ok(res, data);
  }),
};
