import { Bookmark, BookmarkCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useSavedJobIds, useToggleSavedJob } from "@/hooks/useUserJobs";
import { cn } from "@/lib/utils";

export function SaveJobButton({
  jobId,
  variant = "icon",
  className,
}: {
  jobId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: savedIds } = useSavedJobIds(user?.id);
  const toggle = useToggleSavedJob(user?.id);
  const saved = (savedIds ?? []).includes(jobId);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast("Entre na sua conta para guardar vagas", {
        action: { label: "Entrar", onClick: () => navigate({ to: "/auth" }) },
      });
      return;
    }
    toggle.mutate({ jobId, saved });
  };

  const Icon = saved ? BookmarkCheck : Bookmark;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={saved ? "Remover das guardadas" : "Guardar vaga"}
        aria-pressed={saved}
        onClick={handleClick}
        disabled={toggle.isPending}
        className={cn("shrink-0", saved && "text-primary", className)}
      >
        <Icon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={saved}
      className={cn("gap-2", className)}
    >
      <Icon className="h-4 w-4" />
      {saved ? "Guardada" : "Guardar vaga"}
    </Button>
  );
}
