import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
