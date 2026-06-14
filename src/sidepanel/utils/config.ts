import { PROD_SUBMIT_BASE, SUBMIT_FP_PATH, TEST_SUBMIT_BASE } from "./const";

export function getApiBase(isTestMode: boolean): string {
  return isTestMode ? TEST_SUBMIT_BASE : PROD_SUBMIT_BASE;
}

export function getSubmitFPUrl(isTestMode: boolean, token: string): string {
  return `${getApiBase(isTestMode)}${SUBMIT_FP_PATH}?token=${encodeURIComponent(
    token,
  )}`;
}

export function getNewTabUrlPatterns(isTestMode: boolean): string[] {
  return isTestMode
    ? ["http://localhost:3000/*"]
    : ["*://fidsty.com/*", "*://*.fidsty.com/*"];
}
