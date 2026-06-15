import React from "react";
import { PlusCircle, Loader2, Info } from "lucide-react";
import { CategoryType } from "@/types/activity";

interface ManualLogFormProps {
  activeTab: CategoryType;
  actionType: string;
  setActionType: (val: string) => void;
  amount: number;
  setAmount: (val: number) => void;
  handleManualSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function ManualLogForm({
  activeTab,
  actionType,
  setActionType,
  amount,
  setAmount,
  handleManualSubmit,
  loading,
}: ManualLogFormProps) {
  const getAmountUnit = (cat: CategoryType) => {
    switch (cat) {
      case "TRANSPORT": return "km traveled";
      case "FOOD": return "meals";
      case "ENERGY": return "kWh consumed";
      case "SHOPPING": return "items bought";
      default: return "units";
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/5 flex flex-col space-y-6 self-start text-left">
      <h3 className="font-display font-bold text-lg text-white">Custom Manual Entry</h3>
      
      <form onSubmit={handleManualSubmit} className="flex flex-col space-y-4">
        {/* Action Type Field */}
        <div className="space-y-1">
          <label htmlFor="action-type-select" className="text-xs text-gray-400 block font-medium">Activity Type</label>
          <select
            id="action-type-select"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors font-semibold"
          >
            {activeTab === "TRANSPORT" && (
              <>
                <option value="PETROL_CAR">Petrol Car Drive</option>
                <option value="DIESEL_CAR">Diesel Car Drive</option>
                <option value="EV">Electric Vehicle Drive</option>
                <option value="BUS">Bus Travel</option>
                <option value="TRAIN">Train Journey</option>
                <option value="FLIGHT_SHORT">Short Flight (&lt;1000km)</option>
                <option value="FLIGHT_LONG">Long Flight (&gt;1000km)</option>
              </>
            )}
            {activeTab === "FOOD" && (
              <>
                <option value="MEAT_MEAL">Standard Meat Meal</option>
                <option value="LOW_MEAT_MEAL">Poultry / Low Meat Meal</option>
                <option value="VEGGIE_MEAL">Vegetarian Meal</option>
                <option value="VEGAN_MEAL">Vegan Meal</option>
              </>
            )}
            {activeTab === "ENERGY" && (
              <>
                <option value="ELECTRICITY">Electricity Draw (kWh)</option>
                <option value="NATURAL_GAS">Natural Gas (kWh)</option>
              </>
            )}
            {activeTab === "SHOPPING" && (
              <>
                <option value="CLOTHING">Clothing Purchase</option>
                <option value="ELECTRONICS">Electronic Device</option>
                <option value="MISC">General Consumables</option>
              </>
            )}
          </select>
        </div>

        {/* Amount Field */}
        <div className="space-y-1">
          <label htmlFor="amount-input" className="text-xs text-gray-400 block font-medium">Amount ({getAmountUnit(activeTab)})</label>
          <input
            id="amount-input"
            type="number"
            min="0.1"
            step="any"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors font-semibold"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#090d16] font-display hover:scale-103 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-55 mt-2 cursor-pointer focus:ring-2 focus:ring-emerald-500"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Logs
            </>
          )}
        </button>
      </form>

      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-start space-x-2 text-[10px] text-gray-400 leading-normal">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          Emissions are calculated immediately based on local indices. Values show in the history view right away.
        </p>
      </div>
    </div>
  );
}
