import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  name:
    mode === "production"
      ? "Fidsty Analytics Connector"
      : "[DEV] Fidsty Analytics Connector",
  short_name: "Fidsty Analytics Connector",
  version: "1.0.0",
  description:
    "Connect your OnlyFans account to Fidsty Analytics. The extension uses your authorization session only when you explicitly approve account linking.",

  action: {
    default_title: "Fidsty Analytics Connector",
    default_icon: "icons/icon_128.png",
  },

  background: {
    service_worker: "src/scripts/background.ts",
    type: "module",
  },

  content_scripts: [
    {
      matches: ["https://onlyfans.com/*"],
      js: ["src/scripts/content/authWatcher.ts"],
      run_at: "document_idle",
    },
  ],

  icons: {
    "128": "icons/icon_128.png",
  },

  permissions: ["cookies", "scripting", "sidePanel", "tabs"],

  side_panel: {
    default_path: "index.html",
  },

  host_permissions: ["https://onlyfans.com/*"],

  web_accessible_resources: [
    {
      matches: ["https://onlyfans.com/*"],
      resources: ["readAuthBridge.js"],
    },
  ],
}));
