import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt = "",
  fallback,
  className,
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  const initials = (fallback ?? alt ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-secondary",
        className
      )}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={alt}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </span>
  );
}

export default Avatar;
