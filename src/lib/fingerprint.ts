import { FingerprintPayload, FingerprintResult } from "../types";
import { ONLYFANS_URL } from "../utils/const";
import { FidstyClientError } from "../utils/errors";

type OnlyfansPageState = {
  authUser: FingerprintResult["authUser"] | null;
  bcTokenSha: string | null;
  isAuth: boolean;
  userAgent: string | null;
  userId: FingerprintResult["userId"] | null;
};

async function getOnlyfansPageState(
  tabId: number,
): Promise<OnlyfansPageState | null> {
  const executed = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    // args: [waitMs, maxWaitSeconds],
    func: async (): Promise<OnlyfansPageState | null> => {
      // const beginAt = Date.now();
      // const wait = (ms: number) =>
      //   new Promise((resolve) => setTimeout(resolve, ms));

      // while (Date.now() - beginAt <= maxWaitSeconds * 1000) {
      const app: any = document.getElementById("app");
      if (!app) return null;
      // {
      // await wait(waitMs);
      // continue;
      // }

      const vue = app.__vue__;
      if (!vue) return null;
      // {
      // await wait(waitMs);
      // continue;
      // }

      const authUser = vue?.authUser ?? null;

      return {
        authUser,
        bcTokenSha: localStorage.getItem("bcTokenSha"),
        isAuth: Boolean(vue?.isAuth),
        userAgent: navigator.userAgent ?? null,
        userId: authUser?.id ?? null,
      };
      // }
    },
  });

  return executed[0]?.result ?? null;
}

export async function collectFingerprint(
  tabId: number,
): Promise<FingerprintPayload> {
  try {
    const pageState = await getOnlyfansPageState(tabId);

    if (!pageState)
      throw new FidstyClientError("Unable to retrieve login data. Try again.");

    if (!pageState.isAuth)
      throw new FidstyClientError(
        "You are not logged in. Please login before submitting.",
      );

    const { authUser, bcTokenSha, userAgent, userId } = pageState;

    if (!authUser || !userId || !userAgent || !bcTokenSha)
      throw new FidstyClientError("Unable to retrieve login data. Try again.");

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

// export async function focusMatchingTab(
//   urlPatterns: string[],
//   fingerprint: FingerprintPayload,
// ): Promise<void> {
//   const tabs = await chrome.tabs.query({
//     url: urlPatterns,
//   });

//   const tab = tabs.pop();

//   if (!tab) throw new FidstyClientError("Unable to detect onlyfans.com tab");

//   const { id: tabId } = tab;
//   if (!tabId) throw new FidstyClientError("Unable to detect onlyfans.com tab");

//   chrome.tabs.update(tabId, {
//     active: true,
//   });

//   chrome.scripting.executeScript({
//     target: { tabId: tabId },
//     world: "MAIN",
//     func: (payload: any) => {
//       // TODO: notify the site about intercepted fingerprint
//     },
//     args: [fingerprint],
//   });
// }
