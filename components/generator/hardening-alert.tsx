"use client";

import { useState } from "react";
import { ShieldAlert, ChevronDown, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface HardeningAlertProps {
  title: string;
  description: string;
  /** Called when the user dismisses the alert. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline alert shown above the Generate button when the server rejects a
 * request via one of the prompt-hardening gates (400 jailbreak / off-topic,
 * 422 off-topic refusal, 429 concurrency cap, etc).
 *
 * Title is always visible; description starts collapsed and expands on click.
 */
export function HardeningAlert({
  title,
  description,
  onDismiss,
  className,
}: HardeningAlertProps) {
  const [open, setOpen] = useState(false);

  return (
    <Alert
      variant="destructive"
      className={cn("pl-4 pr-3 py-3", className)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="hardening-alert-description"
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <AlertTitle className="mb-0">{title}</AlertTitle>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          <AlertDescription
            id="hardening-alert-description"
            className={cn(
              "grid transition-all duration-200",
              open ? "grid-rows-[1fr] mt-2 opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <p className="overflow-hidden">{description}</p>
          </AlertDescription>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
}
