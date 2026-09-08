import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { BottomNav } from "./BottomNav";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-4">{children}</main>
      <SiteFooter />
      <div className="pb-24 md:pb-0" />
      <BottomNav />
    </div>
  );
}
