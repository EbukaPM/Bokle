import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, maxLength, value, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const count = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          value={value}
          className={cn(
            "min-h-[96px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            error && "border-error focus-visible:ring-error",
            className
          )}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <div className="flex items-center justify-between">
          {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
          {error && (
            <p id={errorId} className="text-xs text-error" role="alert">
              {error}
            </p>
          )}
          {maxLength && (
            <p className="text-xs text-text-muted ml-auto">
              {count}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
