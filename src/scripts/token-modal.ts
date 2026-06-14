export function showTokenModal(): Promise<string | null> {
  const tokenModal = <HTMLDivElement | null>document.getElementById("token-modal");
  const tokenForm = <HTMLFormElement | null>document.getElementById("token-form");
  const tokenInput = <HTMLInputElement | null>(
    document.getElementById("token-input")
  );
  const tokenCancel = <HTMLButtonElement | null>(
    document.getElementById("token-cancel")
  );

  const hideTokenModal = () => {
    if (tokenModal) {
      tokenModal.classList.add("hidden");
      tokenModal.setAttribute("aria-hidden", "true");
    }

    tokenForm?.reset();
  };

  return new Promise((resolve) => {
    if (!tokenModal || !tokenForm || !tokenInput || !tokenCancel) {
      resolve(null);

      return;
    }

    const cleanup = () => {
      tokenForm.removeEventListener("submit", onSubmit);
      tokenCancel.removeEventListener("click", onCancel);
      tokenModal.removeEventListener("click", onBackdropClick);
      document.removeEventListener("keydown", onKeyDown);
    };

    const finish = (value: string | null) => {
      cleanup();
      hideTokenModal();
      resolve(value);
    };

    const onSubmit = (event: Event) => {
      event.preventDefault();

      const token = tokenInput.value.trim();

      if (!token) {
        tokenInput.reportValidity();
        tokenInput.focus();

        return;
      }

      finish(token);
    };

    const onCancel = () => finish(null);

    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === tokenModal) {
        finish(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ("Escape" == event.key) {
        finish(null);
      }
    };

    tokenModal.classList.remove("hidden");
    tokenModal.setAttribute("aria-hidden", "false");
    tokenInput.value = "";

    tokenForm.addEventListener("submit", onSubmit);
    tokenCancel.addEventListener("click", onCancel);
    tokenModal.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeyDown);

    tokenInput.focus();
  });
}
