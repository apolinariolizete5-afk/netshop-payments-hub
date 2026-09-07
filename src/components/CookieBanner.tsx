import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const KEY = "moza-cookies-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  const decide = (value: "aceite" | "essenciais") => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 px-3 pb-3 sm:bottom-0 sm:px-6 sm:pb-6 print:hidden">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-4 shadow-lg">
        <p className="text-sm text-muted-foreground">
          Usamos cookies para manter a sua sessão e melhorar a experiência no Moza Empregos. Consulte
          a nossa{" "}
          <Link to="/privacidade" className="font-semibold text-primary hover:underline">
            política de privacidade
          </Link>
          .
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => decide("aceite")}>
            Aceitar tudo
          </Button>
          <Button size="sm" variant="outline" onClick={() => decide("essenciais")}>
            Apenas essenciais
          </Button>
        </div>
      </div>
    </div>
  );
}
