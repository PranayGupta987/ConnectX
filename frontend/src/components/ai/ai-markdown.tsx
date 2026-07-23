import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  content: string;
  className?: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute right-2 top-2 h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-white"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* noop */
        }
      }}
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export const AIMarkdown = memo(function AIMarkdown({ content, className }: Props) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none prose-pre:my-3 prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            const isInline = !match && !text.includes("\n");
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-[0.85em] font-mono text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="group relative my-3 overflow-hidden rounded-lg border border-border">
                {match?.[1] && (
                  <div className="flex items-center justify-between border-b border-border/60 bg-[#0b0f1a] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    <span>{match[1]}</span>
                  </div>
                )}
                <CopyBtn text={text} />
                <SyntaxHighlighter
                  PreTag="div"
                  language={match?.[1] ?? "text"}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "0.9rem 1rem",
                    background: "#0b0f1a",
                    fontSize: "0.85rem",
                  }}
                >
                  {text}
                </SyntaxHighlighter>
              </div>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline-offset-2 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
