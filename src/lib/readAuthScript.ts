import type { OnlyfansPageAuthSnapshot } from "../types";

type OnlyfansVueRoot = {
  isAuth?: unknown;
};

type OnlyfansAppElement = HTMLElement & {
  __vue__?: OnlyfansVueRoot;
};

export function readAuthScript(): OnlyfansPageAuthSnapshot {
  const app = document.getElementById("app") as OnlyfansAppElement | null;
  const vue = app?.__vue__;

  if (!vue) {
    return {
      isAuth: false,
      isReady: false,
    };
  }

  return {
    isAuth: Boolean(vue.isAuth),
    isReady: true,
  };
}
