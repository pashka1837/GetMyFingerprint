export function AwaitLoginView() {
  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <h2 className="text-balance text-lg font-semibold tracking-tight text-white md:text-xl">
        Login required
      </h2>
      <p className="mt-3 text-base tracking-tight text-gray-400 md:text-lg">
        Sign in on onlyfans.com to continue. The extension will show the form
        after the page reports an active session.
      </p>
    </div>
  );
}
