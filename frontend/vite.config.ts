// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//    - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//      nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//      React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      // 8080 is reserved for the Spring Boot backend (see /frontend proxying it under /api).
      port: 5173,
      proxy: {
        "/api": { target: "http://localhost:8080", changeOrigin: true },
      },
    },
    resolve: {
      alias: {
        // See src/lib/mediapipe-selfie-segmentation-stub.ts for why this is aliased out.
        "@mediapipe/selfie_segmentation": fileURLToPath(
          new URL("./src/lib/mediapipe-selfie-segmentation-stub.ts", import.meta.url),
        ),
      },
    },
  },
});
