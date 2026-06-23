import { getAuthSnapshotFromChild } from "../lib/pageSetup";
import {
  AUTH_SNAPSHOT,
  AUTH_WATCH_PORT_NAME,
  START_AUTH_WATCH,
  STOP_AUTH_WATCH,
  SUBSCRIBE_AUTH_WATCH,
  type AuthSnapshotMessage,
  type SubscribeAuthWatchMessage,
} from "../messages/auth";
import type { OnlyfansPageAuthSnapshot } from "../types";

const authSnapshotByTabId = new Map<number, OnlyfansPageAuthSnapshot>();
const subscriberCountByTabId = new Map<number, number>();
const portsByTabId = new Map<number, Set<chrome.runtime.Port>>();
const tabIdByPort = new WeakMap<chrome.runtime.Port, number>();

function setSidePanelBehavior() {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);
}

function postSnapshotToPort(
  port: chrome.runtime.Port,
  snapshot: OnlyfansPageAuthSnapshot,
) {
  const message: AuthSnapshotMessage = {
    type: AUTH_SNAPSHOT,
    snapshot,
  };

  port.postMessage(message);
}

function broadcastSnapshot(tabId: number, snapshot: OnlyfansPageAuthSnapshot) {
  const ports = portsByTabId.get(tabId);

  if (!ports?.size) return;

  for (const port of ports) {
    postSnapshotToPort(port, snapshot);
  }
}

async function startAuthWatch(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: START_AUTH_WATCH,
      tabId,
    });
  } catch {
    const snapshot = await getAuthSnapshotFromChild(tabId).catch(() => null);

    if (!snapshot) return;

    authSnapshotByTabId.set(tabId, snapshot);
    broadcastSnapshot(tabId, snapshot);
  }
}

async function stopAuthWatch(tabId: number) {
  await chrome.tabs
    .sendMessage(tabId, {
      type: STOP_AUTH_WATCH,
    })
    .catch(() => undefined);
}

function cleanupPortSubscription(port: chrome.runtime.Port) {
  const tabId = tabIdByPort.get(port);

  if (tabId === undefined) return;

  tabIdByPort.delete(port);

  const ports = portsByTabId.get(tabId);
  ports?.delete(port);

  if (ports?.size === 0) {
    portsByTabId.delete(tabId);
  }

  const nextSubscriberCount = (subscriberCountByTabId.get(tabId) ?? 1) - 1;

  if (nextSubscriberCount <= 0) {
    subscriberCountByTabId.delete(tabId);
    void stopAuthWatch(tabId);
    return;
  }

  subscriberCountByTabId.set(tabId, nextSubscriberCount);
}

function registerPortSubscription(port: chrome.runtime.Port, tabId: number) {
  const previousTabId = tabIdByPort.get(port);

  if (previousTabId === tabId) {
    const snapshot = authSnapshotByTabId.get(tabId);

    if (snapshot) {
      postSnapshotToPort(port, snapshot);
    }

    return;
  }

  if (previousTabId !== undefined) {
    cleanupPortSubscription(port);
  }

  tabIdByPort.set(port, tabId);

  let ports = portsByTabId.get(tabId);

  if (!ports) {
    ports = new Set();
    portsByTabId.set(tabId, ports);
  }

  ports.add(port);

  const currentSubscriberCount = subscriberCountByTabId.get(tabId) ?? 0;
  subscriberCountByTabId.set(tabId, currentSubscriberCount + 1);

  if (currentSubscriberCount === 0) {
    void startAuthWatch(tabId);
  }

  const snapshot = authSnapshotByTabId.get(tabId);

  if (snapshot) {
    postSnapshotToPort(port, snapshot);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  setSidePanelBehavior();
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== AUTH_WATCH_PORT_NAME) return;

  port.onMessage.addListener((message: SubscribeAuthWatchMessage) => {
    if (message.type !== SUBSCRIBE_AUTH_WATCH) return;

    registerPortSubscription(port, message.tabId);
  });

  port.onDisconnect.addListener(() => {
    cleanupPortSubscription(port);
  });
});

chrome.runtime.onMessage.addListener(
  (message: AuthSnapshotMessage, sender: chrome.runtime.MessageSender) => {
    if (message.type !== AUTH_SNAPSHOT) return;

    const tabId = sender.tab?.id;

    if (typeof tabId !== "number") return;

    authSnapshotByTabId.set(tabId, message.snapshot);
    broadcastSnapshot(tabId, message.snapshot);
  },
);

chrome.tabs.onRemoved.addListener((tabId) => {
  authSnapshotByTabId.delete(tabId);
  subscriberCountByTabId.delete(tabId);
  portsByTabId.delete(tabId);
});

setSidePanelBehavior();
