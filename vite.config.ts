// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Render executes a persistent Node server from .output/server/index.mjs.
  // Pinning this target prevents the Lovable/Cloudflare default from producing
  // a fetch-only bundle that exits immediately when started with Node.
  nitro: { preset: "render-com" },
  tanstackStart: {
    // Run the application as a client-rendered SPA so Render never waits
    // for a route SSR stream. Server functions still run through the Node server.
    spa: {
      enabled: true,
      prerender: {
        crawlLinks: false,
        retryCount: 0,
      },
    },
    // Keep the custom Node server entry for server functions and API behavior.
    server: { entry: "server" },
  },
});
