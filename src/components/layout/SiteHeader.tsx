import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Briefcase, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useUserJobs";

const desktopLinks = [
  { to: "/vagas", label: "Vagas" },
  { to: "/empresas", label: "Empresas" },
  { to: "/criar-cv", label: "Criar CV" },
  { to: "/pesquisar", label: "Pesquisar" },
] as const;

export function SiteHeader() {
  const { user } = useSession();
  const { data: notifications } = useNotifications(user?.id);
  const unread = (notifications ?? []).filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 truncate font-display text-base font-extrabold tracking-tight sm:text-lg">
              Moza<span className="text-primary"> Empregos</span>
            </span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {desktopLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pesquisar"
            className="md:hidden"
            onClick={() => navigate({ to: "/pesquisar" })}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notificações" asChild>
            <Link to="/notificacoes" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/perfil">Minha conta</Link>
            </Button>
          ) : (
            <Button size="sm" asChild className="hidden md:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-1 text-base">Menu</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1">
                {desktopLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={user ? "/perfil" : "/auth"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
                >
                  {user ? "Minha conta" : "Entrar"}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
