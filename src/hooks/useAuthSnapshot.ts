import { useEffect } from "react";
import {
  AUTH_SNAPSHOT,
  AUTH_WATCH_PORT_NAME,
  SUBSCRIBE_AUTH_WATCH,
  type AuthSnapshotMessage,
  type SubscribeAuthWatchMessage,
} from "../messages/auth";
import type { OnlyfansPageAuthSnapshot } from "../types";

export function useAuthSnapshot(
  tabId: number | null,
  pageVersion: number,
  onSnapshot: (snapshot: OnlyfansPageAuthSnapshot) => void,
) {
  useEffect(() => {
    if (tabId === null) return;

    const port = chrome.runtime.connect({
      name: AUTH_WATCH_PORT_NAME,
    });

    const handleMessage = (message: AuthSnapshotMessage) => {
      if (message.type !== AUTH_SNAPSHOT) return;
      onSnapshot(message.snapshot);
    };

    port.onMessage.addListener(handleMessage);

    const subscribeMessage: SubscribeAuthWatchMessage = {
      type: SUBSCRIBE_AUTH_WATCH,
      tabId,
    };

    port.postMessage(subscribeMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
      port.disconnect();
    };
  }, [onSnapshot, pageVersion, tabId]);
}
