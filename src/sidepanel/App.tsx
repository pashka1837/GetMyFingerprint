import { Toaster } from "sonner";
import { CheckingSessionView } from "./components/CheckingSessionView";
import { MainFormView } from "./components/MainForm/MainFormView";
import { OpenOnlyfansPrompt } from "./components/OpenOnlyfansPrompt";
import { SignedInWarningView } from "./components/SignedInWarningView";
import { useStartupState } from "./hooks/useStartupState";

export function App() {
  const {
    pageId,
    viewState,
    isOpeningPage,
    isLoggingOut,
    handleOpenOnlyfans,
    handleWarningCancel,
    handleLogout,
  } = useStartupState();

  console.log("viewState", viewState);

  return (
    <>
      <div className="isolate flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 lg:p-8 ">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative left-1/2 aspect-1155/678 w-144.5 max-w-none -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-288.75"
          />
        </div>

        {viewState === "open_tab_prompt" && (
          <OpenOnlyfansPrompt
            isOpeningPage={isOpeningPage}
            onOpen={handleOpenOnlyfans}
          />
        )}

        {viewState === "loading" && <CheckingSessionView />}

        {viewState === "signed_in_warning" && (
          <SignedInWarningView
            isLoggingOut={isLoggingOut}
            onCancel={handleWarningCancel}
            onLogout={handleLogout}
          />
        )}

        {viewState === "main_form" && pageId && <MainFormView tabId={pageId} />}
      </div>
      <Toaster position="top-center" richColors theme="dark" />
    </>
  );
}
