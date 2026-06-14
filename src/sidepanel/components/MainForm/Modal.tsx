import { useCallback, useEffect, useRef, useState } from "react";
import { FingerprintPayload } from "../../types";
import { toast } from "sonner";
import {
  copyFingerprintToClipboard,
  downloadFingerprint,
  focusMatchingTab,
} from "../../lib/fingerprint";
import { getNewTabUrlPatterns, getSubmitFPUrl } from "../../utils/config";

type ModalProps = {
  isOpen: boolean;
  fingerprint: FingerprintPayload;
  handleClose: () => void;
};

const IS_DEV = import.meta.env.DEV;

export function Modal({ handleClose, isOpen, fingerprint }: ModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setToken("");
      return;
    }

    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleClose, isOpen]);

  const handleCopyFingerprint = useCallback(async () => {
    if (!fingerprint) {
      toast.error("Login data is not available.");
      return;
    }

    await copyFingerprintToClipboard(fingerprint);
    toast.success("Login data copied to clipboard");
  }, [fingerprint]);

  const handleDownloadFingerprint = useCallback(() => {
    if (!fingerprint) {
      toast.error("Login data is not available.");
      return;
    }

    downloadFingerprint(fingerprint);
    toast.success("Login data downloaded");
  }, [fingerprint]);

  const handleFidstySubmit = useCallback(
    async (token: string) => {
      setIsSubmitting(true);

      let response: Response;

      // try {
      //   response = await fetch(getSubmitFPUrl(IS_DEV, token), {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(fingerprint),
      //   });
      // } catch (error) {
      //   if (error instanceof Error) {
      //     console.error(error.message);
      //   } else {
      //     console.error(error);
      //   }
      //   toast.error("Failed to submit login data");
      //   setIsSubmitting(false);
      //   return;
      // }

      // if (!response.ok) {
      //   toast.error("Failed to submit login data");
      //   setIsSubmitting(false);
      //   return;
      // }
      toast.success("Login data submitted successfully");

      try {
        await focusMatchingTab(getNewTabUrlPatterns(IS_DEV), fingerprint);
      } catch (error) {
        console.error(error);
      }

      setTimeout(() => {
        window.close();
      }, 100);
    },
    [fingerprint],
  );

  if (!isOpen) return null;

  return (
    <div
      aria-hidden="false"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl ring-1 ring-white/10">
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            className="app-button app-button-secondary"
            onClick={handleDownloadFingerprint}
            type="button"
          >
            Download JSON file
          </button>
          <button
            className="app-button app-button-secondary"
            onClick={handleCopyFingerprint}
            type="button"
          >
            Copy to clipboard
          </button>
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            const trimmedToken = token.trim();
            if (!trimmedToken) {
              inputRef.current?.reportValidity();
              inputRef.current?.focus();
              return;
            }

            void handleFidstySubmit(trimmedToken);
          }}
        >
          <div>
            <input
              ref={inputRef}
              className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3.5 py-2.5 text-sm text-white inset-ring inset-ring-white/10 placeholder:text-gray-500 focus:bg-white/10 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
              id="token-input"
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste token here"
              required
              type="text"
              value={token}
            />
          </div>
          <button
            className="app-button app-button-primary w-full"
            aria-busy={isSubmitting}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send to Fidsty"}
          </button>
        </form>
        <button
          className="app-button app-button-danger w-full mt-10"
          onClick={handleClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
