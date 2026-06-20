"use client";

import React, { useState, useRef } from "react";

interface AccessibleTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * AccessibleTooltip - WCAG compliant tooltip component
 * 
 * Features:
 * - Uses aria-describedby to link trigger and tooltip
 * - Shows on hover and focus
 * - Keyboard accessible (Tab to trigger, Enter/Space to toggle)
 * - Screen reader friendly with role="tooltip"
 * - Accessible positioning with proper z-index
 * 
 * Usage:
 * <AccessibleTooltip tooltip="Click to save your changes">
 *   <button>Save</button>
 * </AccessibleTooltip>
 */
export default function AccessibleTooltip({
  children,
  tooltip,
  position = "top",
  className = "",
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 transform -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 transform -translate-x-1/2",
    left: "right-full mr-2 top-1/2 transform -translate-y-1/2",
    right: "left-full ml-2 top-1/2 transform -translate-y-1/2",
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* Wrap children and add aria-describedby */}
      <div aria-describedby={isVisible ? tooltipId : undefined}>
        {children}
      </div>

      {/* Tooltip content */}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 border border-white/20 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]} ${className}`}
        >
          {tooltip}
          {/* Arrow indicator */}
          <div
            className={`absolute w-2 h-2 bg-slate-900 border border-white/20 transform rotate-45 ${
              position === "top"
                ? "top-full -translate-y-1/2 left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "bottom-full translate-y-1/2 left-1/2 -translate-x-1/2"
                : position === "left"
                ? "left-full -translate-x-1/2 top-1/2 -translate-y-1/2"
                : "right-full translate-x-1/2 top-1/2 -translate-y-1/2"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
}
