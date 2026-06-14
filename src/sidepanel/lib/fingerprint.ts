import {
  FailedFPPayload,
  FingerprintPayload,
  FingerprintResult,
} from "../types";
import { ONLYFANS_URL } from "../utils/const";
import { FidstyClientError } from "../utils/errors";

export async function collectFingerprint(
  tabId: number,
): Promise<FingerprintPayload> {
  try {
    const executed = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: async (): Promise<FingerprintResult | { message: string }> => {
        const wait = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));

        while (true) {
          const app: any = document.getElementById("app");
          if (!app) {
            await wait(100);
            continue;
          }

          const vue = app.__vue__;

          if (!vue) {
            await wait(100);
            continue;
          }

          const isAuth = vue?.isAuth;

          if (!isAuth)
            return {
              message: "You are not logged in. Please login before submitting.",
            };

          const authUser = vue?.authUser;
          const userId = authUser?.id;
          const userAgent = navigator.userAgent;
          const bcTokenSha = localStorage.getItem("bcTokenSha");

          if (!authUser || !userId || !userAgent || !bcTokenSha)
            return {
              message: "Unable to retrieve login data. Try again.",
            };

          return {
            authUser,
            userAgent,
            bcTokenSha,
            userId,
          };
        }
      },
    });

    const fingerprintResult = executed[0]?.result;
    if (!fingerprintResult || "message" in fingerprintResult)
      throw new FidstyClientError(
        fingerprintResult?.message ||
          "Unable to retrieve login data. Try again.",
      );

    const cookies = await chrome.cookies.getAll({
      url: ONLYFANS_URL,
    });

    return {
      ...fingerprintResult,
      cookies,
    };
  } catch (error) {
    throw error;
  }
}

export async function copyFingerprintToClipboard(
  fingerprint: FingerprintPayload,
): Promise<void> {
  const result = await Notification.requestPermission();

  try {
    await navigator.clipboard.writeText(JSON.stringify(fingerprint));

    if ("granted" == result) {
      new Notification("Get My Fingerprint", {
        body: "Fingerprint copied to clipboard",
      });
    }
  } catch (error: any) {
    console.error(error.message);
  }
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

export async function focusMatchingTab(
  urlPatterns: string[],
  fingerprint: FingerprintPayload,
): Promise<void> {
  const tabs = await chrome.tabs.query({
    url: urlPatterns,
  });

  const tab = tabs.pop();

  if (!tab) throw new FidstyClientError("Unable to detect onlyfans.com tab");

  const { id: tabId } = tab;
  if (!tabId) throw new FidstyClientError("Unable to detect onlyfans.com tab");

  chrome.tabs.update(tabId, {
    active: true,
  });

  chrome.scripting.executeScript({
    target: { tabId: tabId },
    world: "MAIN",
    func: (payload: any) => {
      // TODO: уведомить сайт о перехвате отпечатка
    },
    args: [fingerprint],
  });
}
