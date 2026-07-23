import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section } from "@/components/common/decorative";

const faqs = [
  {
    q: "Is ConnectX free to use?",
    a: "Yes. ConnectX has a generous free forever plan for individuals and small teams. Paid plans add larger group calls, advanced admin controls, and priority support.",
  },
  {
    q: "How is my data protected?",
    a: "All traffic is encrypted in transit with TLS 1.3, and messages are encrypted at rest. We're SOC 2 aligned and never sell your data.",
  },
  {
    q: "Can I import contacts from other apps?",
    a: "You can import contacts via CSV or connect your address book. We're rolling out direct import from Slack, WhatsApp, and Telegram in 2026.",
  },
  {
    q: "Do you have mobile apps?",
    a: "iOS and Android apps ship with feature parity. The web app is a PWA and installs on desktop with one click.",
  },
  {
    q: "What powers the AI features?",
    a: "ConnectX uses opt-in on-device and server-side models. You control what data is shared with AI features and can turn them off anytime.",
  },
];

export function FAQ() {
  return (
    <Section id="faq">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex rounded-full glass px-3 py-1 text-xs text-muted-foreground">FAQ</div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Questions, <span className="gradient-text">answered.</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="glass rounded-2xl border border-border px-6">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
