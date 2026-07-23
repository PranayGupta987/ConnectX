import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Github, Twitter, Linkedin } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Where conversations become connections. Real-time messaging for the next generation.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Github, Linkedin].map((I, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid h-9 w-9 place-items-center rounded-full glass text-muted-foreground transition-colors hover:text-foreground"
              >
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold">Product</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#why" className="hover:text-foreground">Why ConnectX</a></li>
            <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Company</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">About</a></li>
            <li><a href="#" className="hover:text-foreground">Careers</a></li>
            <li><a href="#" className="hover:text-foreground">Press</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Get started</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} ConnectX. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
