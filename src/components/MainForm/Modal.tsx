import { SubmitEvent, useCallback, useEffect, useRef, useState } from "react";
import { FingerprintPayload } from "../../types";
import { toast } from "sonner";
import {
  copyFingerprintToClipboard,
  downloadFingerprint,
} from "../../lib/fingerprint";
import { getSubmitFPUrl } from "../../utils/config";
import { FidstyClientError } from "../../utils/errors";

type ModalProps = {
  isOpen: boolean;
  fingerprint: FingerprintPayload;
  handleClose: () => void;
};

const IS_DEV = import.meta.env.DEV;

export function Modal({ handleClose, isOpen, fingerprint }: ModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const clickStartRef = useRef<number | null>(null);
  const [isDevView, setIsDevView] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (!clickCount || isDevView) return;
    const curTime = Date.now();
    const timeDiff = curTime - (clickStartRef.current ?? 0);

    if (clickCount === 5 && timeDiff <= 2000) {
      setIsDevView(true);
      return;
    }

    const timeout = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [clickCount]);

  const handleClick = useCallback(() => {
    if (isDevView) return;
    clickStartRef.current = Date.now();
    setClickCount((count) => count + 1);
  }, [isDevView]);

  const handleCopyFingerprint = useCallback(async () => {
    if (!fingerprint) {
      toast.error("Login data is not available.");
      return;
    }
    try {
      await copyFingerprintToClipboard(fingerprint);
      toast.success("Login data copied to clipboard");
    } catch (error) {
      if (error instanceof FidstyClientError) toast.error(error.message);
      else toast.error("Failed to copy login data to clipboard.");
    }
  }, [fingerprint]);

  const handleDownloadFingerprint = useCallback(() => {
    if (!fingerprint) {
      toast.error("Login data is not available.");
      return;
    }

    try {
      downloadFingerprint(fingerprint);
      toast.success("Login data downloaded");
    } catch (error) {
      toast.error("Failed to download login data.");
    }
  }, [fingerprint]);

  const handleFidstySubmit = useCallback(
    async (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);

      const formData = new FormData(event.target as HTMLFormElement);
      const token = String(formData.get("fidsty-token") || "").trim();

      if (!token) {
        inputRef.current?.reportValidity();
        inputRef.current?.focus();
        toast.error("Token is required");
        setIsSubmitting(false);
        return;
      }

      let response: Response;

      try {
        response = await fetch(getSubmitFPUrl(IS_DEV), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fingerprint, token }),
          credentials: "omit",
        });
      } catch (error) {
        if (error instanceof Error) console.error(error.message);
        else console.error(error);

        toast.error("Failed to submit login data.");
        setIsSubmitting(false);
        return;
      }

      try {
        const data = await response.json();
        if (!response.ok) {
          toast.error(data?.message || "Failed to submit login data.");
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        toast.error("Failed to submit login data.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Login data submitted successfully");

      setIsSubmitting(false);

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
        if (event.target === event.currentTarget) handleClose();
        handleClick();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl ring-1 ring-white/10 space-y-5">
        <form
          action="#"
          className="space-y-3"
          method="POST"
          onSubmit={handleFidstySubmit}
        >
          <input
            ref={inputRef}
            className="mt-2 block w-full rounded-md border-0 bg-white/5 px-3.5 py-2.5 text-sm text-white inset-ring inset-ring-white/10 placeholder:text-gray-500 focus:bg-white/10 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
            id="fidsty-token"
            name="fidsty-token"
            placeholder="Paste token here"
            required
            type="text"
          />
          <button
            className="app-button app-button-primary w-full"
            aria-busy={isSubmitting}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send to Fidsty"}
          </button>
        </form>
        {isDevView && (
          <>
            <div className="flex items-center justify-center text-gray-400 select-none">
              <hr className="flex-1 mr-1" />
              <span className="font-semibold"> or </span>
              <hr className="flex-1 ml-1" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </>
        )}

        <button
          className="app-button app-button-danger w-full"
          onClick={handleClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
