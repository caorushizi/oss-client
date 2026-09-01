import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({
  className,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border bg-zinc-950/60 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
