import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { OnlyfansPageAuthSnapshot, StartupViewState } from "../types";
import { useAuthSnapshot } from "./useAuthSnapshot";
import { useCheckPage } from "./useCheckPage";
import { clearOnlyfansCookies, refreshOnlyfansTab } from "../lib/pageSetup";

export function useStartupState() {
  const { pageId, pageVersion, openPage } = useCheckPage();
  const [isPageAuthenticated, setIsPageAuthenticated] = useState(false);
  const [isAuthedWarn, setIsAuthedWarn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const trackedTabIdRef = useRef<number | null>(null);
  const isAuthWarnConsumedRef = useRef(false);
  const firstAuthReadyResolvedRef = useRef(false);
  const wasAuthOnFirstReadyRef = useRef(false);

  const resetAuthTracking = useCallback(() => {
    isAuthWarnConsumedRef.current = false;
    firstAuthReadyResolvedRef.current = false;
    wasAuthOnFirstReadyRef.current = false;
    setIsAuthedWarn(false);
  }, []);

  const handleAuthSnapshot = useCallback(
    (snapshot: OnlyfansPageAuthSnapshot | null) => {
      if (!snapshot?.isReady) return;

      if (!firstAuthReadyResolvedRef.current) {
        firstAuthReadyResolvedRef.current = true;
        wasAuthOnFirstReadyRef.current = snapshot.isAuth;
      }

      setIsPageAuthenticated(snapshot.isAuth);

      if (!snapshot.isAuth) {
        setIsAuthedWarn(false);
        return;
      }

      if (wasAuthOnFirstReadyRef.current && !isAuthWarnConsumedRef.current) {
        isAuthWarnConsumedRef.current = true;
        setIsAuthedWarn(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (trackedTabIdRef.current === pageId) return;
    trackedTabIdRef.current = pageId;
    resetAuthTracking();
  }, [pageId, resetAuthTracking]);

  useEffect(() => {
    if (pageId !== null) return;

    setIsPageAuthenticated(false);
    setIsAuthedWarn(false);
    setIsLoading(false);
  }, [pageId]);

  useAuthSnapshot(pageId, pageVersion, handleAuthSnapshot);

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
    setIsAuthedWarn(false);
  }, []);

  const handleLogout = useCallback(async () => {
    if (pageId === null) return;

    setIsLoading(true);

    try {
      await clearOnlyfansCookies();
      await refreshOnlyfansTab(pageId);
      setIsPageAuthenticated(false);
      resetAuthTracking();
    } catch {
      toast.error("Unable to log out from onlyfans.com.");
    } finally {
      setIsLoading(false);
    }
  }, [pageId, resetAuthTracking]);

  const viewState = useMemo<StartupViewState>(() => {
    if (pageId === null) return "open_tab_prompt";
    if (isLoading) return "loading";
    if (isPageAuthenticated && isAuthedWarn) return "signed_in_warning";
    if (!isPageAuthenticated) return "awaiting_login";
    return "main_form";
  }, [isLoading, isPageAuthenticated, isAuthedWarn, pageId]);

  return {
    pageId,
    viewState,
    isLoading,
    handleOpenOnlyfans,
    handleWarningCancel,
    handleLogout,
  };
}
