import React from "react";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-emerald-500 focus:text-[#090d16] focus:font-display focus:font-bold focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
