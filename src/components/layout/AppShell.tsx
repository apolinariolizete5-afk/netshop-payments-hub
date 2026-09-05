import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, FileText, Home, Search, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/vagas", label: "Vagas", icon: Briefcase },
  { to: "/criar-cv", label: "Criar CV", icon: FileText },
  { to: "/pesquisar", label: "Pesquisar", icon: Search },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
        ME
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Moza <span className="text-primary">Empregos</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="capulana-band h-1.5 w-full no-print" />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur no-print">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/criar-cv"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
          >
            Criar o meu CV
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:pb-12">{children}</main>

      <footer className="hidden border-t border-border py-8 text-center text-sm text-muted-foreground md:block no-print">
        Moza Empregos — vagas e currículos em Moçambique. Pagamentos por M-Pesa, e-Mola, mKesh e
        cartão.
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-secondary",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
