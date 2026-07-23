import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Section } from "@/components/common/decorative";

const points = [
  { title: "Zero-friction onboarding", desc: "Import contacts, sync avatars, and start chatting in under two minutes." },
  { title: "Built for scale", desc: "Handles millions of concurrent sockets without breaking a sweat." },
  { title: "Design that gets out of the way", desc: "Beautiful in the light, gorgeous in the dark. Always readable, always fast." },
  { title: "Own your data", desc: "Export anytime. No lock-in. Full GDPR compliance out of the box." },
];

export function WhyConnectX() {
  return (
    <Section id="why">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="mb-3 inline-flex rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            Why ConnectX
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            The messenger that <span className="gradient-text">respects</span> your time.
          </h2>
          <p className="mt-4 text-muted-foreground">
            We started ConnectX because every chat app we tried felt like a compromise. Slow. Noisy. Bloated. So we built the one we always wanted.
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4"
              >
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{p.desc}</div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-3xl opacity-40 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
          <div className="glass-strong relative rounded-3xl border border-border p-8 shadow-elegant">
            <div className="grid grid-cols-3 gap-4">
              {[
                { k: "60ms", v: "median delivery" },
                { k: "99.99%", v: "uptime SLA" },
                { k: "180+", v: "countries" },
                { k: "10M+", v: "messages/day" },
                { k: "4.9★", v: "user rating" },
                { k: "SOC 2", v: "aligned" },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl border border-border bg-background/40 p-4 text-center">
                  <div className="font-display text-2xl font-bold gradient-text">{s.k}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
