import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  name:
    mode === "production"
      ? "Fidsty Analytics Connector"
      : "[DEV] Fidsty Analytics Connector",
  short_name: "Fidsty AC",
  version: "1.0.0",
  description:
    "Connect your OnlyFans account to Fidsty Analytics. The extension uses your authorization session only when you explicitly approve account linking.",

  action: {
    default_title: "Get My Fingerprint",
    default_icon: "public/icon_128.png",
  },

  background: {
    service_worker: "src/scripts/background.ts",
    type: "module",
  },

  icons: {
    "128": "public/icon_128.png",
  },

  permissions: ["cookies", "scripting", "sidePanel", "tabs"],

  side_panel: {
    default_path: "index.html",
  },

  host_permissions: ["https://onlyfans.com/*"],
}));
