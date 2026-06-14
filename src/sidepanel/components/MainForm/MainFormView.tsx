import { useState } from "react";
import { AgreementSection } from "./AgreementSection";
import { FingerprintForm } from "./FingerprintForm";
import { Modal } from "./Modal";
import { FingerprintPayload } from "../../types";

type MainFormViewProps = {
  tabId: number;
};

export function MainFormView({ tabId }: MainFormViewProps) {
  const [fingerprint, setFingerprint] = useState<FingerprintPayload | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AgreementSection />
      <FingerprintForm
        tabId={tabId}
        setFingerprint={setFingerprint}
        setIsModalOpen={setIsModalOpen}
      />
      {!!fingerprint && isModalOpen && (
        <Modal
          handleClose={() => setIsModalOpen(false)}
          isOpen={isModalOpen}
          fingerprint={fingerprint}
        />
      )}
    </>
  );
}
