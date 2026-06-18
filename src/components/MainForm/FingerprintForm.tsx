import { useCallback, useState, type SubmitEvent } from "react";
import { PolicyToggle } from "./PolicyToggle";
import { collectFingerprint } from "../../lib/fingerprint";
import { toast } from "sonner";
import { FingerprintPayload } from "../../types";
import { FidstyClientError } from "../../utils/errors";

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
      <PolicyToggle
        id="agree-to-policies_1"
        label="I consent to the sharing of my information"
        name="agreeToPolicies1"
        required
      />
      <PolicyToggle
        id="agree-to-policies_2"
        label="I confirm that I am voluntarily providing this login data"
        name="agreeToPolicies2"
        required
      />
      <PolicyToggle
        id="agree-to-policies_3"
        label="I understand that this login data contains highly sensitive information, and I agree to monitor activity on the account"
        name="agreeToPolicies3"
        required
      />

      <button
        aria-busy={isCollecting}
        className="app-button app-button-block app-button-primary mt-10"
        disabled={isCollecting}
        type="submit"
      >
        Collect login data
      </button>
    </form>
  );
}
