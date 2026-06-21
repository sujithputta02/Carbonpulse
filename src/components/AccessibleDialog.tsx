/**
 * Accessible dialog/modal component that replaces browser alert() and confirm().
 * Follows WCAG 2.1 Level AA standards with proper focus management and keyboard support.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type DialogType = "alert" | "confirm" | "error" | "success";

interface AccessibleDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message/content */
  message: string;
  /** Type of dialog (affects styling and button labels) */
  type?: DialogType;
  /** Label for primary button (default: "OK" or "Confirm") */
  primaryLabel?: string;
  /** Label for secondary button (only for confirm dialog) */
  secondaryLabel?: string;
  /** Callback when primary action is taken */
  onPrimary: () => void;
  /** Callback when secondary action is taken (for confirm) or dialog is closed */
  onSecondary?: () => void;
  /** Whether dialog is open */
  isOpen: boolean;
  /** Whether dialog should show close button */
  showCloseButton?: boolean;
}

/**
 * Renders an accessible dialog with proper ARIA attributes and keyboard support.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <AccessibleDialog
 *   isOpen={isOpen}
 *   type="confirm"
 *   title="Delete Activity?"
 *   message="This action cannot be undone. Are you sure?"
 *   primaryLabel="Delete"
 *   secondaryLabel="Cancel"
 *   onPrimary={() => {
 *     handleDelete();
 *     setIsOpen(false);
 *   }}
 *   onSecondary={() => setIsOpen(false)}
 * />
 * ```
 */
export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  title,
  message,
  type = "alert",
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  isOpen,
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;
  const messageId = `dialog-message-${Math.random().toString(36).slice(2)}`;

  // Set default labels based on type
  const defaultPrimaryLabel =
    primaryLabel ?? (type === "confirm" ? "Confirm" : "OK");
  const defaultSecondaryLabel = secondaryLabel ?? "Cancel";

  // Style mapping based on type
  const typeStyles = {
    alert: { bg: "bg-slate-900", border: "border-white/10", button: "bg-slate-700" },
    confirm: { bg: "bg-slate-900", border: "border-white/10", button: "bg-emerald-500" },
    error: { bg: "bg-rose-950", border: "border-rose-500/20", button: "bg-rose-600" },
    success: { bg: "bg-emerald-950", border: "border-emerald-500/20", button: "bg-emerald-600" },
  };

  const styles = typeStyles[type];

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onSecondary) {
        e.preventDefault();
        onSecondary();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onPrimary();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onPrimary, onSecondary]);

  // Trap focus within dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll(
      "button, [tabindex]:not([tabindex='-1'])"
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => window.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className={`${styles.bg} ${styles.border} border rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 id={titleId} className="text-lg font-bold text-white">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onSecondary || (() => {})}
              aria-label="Close dialog"
              className="p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Message */}
        <p id={messageId} className="text-sm text-gray-300">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-white/10">
          {(type === "confirm" || showCloseButton) && (
            <button
              onClick={onSecondary || (() => {})}
              aria-label={defaultSecondaryLabel}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {defaultSecondaryLabel}
            </button>
          )}
          <button
            onClick={onPrimary}
            autoFocus
            aria-label={defaultPrimaryLabel}
            className={`px-4 py-2 rounded-lg ${styles.button} hover:opacity-90 text-white font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500`}
          >
            {defaultPrimaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibleDialog;
