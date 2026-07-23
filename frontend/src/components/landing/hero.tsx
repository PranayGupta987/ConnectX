import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientBackdrop } from "@/components/common/decorative";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      <GradientBackdrop />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Introducing ConnectX 1.0 — Real-time, reimagined
            </span>
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Where conversations
            <br className="hidden sm:block" />{" "}
            become <span className="gradient-text">connections.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            A next-generation messaging platform for teams and creators. Blazing-fast real-time
            chat, AI-assisted conversations, crystal-clear calls, and delightful UX in every pixel.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="xl">
              <Link to="/signup">
                Start for free <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <a href="#features">See what's inside</a>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No credit card required · Free forever plan · 2-minute setup
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-3xl opacity-40 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
          <div className="glass-strong relative overflow-hidden rounded-3xl border border-border shadow-elegant">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-warning/70" />
                <span className="h-3 w-3 rounded-full bg-success/70" />
              </div>
              <span className="ml-3 text-xs text-muted-foreground">connectx.app / #general</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
              <aside className="hidden border-r border-border p-4 md:block">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channels</div>
                {["general", "design", "engineering", "randomness"].map((c, i) => (
                  <div
                    key={c}
                    className={`mb-1 rounded-lg px-3 py-2 text-sm ${i === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
                  >
                    # {c}
                  </div>
                ))}
              </aside>
              <div className="p-6">
                {[
                  { name: "Ava Chen", msg: "Shipping the new inbox tomorrow 🚀", tone: "primary" },
                  { name: "Marcus Reed", msg: "Love the redesign — feels 10× faster.", tone: "muted" },
                  { name: "You", msg: "Same. AI summaries are 🔥", tone: "self" },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.tone === "self" ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className={`mb-4 flex gap-3 ${m.tone === "self" ? "justify-end" : ""}`}
                  >
                    {m.tone !== "self" && (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-mesh" />
                    )}
                    <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${m.tone === "self" ? "text-primary-foreground [background:var(--gradient-primary)]" : "bg-secondary text-secondary-foreground"}`}>
                      {m.tone !== "self" && (
                        <div className="mb-0.5 text-xs font-semibold text-foreground">{m.name}</div>
                      )}
                      {m.msg}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
