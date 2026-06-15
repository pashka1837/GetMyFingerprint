import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCheckPage } from "./useCheckPage";
import { clearOnlyfansCookies, refreshOnlyfansTab } from "../lib/pageSetup";
import { readOnlyfansPageAuthSnapshot } from "../lib/fingerprint";

const AUTH_POLL_INTERVAL_MS = 1500;

export type StartupViewState =
  | "open_tab_prompt"
  | "loading"
  | "signed_in_warning"
  | "awaiting_login"
  | "main_form";

export function useStartupState() {
  const { pageId, pageVersion, openPage } = useCheckPage();
  const [isPageAuthenticated, setIsPageAuthenticated] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [cookiesCheckVersion, setCookiesCheckVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const trackedTabIdRef = useRef<number | null>(null);
  const warningConsumedForCurrentTabRef = useRef(false);

  const syncAuthState = useCallback((isAuthenticated: boolean) => {
    setIsPageAuthenticated(isAuthenticated);

    if (!isAuthenticated) {
      setIsWarningVisible(false);
      return;
    }

    if (!warningConsumedForCurrentTabRef.current) {
      warningConsumedForCurrentTabRef.current = true;
      setIsWarningVisible(true);
    }
  }, []);

  useEffect(() => {
    if (trackedTabIdRef.current === pageId) {
      return;
    }

    trackedTabIdRef.current = pageId;
    warningConsumedForCurrentTabRef.current = false;
    setIsWarningVisible(false);
  }, [pageId]);

  useEffect(() => {
    let isMounted = true;

    if (pageId === null) {
      setIsPageAuthenticated(false);
      setIsWarningVisible(false);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const detectInitialAuthState = async () => {
      let pageAuthState = false;

      try {
        const snapshot = await readOnlyfansPageAuthSnapshot(pageId);
        pageAuthState = Boolean(snapshot?.isReady && snapshot.isAuth);
      } catch {
        pageAuthState = false;
      }

      if (!isMounted) return;

      syncAuthState(pageAuthState);
    };

    void detectInitialAuthState();

    return () => {
      isMounted = false;
    };
  }, [cookiesCheckVersion, pageId, pageVersion, syncAuthState]);

  useEffect(() => {
    if (pageId === null) return;

    let isMounted = true;

    const pollSessionState = async () => {
      try {
        const snapshot = await readOnlyfansPageAuthSnapshot(pageId);
        if (!isMounted || !snapshot?.isReady) {
          return;
        }

        syncAuthState(snapshot.isAuth);
      } catch {
        // Ignore transient scripting failures while the page reloads.
      }
    };

    void pollSessionState();

    const intervalId = window.setInterval(() => {
      void pollSessionState();
    }, AUTH_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [pageId, pageVersion, syncAuthState]);

  const handleOpenOnlyfans = useCallback(async () => {
    setIsLoading(true);

    try {
      await openPage();
    } catch {
      toast.error("Unable to open onlyfans.com.");
    } finally {
      setIsLoading(false);
    }
  }, [openPage]);

  const handleWarningCancel = useCallback(() => {
    setIsWarningVisible(false);
  }, []);

  const handleLogout = useCallback(async () => {
    if (pageId === null) return;

    setIsLoading(true);
    setIsPageAuthenticated(false);
    setIsWarningVisible(false);

    try {
      await clearOnlyfansCookies();
      await refreshOnlyfansTab(pageId);
      setCookiesCheckVersion((value) => value + 1);
    } catch {
      toast.error("Unable to log out from onlyfans.com.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const viewState = useMemo<StartupViewState>(() => {
    if (pageId === null) return "open_tab_prompt";
    if (isLoading) return "loading";
    if (isPageAuthenticated && isWarningVisible) return "signed_in_warning";
    if (!isPageAuthenticated) return "awaiting_login";
    return "main_form";
  }, [isLoading, isPageAuthenticated, isWarningVisible, pageId]);

  return {
    pageId,
    viewState,
    isLoading,
    handleOpenOnlyfans,
    handleWarningCancel,
    handleLogout,
  };
}
