import "../styles/main.css";

import { getSubmitFPUrl, getNewTabUrlPatterns } from "./config";
import {
  collectFingerprint,
  copyFingerprintToClipboard,
  downloadFingerprint,
  focusMatchingTab,
} from "./fingerprint";
import { showTokenModal } from "./token-modal";

const DEFAULT_SUBMITTER_TEXT = "Get my fingerprint";
const testModeInput = <HTMLInputElement | null>(
  document.getElementById("test-mode")
);

const resetSubmitter = (
  submitter: HTMLButtonElement,
  text: string = DEFAULT_SUBMITTER_TEXT
) => {
  submitter.disabled = false;
  submitter.textContent = text;
};

(async () => {
  window.addEventListener("click", (e: PointerEvent) => {
    window["shiftKeyStatus"] = e.shiftKey;
    window["ctrlKeyStatus"] = e.ctrlKey;
  });

  const form = <HTMLFormElement | null>(
    document.querySelector('[id="getMyFingerprint"]')
  );

  if (!form) return;

  form.onsubmit = async (e: SubmitEvent | any) => {
    e.preventDefault();

    const submitter = <HTMLButtonElement | null>e.submitter;
    if (!submitter)
      throw new Error("Something went wrong. Submitter not found.");

    submitter.disabled = true;
    submitter.textContent = "Checking your profile...";
    const fingerprint = await collectFingerprint();

    if (!fingerprint) {
      resetSubmitter(submitter, "Could not retrieve fingerprint");

      return;
    }

    if (window["shiftKeyStatus"]) {
      await copyFingerprintToClipboard(fingerprint);
    }

    if (window["ctrlKeyStatus"]) {
      downloadFingerprint(fingerprint);
    }

    submitter.textContent = "Enter token to continue";

    const token = await showTokenModal();

    if (!token) {
      resetSubmitter(submitter);

      return;
    }

    const isTestMode = Boolean(testModeInput?.checked);

    submitter.textContent = "Sending fingerprint...";

    let response: Response;

    try {
      response = await fetch(getSubmitFPUrl(isTestMode, token), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fingerprint),
      });
    } catch (error: any) {
      console.error(error.message);
      resetSubmitter(submitter, "Fingerprint not added");
      // downloadFingerprint();

      return;
    }

    const { ok } = response;

    if (!ok) {
      resetSubmitter(submitter, "Fingerprint not added");
      // downloadFingerprint();

      return;
    }

    submitter.textContent = "Fingerprint collected";

    await focusMatchingTab(getNewTabUrlPatterns(isTestMode), fingerprint);

    setTimeout(() => {
      window.close();
    }, 100);

    return;
  };
})();
