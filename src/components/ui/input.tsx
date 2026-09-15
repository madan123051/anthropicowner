import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-fg/15 bg-bg px-3 text-base text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-md border border-fg/15 bg-bg px-3 py-2.5 text-base text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
        className,
      )}
      {...props}
    />
  );
}
