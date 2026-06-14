import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  name:
    mode === "development"
      ? "[DEV] Get My Fingerprint"
      : mode === "production"
        ? "[PROD] Get My Fingerprint"
        : "Get My Fingerprint",
  short_name: "Get My Fingerprint",
  version: "7.0.0",
  description: "Get My Fingerprint",

  background: {
    // point at SOURCE .ts — CRXJS compiles it
    service_worker: "src/scripts/background.ts",
    type: "module",
  },

  action: {
    default_title: "Get My Fingerprint",
    // default_icon: "src/img/icon.png",
  },

  //   icons: {
  //     "16": "src/img/icon.png",
  //     "32": "src/img/icon.png",
  //     "48": "src/img/icon.png",
  //     "96": "src/img/icon.png",
  //   },

  permissions: [
    "activeTab",
    "cookies",
    "management",
    "scripting",
    "sidePanel",
    "tabs",
    "history",
  ],

  side_panel: {
    default_path: "src/html/sidepanel.html",
  },

  host_permissions: [
    "*://onlyfans.com/*",
    "*://*.onlyfans.com/*",
    "http://localhost:3000/*",
    "*://fidsty.com/*",
    "*://*.fidsty.com/*",
  ],
}));
