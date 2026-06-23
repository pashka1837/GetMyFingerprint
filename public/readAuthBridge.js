(() => {
  if (window.__fidstyReadAuthBridgeInstalled) {
    return;
  }

  window.__fidstyReadAuthBridgeInstalled = true;

  const requestEventName = "fidsty:read-auth-snapshot";
  const responseEventName = "fidsty:auth-snapshot";

  const readSnapshot = () => {
    const app = document.getElementById("app");
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
  };

  window.addEventListener(requestEventName, () => {
    window.dispatchEvent(
      new CustomEvent(responseEventName, {
        detail: readSnapshot(),
      }),
    );
  });
})();
