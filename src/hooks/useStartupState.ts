import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCheckPage } from "./useCheckPage";
import {
  clearOnlyfansCookies,
  refreshOnlyfansTab,
  readOnlyfansPageAuthSnapshot,
} from "../lib/pageSetup";
import type { OnlyfansPageAuthSnapshot } from "../types";

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
  const firstReadyAuthResolvedRef = useRef(false);
  const wasAuthenticatedOnFirstReadyRef = useRef(false);

  const resetAuthTracking = useCallback(() => {
    warningConsumedForCurrentTabRef.current = false;
    firstReadyAuthResolvedRef.current = false;
    wasAuthenticatedOnFirstReadyRef.current = false;
    setIsWarningVisible(false);
  }, []);

  const syncAuthState = useCallback((isAuthenticated: boolean) => {
    setIsPageAuthenticated(isAuthenticated);

    if (!isAuthenticated) {
      setIsWarningVisible(false);
      return;
    }

    if (
      wasAuthenticatedOnFirstReadyRef.current &&
      !warningConsumedForCurrentTabRef.current
    ) {
      warningConsumedForCurrentTabRef.current = true;
      setIsWarningVisible(true);
    }
  }, []);

  const handleAuthSnapshot = useCallback(
    (snapshot: OnlyfansPageAuthSnapshot | null) => {
      if (!snapshot?.isReady) return;

      if (!firstReadyAuthResolvedRef.current) {
        firstReadyAuthResolvedRef.current = true;
        wasAuthenticatedOnFirstReadyRef.current = snapshot.isAuth;
      }

      syncAuthState(snapshot.isAuth);
    },
    [syncAuthState],
  );

  useEffect(() => {
    if (trackedTabIdRef.current === pageId) {
      return;
    }

    trackedTabIdRef.current = pageId;
    resetAuthTracking();
  }, [pageId, resetAuthTracking]);

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
      try {
        const snapshot = await readOnlyfansPageAuthSnapshot(pageId);
        if (!isMounted) return;

        handleAuthSnapshot(snapshot);
      } catch {
        // Ignore transient scripting failures while the page reloads.
      }
    };

    void detectInitialAuthState();

    return () => {
      isMounted = false;
    };
  }, [cookiesCheckVersion, handleAuthSnapshot, pageId, pageVersion]);

  useEffect(() => {
    if (pageId === null) return;

    let isMounted = true;

    const pollSessionState = async () => {
      try {
        const snapshot = await readOnlyfansPageAuthSnapshot(pageId);
        if (!isMounted) return;

        handleAuthSnapshot(snapshot);
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
  }, [handleAuthSnapshot, pageId, pageVersion]);

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
    resetAuthTracking();

    try {
      await clearOnlyfansCookies();
      await refreshOnlyfansTab(pageId);
      setCookiesCheckVersion((value) => value + 1);
    } catch {
      toast.error("Unable to log out from onlyfans.com.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId, resetAuthTracking]);

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
