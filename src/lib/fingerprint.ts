import { FingerprintPayload, FingerprintResult } from "../types";
import { ONLYFANS_URL } from "../utils/const";
import { FidstyClientError } from "../utils/errors";

type PageState = {
  authUser: FingerprintResult["authUser"] | null;
  bcTokenSha: string | null;
  isAuth: boolean;
  userAgent: string | null;
  userId: FingerprintResult["userId"] | null;
};

async function getPageState(tabId: number): Promise<PageState | null> {
  const executed = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async (): Promise<PageState | null> => {
      const app: any = document.getElementById("app");
      if (!app) return null;
      const vue = app.__vue__;
      if (!vue) return null;
      const authUser = vue?.authUser ?? null;

      return {
        authUser,
        bcTokenSha: localStorage.getItem("bcTokenSha"),
        isAuth: Boolean(vue?.isAuth),
        userAgent: navigator.userAgent ?? null,
        userId: authUser?.id ?? null,
      };
    },
  });

  return executed[0]?.result ?? null;
}

export async function collectFingerprint(
  tabId: number,
): Promise<FingerprintPayload> {
  try {
    const pageState = await getPageState(tabId);

    if (!pageState)
      throw new FidstyClientError(
        "Unable to collect connection data. Try again.",
      );

    if (!pageState.isAuth)
      throw new FidstyClientError(
        "You are not logged in. Please login before submitting.",
      );

    const { authUser, bcTokenSha, userAgent, userId } = pageState;

    if (!authUser || !userId || !userAgent || !bcTokenSha)
      throw new FidstyClientError(
        "Unable to collect connection data. Try again.",
      );

    if (!authUser.isPerformer || !authUser.isRealPerformer)
      throw new FidstyClientError(
        "You are not a model. Please login as a model before submitting.",
      );

    const cookies = await chrome.cookies.getAll({
      url: ONLYFANS_URL,
    });

    return {
      authUser,
      bcTokenSha,
      cookies,
      userAgent,
      userId,
    };
  } catch (error) {
    throw error;
  }
}

export async function copyFingerprintToClipboard(
  fingerprint: FingerprintPayload,
): Promise<void> {
  const result = await Notification.requestPermission();
  if (result !== "granted")
    throw new FidstyClientError("Permission to copy is not granted.");

  await navigator.clipboard.writeText(JSON.stringify(fingerprint));
}

export function downloadFingerprint(fingerprint: FingerprintPayload): void {
  const blob = new Blob([JSON.stringify(fingerprint)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  const { userId, authUser } = fingerprint;
  const { username } = authUser;

  downloadLink.href = url;
  downloadLink.download = `fingerprint_${userId}_${username}.json`;
  downloadLink.click();
}
