import { Link } from "@tanstack/react-router";
import { Home, Briefcase, FileText, Search, User } from "lucide-react";

const items = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/vagas", label: "Vagas", icon: Briefcase, exact: false },
  { to: "/criar-cv", label: "Criar CV", icon: FileText, exact: false },
  { to: "/pesquisar", label: "Pesquisar", icon: Search, exact: false },
  { to: "/perfil", label: "Perfil", icon: User, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur md:hidden"
      style={{ boxShadow: "var(--shadow-float)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
