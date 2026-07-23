import { Sparkles, Code, Lightbulb, Wand2 } from "lucide-react";
import { AIAvatar } from "@/components/ai/ai-avatar";
import { AI_ASSISTANT } from "@/lib/constants";

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    prompt: "Give me 5 creative product ideas for a Gen-Z messaging app.",
  },
  {
    icon: Code,
    title: "Explain code",
    prompt: "Explain what a JavaScript Promise is with a small example.",
  },
  {
    icon: Wand2,
    title: "Rewrite text",
    prompt: "Rewrite this message to sound more friendly: 'send report asap'.",
  },
  {
    icon: Sparkles,
    title: "Plan my day",
    prompt: "Plan a productive 8-hour workday for a solo developer.",
  },
];

interface Props {
  onPick: (prompt: string) => void;
}

export function AIWelcome({ onPick }: Props) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <AIAvatar size="lg" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Meet {AI_ASSISTANT.NAME}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {AI_ASSISTANT.TAGLINE} Ask anything — brainstorm, debug, summarize, translate.
      </p>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
