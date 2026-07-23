import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { WhyConnectX } from "@/components/landing/why-connectx";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Where conversations become connections` },
      { name: "description", content: APP_DESCRIPTION },
      { property: "og:title", content: `${APP_NAME} — Real-time messaging, reimagined` },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen">
      <LandingNav />
      <Hero />
      <Features />
      <WhyConnectX />
      <Testimonials />
      <FAQ />
      <CTA />
      <LandingFooter />
    </div>
  );
}
