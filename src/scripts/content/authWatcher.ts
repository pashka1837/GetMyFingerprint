import {
  AUTH_SNAPSHOT,
  START_AUTH_WATCH,
  STOP_AUTH_WATCH,
  type AuthSnapshotMessage,
  type AuthWatchRuntimeMessage,
} from "../../messages/auth";
import type { OnlyfansPageAuthSnapshot } from "../../types";

const INITIAL_POLL_INTERVAL_MS = 500;
const READY_POLL_INTERVAL_MS = 500;
const BRIDGE_SCRIPT_ID = "fidsty-read-auth-bridge";
const BRIDGE_REQUEST_EVENT = "fidsty:read-auth-snapshot";
const BRIDGE_RESPONSE_EVENT = "fidsty:auth-snapshot";
const BRIDGE_TIMEOUT_MS = 1000;

let activeTabId: number | null = null;
let intervalId: number | null = null;
let isWatching = false;
let lastSentSnapshot: OnlyfansPageAuthSnapshot | null = null;
let currentIntervalMs: number | null = null;
let bridgeReadyPromise: Promise<void> | null = null;
let isReadingSnapshot = false;

function areSnapshotsEqual(
  left: OnlyfansPageAuthSnapshot | null,
  right: OnlyfansPageAuthSnapshot | null,
) {
  if (!left || !right) return left === right;

  return left.isAuth === right.isAuth && left.isReady === right.isReady;
}

function getPollIntervalMs(snapshot: OnlyfansPageAuthSnapshot) {
  return snapshot.isReady ? READY_POLL_INTERVAL_MS : INITIAL_POLL_INTERVAL_MS;
}

function clearWatchInterval() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }

  currentIntervalMs = null;
}

function schedulePolling(intervalMs: number) {
  if (intervalId !== null && currentIntervalMs === intervalMs) return;

  clearWatchInterval();
  currentIntervalMs = intervalMs;
  intervalId = window.setInterval(() => {
    void emitSnapshot();
  }, intervalMs);
}

function stopWatching() {
  isWatching = false;
  activeTabId = null;
  lastSentSnapshot = null;
  clearWatchInterval();
}

function getFallbackSnapshot(): OnlyfansPageAuthSnapshot {
  return {
    isAuth: false,
    isReady: false,
  };
}

function ensureBridgeInjected() {
  if (bridgeReadyPromise) {
    return bridgeReadyPromise;
  }

  bridgeReadyPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      BRIDGE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript?.dataset.ready === "true") {
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          bridgeReadyPromise = null;
          reject(new Error("Unable to load auth bridge."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = BRIDGE_SCRIPT_ID;
    script.src = chrome.runtime.getURL("readAuthBridge.js");
    script.async = false;
    script.onload = () => {
      script.dataset.ready = "true";
      resolve();
    };
    script.onerror = () => {
      bridgeReadyPromise = null;
      script.remove();
      reject(new Error("Unable to load auth bridge."));
    };

    (document.head || document.documentElement).appendChild(script);
  });

  return bridgeReadyPromise;
}

async function readSnapshotFromBridge(): Promise<OnlyfansPageAuthSnapshot> {
  try {
    await ensureBridgeInjected();
  } catch {
    return getFallbackSnapshot();
  }

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(getFallbackSnapshot());
    }, BRIDGE_TIMEOUT_MS);

    const handleSnapshot = (event: Event) => {
      const customEvent = event as CustomEvent<OnlyfansPageAuthSnapshot>;
      cleanup();
      resolve(customEvent.detail ?? getFallbackSnapshot());
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(BRIDGE_RESPONSE_EVENT, handleSnapshot);
    };

    window.addEventListener(BRIDGE_RESPONSE_EVENT, handleSnapshot, {
      once: true,
    });
    window.dispatchEvent(new CustomEvent(BRIDGE_REQUEST_EVENT));
  });
}

async function emitSnapshot() {
  if (!isWatching || activeTabId === null || isReadingSnapshot) return;

  isReadingSnapshot = true;

  try {
    const snapshot = await readSnapshotFromBridge();
    schedulePolling(getPollIntervalMs(snapshot));

    if (areSnapshotsEqual(lastSentSnapshot, snapshot)) return;

    lastSentSnapshot = snapshot;

    const message: AuthSnapshotMessage = {
      type: AUTH_SNAPSHOT,
      snapshot,
    };

    await chrome.runtime.sendMessage(message).catch(() => undefined);
  } finally {
    isReadingSnapshot = false;
  }
}

function startWatching(tabId: number) {
  activeTabId = tabId;
  isWatching = true;
  lastSentSnapshot = null;
  clearWatchInterval();
  void emitSnapshot();
}

chrome.runtime.onMessage.addListener((message: AuthWatchRuntimeMessage) => {
  if (message.type === START_AUTH_WATCH) {
    startWatching(message.tabId);
    return;
  }

  if (message.type === STOP_AUTH_WATCH) stopWatching();
});
