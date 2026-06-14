import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCheckPage } from "./useCheckPage";
import {
  clearOnlyfansCookies,
  getOnlyfansCookies,
  hasOnlyfansAuthCookies,
  refreshOnlyfansTab,
} from "../lib/pageSetup";

export type StartupViewState =
  | "open_tab_prompt"
  | "loading"
  | "signed_in_warning"
  | "main_form";

export function useStartupState() {
  const { pageId, openPage } = useCheckPage();
  const [hasOnlyfansAuthState, setHasOnlyfansAuthState] = useState(false);
  const [isCheckingCookies, setIsCheckingCookies] = useState(false);
  const [isOpeningPage, setIsOpeningPage] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [cookiesCheckVersion, setCookiesCheckVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    if (pageId === null) {
      setHasOnlyfansAuthState(false);
      setIsCheckingCookies(false);
      return () => {
        isMounted = false;
      };
    }

    if (isWarningDismissed) {
      setIsCheckingCookies(false);
      return () => {
        isMounted = false;
      };
    }

    const detectCookies = async () => {
      setIsCheckingCookies(true);

      try {
        const cookies = await getOnlyfansCookies();

        if (!isMounted) {
          return;
        }

        setHasOnlyfansAuthState(hasOnlyfansAuthCookies(cookies));
      } catch {
        if (!isMounted) {
          return;
        }

        setHasOnlyfansAuthState(false);
        toast.error("Unable to check onlyfans.com cookies.");
      } finally {
        if (isMounted) {
          setIsCheckingCookies(false);
        }
      }
    };

    detectCookies();

    return () => {
      isMounted = false;
    };
  }, [cookiesCheckVersion, isWarningDismissed, pageId]);

  const handleOpenOnlyfans = useCallback(async () => {
    setIsOpeningPage(true);

    try {
      await openPage();
    } catch {
      toast.error("Unable to open onlyfans.com.");
    } finally {
      setIsOpeningPage(false);
    }
  }, [openPage]);

  const handleWarningCancel = useCallback(() => {
    setIsWarningDismissed(true);
  }, []);

  const handleLogout = useCallback(async () => {
    if (pageId === null) {
      return;
    }

    setIsLoggingOut(true);
    setIsWarningDismissed(false);

    try {
      await clearOnlyfansCookies();
      await refreshOnlyfansTab(pageId);
      setCookiesCheckVersion((value) => value + 1);
    } catch {
      toast.error("Unable to log out from onlyfans.com.");
    } finally {
      setIsLoggingOut(false);
    }
  }, [pageId]);

  const viewState = useMemo<StartupViewState>(() => {
    if (pageId === null) {
      return "open_tab_prompt";
    }

    if (isCheckingCookies) {
      return "loading";
    }

    if (hasOnlyfansAuthState && !isWarningDismissed) {
      return "signed_in_warning";
    }

    return "main_form";
  }, [hasOnlyfansAuthState, isCheckingCookies, isWarningDismissed, pageId]);

  return {
    pageId,
    viewState,
    isOpeningPage,
    isLoggingOut,
    handleOpenOnlyfans,
    handleWarningCancel,
    handleLogout,
  };
}
