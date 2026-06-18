import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  name:
    mode === "development"
      ? "[DEV] Get My Fingerprint"
      : mode === "production"
        ? "Get My Fingerprint"
        : "Get My Fingerprint",
  short_name: "Get My Fingerprint",
  version: "1.0.0",
  description:
    "Export your OnlyFans login data for personal use. You choose when to collect and how to save your data.",

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

  permissions: [
    // "activeTab",
    // "management",
    "cookies",
    "scripting",
    "sidePanel",
    "tabs",
  ],

  side_panel: {
    default_path: "index.html",
  },

  host_permissions: ["https://onlyfans.com/*", "https://*.onlyfans.com/*"],
}));
