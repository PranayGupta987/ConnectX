import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-border p-10 text-center sm:p-16"
          style={{ background: "var(--gradient-mesh)" }}
        >
          <div className="absolute inset-0 opacity-30 grid-noise" aria-hidden />
          <h2 className="relative text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
            Ready to talk faster?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of teams and creators building better conversations on ConnectX.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" className="bg-background text-foreground hover:bg-background/90">
              <Link to="/signup">
                Create your account <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="glass" className="text-primary-foreground">
              <Link to="/login">I already have one</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
