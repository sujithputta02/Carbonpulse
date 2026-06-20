import React from "react";
import { Car, Leaf, Zap, ShoppingBag } from "lucide-react";

export interface PresetItem {
  id: string;
  name: string;
  actionType: string;
  amount: number;
  label: string;
  description: string;
}

interface PresetLoggerProps {
  activeTab: "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";
  presets: PresetItem[];
  handleQuickLog: (preset: PresetItem) => void;
  handleSameAsYesterday?: () => void;
  lastLoggedItem?: PresetItem | null;
  loading: boolean;
}

export default function PresetLogger({
  activeTab,
  presets,
  handleQuickLog,
  handleSameAsYesterday,
  lastLoggedItem,
  loading,
}: PresetLoggerProps) {
  const getTabIcon = (cat: string) => {
    switch (cat) {
      case "TRANSPORT": return <Car className="h-4 w-4" />;
      case "FOOD": return <Leaf className="h-4 w-4" />;
      case "ENERGY": return <Zap className="h-4 w-4" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-left">
        <h2 className="font-display font-bold text-lg text-white">One-Click Presets</h2>
        <p className="text-xs text-gray-300">Select standard activities for fast, estimated logging.</p>
      </div>

      {/* Same as yesterday button - for maximum friction reduction */}
      {lastLoggedItem && handleSameAsYesterday && (
        <button
          onClick={handleSameAsYesterday}
          disabled={loading}
          aria-label={`Quick log: same as yesterday - ${lastLoggedItem.name}`}
          className="w-full glass-panel glass-panel-hover rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 text-left transition-all active:scale-98 disabled:opacity-55 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-emerald-300 text-sm">Same as Yesterday</p>
              <p className="text-xs text-gray-400 mt-1">{lastLoggedItem.name} • {lastLoggedItem.amount} {lastLoggedItem.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">90% faster</p>
              <p className="text-emerald-400 font-bold text-xs mt-0.5">→</p>
            </div>
          </div>
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            disabled={loading}
            onClick={() => handleQuickLog(preset)}
            aria-label={`Log ${preset.name}. ${preset.description}. Estimated emissions impact included.`}
            className="glass-panel glass-panel-hover rounded-2xl p-5 border-white/5 text-left flex flex-col justify-between h-36 relative transition-all active:scale-98 disabled:opacity-55 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 shrink-0" aria-hidden="true">
                {getTabIcon(activeTab)}
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/10">
                Preset Log
              </span>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold text-white text-xs block">{preset.name}</h4>
              <p className="text-[10px] text-gray-400 block mt-0.5">{preset.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
