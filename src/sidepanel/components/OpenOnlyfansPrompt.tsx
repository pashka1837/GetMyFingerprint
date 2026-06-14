type OpenOnlyfansPromptProps = {
  isOpeningPage: boolean;
  onOpen: () => void;
};

export function OpenOnlyfansPrompt({
  isOpeningPage,
  onOpen,
}: OpenOnlyfansPromptProps) {
  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <button
        aria-busy={isOpeningPage}
        className="app-button app-button-block app-button-primary"
        disabled={isOpeningPage}
        onClick={onOpen}
        type="button"
      >
        Open onlyfans.com
      </button>
    </div>
  );
}
