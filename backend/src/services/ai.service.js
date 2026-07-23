import { AIConversation, AI_ROLES } from "../models/AIConversation.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

/**
 * AI service — provider-agnostic chat abstraction.
 *
 * Adapters below implement a single async-iterator interface:
 *   async function* stream({ messages, signal }) → yields string tokens.
 *
 * Provider is selected via the `AI_PROVIDER` env var:
 *   - "openai"  → https://api.openai.com/v1/chat/completions   (OPENAI_API_KEY)
 *   - "gemini"  → Google Generative Language API              (GEMINI_API_KEY)
 *   - "groq"    → https://api.groq.com/openai/v1/chat/completions (GROQ_API_KEY)
 *   - "mistral" → https://api.mistral.ai/v1/chat/completions   (MISTRAL_API_KEY)
 *   - "claude"  → https://api.anthropic.com/v1/messages        (ANTHROPIC_API_KEY)
 *   - "placeholder" (default when no key) → canned, streamed response
 *
 * Add a new provider by exporting a `stream(...)` function and registering it
 * in the ADAPTERS map. The controller code is unchanged.
 */

const SYSTEM_PROMPT =
  "You are ConnectX AI, a helpful, friendly assistant embedded in the ConnectX messaging app. " +
  "Be concise, warm, and format code with fenced markdown blocks and language hints when useful.";

const TEXT_ENCODER_DELAY = () => new Promise((r) => setTimeout(r, 25));

/* ─────────────────────────── OpenAI-compatible adapter ─────────────────────── */
async function* openAICompatibleStream({ url, apiKey, model, messages, signal }) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw ApiError.internal(`AI provider error (${res.status}): ${text.slice(0, 200)}`, "AI_UPSTREAM");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const chunk = JSON.parse(payload);
        const token = chunk?.choices?.[0]?.delta?.content ?? "";
        if (token) yield token;
      } catch {
        /* ignore malformed keep-alive lines */
      }
    }
  }
}

/* ─────────────────────────── Provider adapters ────────────────────────────── */
const ADAPTERS = {
  openai: {
    isAvailable: () => Boolean(process.env.OPENAI_API_KEY),
    stream: (args) =>
      openAICompatibleStream({
        ...args,
        url: "https://api.openai.com/v1/chat/completions",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.AI_MODEL || "gpt-4o-mini",
      }),
  },
  groq: {
    isAvailable: () => Boolean(process.env.GROQ_API_KEY),
    stream: (args) =>
      openAICompatibleStream({
        ...args,
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
      }),
  },
  mistral: {
    isAvailable: () => Boolean(process.env.MISTRAL_API_KEY),
    stream: (args) =>
      openAICompatibleStream({
        ...args,
        url: "https://api.mistral.ai/v1/chat/completions",
        apiKey: process.env.MISTRAL_API_KEY,
        model: process.env.AI_MODEL || "mistral-small-latest",
      }),
  },
  gemini: {
    isAvailable: () => Boolean(process.env.GEMINI_API_KEY),
    async *stream({ messages, signal }) {
      const model = process.env.AI_MODEL || "gemini-1.5-flash-latest";
      const key = process.env.GEMINI_API_KEY;
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
      const system = messages.find((m) => m.role === "system")?.content;
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
        `:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;
      const body = { contents };
      if (system) body.systemInstruction = { parts: [{ text: system }] };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok || !res.body) {
        throw ApiError.internal(`Gemini error: ${res.status}`, "AI_UPSTREAM");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const json = JSON.parse(line.slice(5).trim());
            const token = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (token) yield token;
          } catch {
            /* skip */
          }
        }
      }
    },
  },
  claude: {
    isAvailable: () => Boolean(process.env.ANTHROPIC_API_KEY),
    async *stream({ messages, signal }) {
      const model = process.env.AI_MODEL || "claude-3-5-sonnet-latest";
      const system = messages.find((m) => m.role === "system")?.content;
      const chat = messages.filter((m) => m.role !== "system");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          stream: true,
          messages: chat.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal,
      });
      if (!res.ok || !res.body) {
        throw ApiError.internal(`Anthropic error: ${res.status}`, "AI_UPSTREAM");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const json = JSON.parse(line.slice(5).trim());
            if (json.type === "content_block_delta" && json.delta?.text) {
              yield json.delta.text;
            }
          } catch {
            /* skip */
          }
        }
      }
    },
  },
  placeholder: {
    isAvailable: () => true,
    async *stream({ messages }) {
      const last = messages[messages.length - 1]?.content ?? "";
      const reply =
        "🤖 **ConnectX AI (demo mode)**\n\n" +
        `I received: _"${last.slice(0, 240)}"_\n\n` +
        "No AI provider key is configured on the backend. Set `AI_PROVIDER` and " +
        "the matching API key (e.g. `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`) " +
        "in your `.env` to enable real responses.\n\n" +
        "```js\n// Example .env\nAI_PROVIDER=openai\nOPENAI_API_KEY=sk-…\nAI_MODEL=gpt-4o-mini\n```";
      for (const token of reply.split(/(\s+)/)) {
        yield token;
        await TEXT_ENCODER_DELAY();
      }
    },
  },
};

