import { useCallback, useState, type SubmitEvent } from "react";
import { collectFingerprint } from "../../lib/fingerprint";
import { toast } from "sonner";
import { FingerprintPayload } from "../../types";
import { FidstyClientError } from "../../utils/errors";
import { cn } from "../../utils/cn";
import { WEB_URL } from "../../utils/const";

const legalLinkClassName =
  "text-primary underline underline-offset-2 hover:text-primary/90";

type FingerprintFormProps = {
  tabId: number;
  setFingerprint: (fingerprint: FingerprintPayload) => void;
  setIsModalOpen: (isModalOpen: boolean) => void;
};

export function FingerprintForm({
  tabId,
  setFingerprint,
  setIsModalOpen,
}: FingerprintFormProps) {
  const [isCollecting, setIsCollecting] = useState(false);

  const handleFormSubmit = useCallback(
    async (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsCollecting(true);

      try {
        const fingerprint = await collectFingerprint(tabId);
        setFingerprint(fingerprint);
        setIsModalOpen(true);
      } catch (error) {
        console.error(error);
        if (error instanceof FidstyClientError) toast.error(error.message);
        else toast.error("Could not retrieve login data. Try again.");
      } finally {
        setIsCollecting(false);
      }
    },
    [tabId],
  );
  return (
    <form
      action="#"
      className={"h-full max-w-xl space-y-3 mx-auto mt-auto sm:mt-10"}
      method="POST"
      onSubmit={handleFormSubmit}
    >
      <div className={cn("flex gap-x-4 sm:col-span-2")}>
        <div className={cn("flex h-6 items-center")}>
          <div
            className={cn(
              "group relative inline-flex w-8 shrink-0 rounded-full bg-white/5 p-px inset-ring inset-ring-white/10 outline-offset-2 outline-indigo-500 transition-colors duration-200 ease-in-out",
              "has-checked:bg-indigo-500 has-focus-visible:outline-2",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out",
                "group-has-checked:translate-x-3.5",
              )}
            />
            <input
              aria-label={"Legal consent"}
              className={cn(
                "absolute inset-0 size-full appearance-none focus:outline-hidden cursor-pointer",
              )}
              defaultChecked={false}
              id={"legal-consent"}
              name={"legal-consent"}
              required={true}
              type="checkbox"
            />
          </div>
        </div>
        <label
          className={cn("text-sm/6 text-gray-400")}
          htmlFor={"legal-consent"}
        >
          I accept the{" "}
          <a
            href={`${WEB_URL}/terms`}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClassName}
          >
            Terms of Service
          </a>{" "}
          and agree to the{" "}
          <a
            href={`${WEB_URL}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClassName}
          >
            Privacy Policy
          </a>
        </label>
      </div>

      <button
        aria-busy={isCollecting}
        className="app-button app-button-block app-button-primary mt-10"
        disabled={isCollecting}
        type="submit"
      >
        Submit consent
      </button>
    </form>
  );
}
