import { readAuthScript } from "./readAuthScript";
import type { OnlyfansPageAuthSnapshot } from "../types";
import { ONLYFANS_URL, ONLYFANS_URL_PATTERNS } from "../utils/const";
import { FidstyClientError } from "../utils/errors";

export function isCorrectUrl(url?: string) {
  return !!url && url.includes(ONLYFANS_URL);
}

export async function findTab() {
  try {
    const tabs = await chrome.tabs.query({
      currentWindow: true,
      url: ONLYFANS_URL_PATTERNS,
    });

    return tabs.pop() ?? null;
  } catch (error) {
    throw new FidstyClientError("Unable to find onlyfans.com page.");
  }
}

export async function openNewTab() {
  try {
    const tab = await chrome.tabs.create({
      active: true,
      url: ONLYFANS_URL,
    });

    const { id: tabId } = tab;

    if (!tabId)
      throw new FidstyClientError("Unable to open onlyfans.com page.");

    return tabId;
  } catch (error) {
    throw new FidstyClientError("Unable to open onlyfans.com page.");
  }
}

export async function ensureCorrectTab() {
  try {
    let tab = await findTab();
    let isNewTab = false;

    if (!tab) {
      const tabId = await openNewTab();
      tab = await chrome.tabs.get(tabId).catch(() => {
        throw new FidstyClientError("Unable to open onlyfans.com page.");
      });
      isNewTab = true;
    }

    const { id: tabId } = tab;

    if (!tabId)
      throw new FidstyClientError("Unable to detect onlyfans.com page.");

    return { tabId, isNewTab };
  } catch (error) {
    throw error;
  }
}

export async function getAuthSnapshotFromChild(
  tabId: number,
): Promise<OnlyfansPageAuthSnapshot | null> {
  const executed = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: readAuthScript,
  });

  return executed[0]?.result ?? null;
}

// export async function getPageId() {
//   const { tabId } = await ensureOnlyfansTab();
//   return tabId;
// }

export async function getOnlyfansCookies() {
  return chrome.cookies.getAll({
    url: ONLYFANS_URL,
  });
}

function getCookieUrl(cookie: chrome.cookies.Cookie) {
  const protocol = cookie.secure ? "https" : "http";
  const domain = cookie.domain.replace(/^\./, "");
  const path = cookie.path || "/";

  return `${protocol}://${domain}${path}`;
}

export async function clearOnlyfansCookies() {
  const cookies = await getOnlyfansCookies();

  await Promise.allSettled(
    cookies.map((cookie) =>
      chrome.cookies.remove({
        name: cookie.name,
        url: getCookieUrl(cookie),
        storeId: cookie.storeId,
      }),
    ),
  );
}

export async function refreshOnlyfansTab(tabId: number) {
  await chrome.tabs.reload(tabId);
}
