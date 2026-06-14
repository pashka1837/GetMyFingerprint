import { cn } from "../../utils/cn";

type PolicyToggleProps = {
  defaultChecked?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean;
};

export function PolicyToggle({
  defaultChecked = false,
  id,
  label,
  name,
  required = false,
}: PolicyToggleProps) {
  return (
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
            aria-label={label}
            className={cn(
              "absolute inset-0 size-full appearance-none focus:outline-hidden cursor-pointer",
            )}
            defaultChecked={defaultChecked}
            id={id}
            name={name}
            required={required}
            type="checkbox"
          />
        </div>
      </div>
      <label className={cn("text-sm/6 text-gray-400")} htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
