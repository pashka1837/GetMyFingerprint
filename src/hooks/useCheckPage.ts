import { useCallback, useEffect, useRef, useState } from "react";
import {
  findOnlyfansTab,
  isOnlyfansUrl,
  openOnlyfansTab,
} from "../lib/pageSetup";

export function useCheckPage() {
  const [pageId, setPageId] = useState<number | null>(null);
  const [pageVersion, setPageVersion] = useState(0);
  const pageIdRef = useRef<number | null>(null);
  const syncPageId = useCallback((nextPageId: number | null) => {
    pageIdRef.current = nextPageId;
    setPageId(nextPageId);
  }, []);
  const bumpPageVersion = useCallback(() => {
    setPageVersion((value) => value + 1);
  }, []);

  const openPage = useCallback(async () => {
    const tabId = await openOnlyfansTab();
    syncPageId(tabId);
    return tabId;
  }, [syncPageId]);

  useEffect(() => {
    let isMounted = true;

    const detectInitialPage = async () => {
      try {
        const tab = await findOnlyfansTab();

        if (!isMounted) return;

        syncPageId(tab?.id ?? null);
      } catch {
        if (!isMounted) return;

        syncPageId(null);
      }
    };

    const handleTabRemoved = async () => {
      const tab = await findOnlyfansTab();

      if (!isMounted) {
        return;
      }

      if (!tab?.id) {
        if (pageIdRef.current !== null) {
          syncPageId(null);
        }
        return;
      }

      syncPageId(tab.id);
    };

    const handleTabUpdated = async (
      tabId: number,
      changeInfo: { status?: string },
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status !== "complete") return;

      if (isOnlyfansUrl(tab.url)) {
        syncPageId(tabId);
        bumpPageVersion();
        return;
      }

      if (pageIdRef.current === tabId) {
        const nextTab = await findOnlyfansTab();

        if (!isMounted) return;

        syncPageId(nextTab?.id ?? null);
        bumpPageVersion();
      }
    };

    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    detectInitialPage();

    return () => {
      isMounted = false;
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [bumpPageVersion, syncPageId]);

  return { pageId, pageVersion, openPage };
}
