import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, EyeOff, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col space-y-8 py-4 text-left">
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Privacy Guarantee</h1>
          <p className="text-sm text-gray-400">Your ecological footprints and personal parameters are strictly your own.</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/5 flex flex-col space-y-6">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Local Environment Storage</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            CarbonPulse functions entirely within a local database structure. No external analytics, trackers, or cookies are sent to third parties. Any user data inputted (such as nicknames, commute details, or consumption habits) is written to a local JSON database file (`data/db.json`) on your host machine or cached locally in your browser context.
          </p>
        </div>

        <div className="space-y-3 border-t border-white/5 pt-6">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <EyeOff className="h-5 w-5 text-cyan-400" />
            <span>No External API Requirements</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            All footprint calculations and recommendation scorings happen locally inside the application execution script. The application does not require active connection endpoints to calculate your offsets, ensuring zero tracking of your daily routines.
          </p>
        </div>

        <div className="space-y-3 border-t border-white/5 pt-6">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <span>Security Best Practices</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            API secrets and parameters are handled server-side using environment variables, ensuring that no keys are bundled or exposed to client browsers. In cases where keys are required, fallbacks run locally to maintain robust functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
