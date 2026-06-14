import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [crx({ manifest }), tailwindcss()],

  // Helps side panel + extension pages talk to Vite dev server (HMR)
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // recommended by CRXJS for extension entry signatures
      preserveEntrySignatures: "exports-only",
    },
  },
});
