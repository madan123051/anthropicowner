import { cn } from "@/lib/utils";

export function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-accent", className)}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1.25" />
      <circle
        cx="32"
        cy="32"
        r="23"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <path
        d="M32 10 L34.6 29.4 L54 32 L34.6 34.6 L32 54 L29.4 34.6 L10 32 L29.4 29.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}
