import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Section } from "@/components/common/decorative";

const items = [
  {
    quote: "ConnectX replaced three tools in our stack in one afternoon. The team hasn't stopped talking about it — literally.",
    name: "Priya Nair",
    role: "Head of Design, Northlite",
  },
  {
    quote: "The fastest chat app I've used in a decade. The AI reply suggestions are shockingly good.",
    name: "Diego Alvarez",
    role: "Founder, Loopwork",
  },
  {
    quote: "It feels like the future of communication. Everything else feels laggy now.",
    name: "Emma Larsson",
    role: "Engineering Lead, Kite",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-3 inline-flex rounded-full glass px-3 py-1 text-xs text-muted-foreground">Loved by teams</div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Words from the <span className="gradient-text">people</span> using it every day.
        </h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl border border-border p-6"
          >
            <div className="mb-4 flex gap-0.5 text-warning">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-mesh" />
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </Section>
  );
}
