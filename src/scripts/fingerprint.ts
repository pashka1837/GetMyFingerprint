import { ONLYFANS_URL } from "./const";
import { FingerprintPayload, FingerprintResult } from "./types";

export async function collectFingerprint(): Promise<FingerprintPayload | null> {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    url: ["*://onlyfans.com/*"],
  });

  let tab = tabs.pop();
  let isNewTab = false;

  if (!tab) {
    tab = await chrome.tabs.create({
      active: true,
      url: ONLYFANS_URL,
    });

    isNewTab = true;
  }

  const { id: tabId } = tab;

  if (!tabId) throw new Error("Unable to detect onlyfans.com tab");

  await new Promise<void>((resolve) => {
    const observer = async () => {
      const currentTab = await chrome.tabs.get(tabId);
      const { status } = currentTab;

      if ("complete" == status) {
        resolve();

        return;
      }

      setTimeout(observer, 1000);
    };

    observer();
  });

  const executed = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    world: "MAIN",
    func: async () =>
      new Promise((resolve) => {
        const observer = () => {
          const app: any = document.querySelector('[id="app"]');

          if (!app) {
            setTimeout(observer, 100);

            return;
          }

          const { __vue__: vue } = app;

          if (!vue) {
            setTimeout(observer, 100);

            return;
          }

          const { isAuth } = vue;

          if (!isAuth) {
            resolve(null);

            return;
          }

          const { authUser } = vue;
          const { id: userId } = authUser;
          const { userAgent } = navigator;
          const bcTokenSha = localStorage.getItem("bcTokenSha");

          resolve({
            authUser,
            userAgent,
            bcTokenSha,
            userId,
          });
        };

        observer();
      }),
  });

  const result = <FingerprintResult | null>executed[0]?.result;

  if (isNewTab) chrome.tabs.remove(tabId);

  if (!result?.userId || !result?.authUser) return null;

  const cookies = await chrome.cookies.getAll({
    url: ONLYFANS_URL,
  });

  return {
    cookies,
    ...result,
  };
}

export async function copyFingerprintToClipboard(
  fingerprint: FingerprintPayload
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
  fingerprint: FingerprintPayload
): Promise<void> {
  const tabs = await chrome.tabs.query({
    url: urlPatterns,
  });

  const tab = tabs.pop();

  if (!tab) throw new Error("Unable to detect onlyfans.com tab");

  const { id: tabId } = tab;
  if (!tabId) throw new Error("Unable to detect onlyfans.com tab");

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
