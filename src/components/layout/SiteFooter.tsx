import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, MessageCircle, Music2 } from "lucide-react";

const SOCIALS = [
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
  { href: "https://wa.me/258840000000", label: "WhatsApp", Icon: MessageCircle },
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://linkedin.com", label: "LinkedIn", Icon: Linkedin },
  { href: "https://tiktok.com", label: "TikTok", Icon: Music2 },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <nav className="mt-5 flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
          <Link to="/vagas" className="hover:text-primary">
            Vagas
          </Link>
          <Link to="/empresas" className="hover:text-primary">
            Empresas
          </Link>
          <Link to="/criar-cv" className="hover:text-primary">
            Criar CV
          </Link>
          <Link to="/privacidade" className="hover:text-primary">
            Política de Privacidade
          </Link>
        </nav>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Moza Empregos. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