function pickAdapter() {
  const requested = (process.env.AI_PROVIDER || "").toLowerCase();
  if (requested && ADAPTERS[requested]?.isAvailable()) return { name: requested, ...ADAPTERS[requested] };
  for (const name of ["openai", "gemini", "groq", "mistral", "claude"]) {
    if (ADAPTERS[name].isAvailable()) return { name, ...ADAPTERS[name] };
  }
  return { name: "placeholder", ...ADAPTERS.placeholder };
}

/* ─────────────────────────── Public API ───────────────────────────────────── */

export const aiService = {
  provider() {
    return pickAdapter().name;
  },

  /** Load or create the user's AI conversation. */
  async getOrCreate({ userId }) {
    let convo = await AIConversation.findOne({ user: userId });
    if (!convo) convo = await AIConversation.create({ user: userId, messages: [] });
    return convo;
  },

  async history({ userId }) {
    const convo = await this.getOrCreate({ userId });
    return convo.toJSON();
  },

  async clear({ userId }) {
    await AIConversation.updateOne({ user: userId }, { $set: { messages: [] } }, { upsert: true });
    return { ok: true };
  },

  /**
   * Stream a completion for the user's next prompt.
   * @param {object} args
   * @param {string} args.userId
   * @param {string} args.prompt
   * @param {AbortSignal} [args.signal]
   * @param {(token: string) => void} args.onToken
   * @returns {Promise<{ userMessage: object, assistantMessage: object, provider: string }>}
   */
  async chatStream({ userId, prompt, signal, onToken }) {
    const trimmed = String(prompt ?? "").trim();
    if (!trimmed) throw ApiError.badRequest("Prompt is required", "AI_PROMPT_REQUIRED");

    const convo = await this.getOrCreate({ userId });
    convo.messages.push({ role: AI_ROLES.USER, content: trimmed });
    // Persist the user message right away so history stays in sync.
    await convo.save();
    const userMessage = convo.messages[convo.messages.length - 1].toObject();
    userMessage.id = userMessage._id.toString();
    delete userMessage._id;

    const adapter = pickAdapter();
    const modelMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...convo.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    ];

    let full = "";
    try {
      for await (const token of adapter.stream({ messages: modelMessages, signal })) {
        full += token;
        onToken?.(token);
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        logger.info(`AI stream aborted for user=${userId}`);
      } else {
        logger.error("AI stream failed", { err: err.message });
        throw err;
      }
    }

    if (!full.trim()) {
      full = "_(no response)_";
    }

    convo.messages.push({ role: AI_ROLES.ASSISTANT, content: full, model: adapter.name });
    await convo.save();
    const assistantMessage = convo.messages[convo.messages.length - 1].toObject();
    assistantMessage.id = assistantMessage._id.toString();
    delete assistantMessage._id;

    return { userMessage, assistantMessage, provider: adapter.name };
  },
};
