import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useUserJobs";
import { timeAgo } from "@/lib/jobs.types";

export const Route = createFileRoute("/notificacoes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notificações | Moza Empregos" },
      {
        name: "description",
        content: "Acompanhe as suas notificações de candidaturas e novas vagas no Moza Empregos.",
      },
      { property: "og:title", content: "Notificações | Moza Empregos" },
      { property: "og:description", content: "Novidades sobre as suas candidaturas e vagas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const notifications = useNotifications(user?.id);

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <h1 className="text-xl font-extrabold">Notificações</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para ver as suas notificações.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const items = notifications.data ?? [];
  const unread = items.filter((item) => !item.read).length;

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-2xl font-extrabold">Notificações</h1>
        {unread > 0 && (
          <Button variant="ghost" className="gap-1" onClick={() => markAll.mutate()}>
            <CheckCheck className="h-4 w-4" /> Marcar lidas
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          <Bell className="mx-auto mb-2 h-6 w-6" aria-hidden />
          Sem notificações por agora.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl border p-4 ${
                item.read ? "border-border bg-card" : "border-primary/30 bg-primary-soft"
              }`}
            >
              <p className="text-sm font-bold">{item.title}</p>
              {item.body && <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
