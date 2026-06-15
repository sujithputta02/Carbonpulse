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
  loading: boolean;
}

export default function PresetLogger({
  activeTab,
  presets,
  handleQuickLog,
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
        <h3 className="font-display font-bold text-lg text-white">One-Click Presets</h3>
        <p className="text-xs text-gray-400">Select standard activities for fast, estimated logging.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            disabled={loading}
            onClick={() => handleQuickLog(preset)}
            className="glass-panel glass-panel-hover rounded-2xl p-5 border-white/5 text-left flex flex-col justify-between h-36 relative transition-all active:scale-98 disabled:opacity-55"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 shrink-0">
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
