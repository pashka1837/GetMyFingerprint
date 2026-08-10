const IS_DEV = import.meta.env.DEV;

export const WEB_URL = IS_DEV ? "http://localhost:5173" : "https://fidsty.com";
export const SUBMIT_BASE = IS_DEV
  ? "http://localhost:3000/api"
  : "https://api.fidsty.com";
export const SUBMIT_FP_PATH = "/of-auth/fingerprint";

export const ONLYFANS_URL = "https://onlyfans.com";
export const ONLYFANS_URL_PATTERNS = "https://onlyfans.com/*";
