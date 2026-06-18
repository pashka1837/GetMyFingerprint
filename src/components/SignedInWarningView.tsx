type SignedInWarningViewProps = {
  isLoggingOut: boolean;
  onCancel: () => void;
  onLogout: () => void;
};

export function SignedInWarningView({
  isLoggingOut,
  onCancel,
  onLogout,
}: SignedInWarningViewProps) {
  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <h2 className="text-balance text-lg font-semibold tracking-tight text-white md:text-xl">
        You are already signed in
      </h2>
      <p className="mt-3 text-base tracking-tight text-gray-400 md:text-lg">
        In order to collect fresh information, please, logout.
      </p>
      <div className="mt-8 space-y-3">
        <button
          aria-busy={isLoggingOut}
          className="app-button app-button-block app-button-primary"
          disabled={isLoggingOut}
          onClick={onLogout}
          type="button"
        >
          Logout
        </button>
        <button
          className="app-button app-button-block app-button-outline"
          disabled={isLoggingOut}
          onClick={onCancel}
          type="button"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
