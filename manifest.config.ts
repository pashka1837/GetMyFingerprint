import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx4epfCAF+aFX/vfHvX37SpSCzsP0WFXyAW6s4LnYtyH8zqHBn9pHmJkdjBSyoaH/lEGu194lDb6/lP4llrIJFuRrgQSVVQLRSjpnC41+MaVfeaLkDR8dHdNlfwY+c9pj0SAlzEYIFPNMXBpppJvj/QoSqSrd7nhUXOGunQbYon9OI99mHLms+DTyUlq9JXkAbU4p0kE6cGdOmrjTG7LCZG5h7QRngXtC09aDu8FoS2fZxSuos9G2Xo2d2+sGc1oWtwQs8Cfd1QqDZzeCNEMdhpn+ZhICbBJ6B6CxA0Ulnga3mP3sVcwpqZgkqqvBVfg8qtdxf3+EWr2OIr+6SV05FQIDAQAB",
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

  host_permissions: ["https://onlyfans.com/*", "https://api.fidsty.com/*"],

  web_accessible_resources: [
    {
      matches: ["https://onlyfans.com/*"],
      resources: ["readAuthBridge.js"],
    },
  ],
}));
