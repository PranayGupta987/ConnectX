import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Sparkles,
  MessageSquare,
  Video,
  Users,
} from "lucide-react";
import { Section } from "@/components/common/decorative";

const features = [
  { icon: MessageSquare, title: "Real-time chat", desc: "Delivered in under 60ms across regions with typing, read receipts, and threads." },
  { icon: Sparkles, title: "AI assistance", desc: "Summaries, translations, and reply suggestions built directly into every conversation." },
  { icon: Video, title: "HD calls", desc: "Group video and audio calls with adaptive bitrate, screen share, and noise suppression." },
  { icon: Users, title: "Friends & groups", desc: "Beautiful presence, rich profiles, and effortless group discovery." },
  { icon: Shield, title: "End-to-end security", desc: "Encryption at rest and in transit, granular permissions, SOC 2 aligned." },
  { icon: Zap, title: "Blazing fast", desc: "Sub-second cold starts, offline-first UI, and instant search across your history." },
];

export function Features() {
  return (
    <Section id="features">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-3 inline-flex rounded-full glass px-3 py-1 text-xs text-muted-foreground">
          What's inside
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          A platform designed for the way you <span className="gradient-text">actually talk.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Every detail engineered for speed, clarity, and delight — from the message composer to
          the notification you get on your watch.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <div
              className="mb-5 grid h-12 w-12 place-items-center rounded-xl text-primary-foreground shadow-elegant"
              style={{ background: "var(--gradient-primary)" }}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-30" style={{ background: "var(--gradient-primary)" }} />
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
