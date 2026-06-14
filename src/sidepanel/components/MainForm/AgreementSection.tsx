import { PROD_SUBMIT_BASE } from "../../utils/const";

export function AgreementSection() {
  return (
    <div className="mx-auto text-center max-w-xl">
      <h2 className="text-balance text-lg md:text-xl font-semibold tracking-tight text-white">
        Agreement
      </h2>
      <div className="space-y-2 mt-2 text-left text-base md:text-lg text-gray-400 tracking-tight">
        <p>
          The information being transmitted is highly sensitive and could be
          misused. Avoid sharing this information with third parties. If you
          notice any suspicious activity on your account, immediately deactivate
          sessions.
        </p>

        <p>
          The{" "}
          <a
            href={PROD_SUBMIT_BASE}
            target="_blank"
            rel="noreferrer"
            className="text-white"
          >
            <b>Fidsty</b>
          </a>{" "}
          project does not store fingerprints in plain text and allows only one
          active session from its server.
        </p>

        <p>
          By agreeing to this proposal, you confirm your permission for the{" "}
          <a
            href={PROD_SUBMIT_BASE}
            target="_blank"
            rel="noreferrer"
            className="text-white"
          >
            <b>Fidsty</b>
          </a>{" "}
          project to access your account and use its data collection systems.
        </p>
      </div>
    </div>
  );
}
