import React, { useState } from "react";
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
  setAmount,
  handleManualSubmit,
  loading,
  amount,
}: ManualLogFormProps) {
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const getAmountUnit = (cat: CategoryType) => {
    switch (cat) {
      case "TRANSPORT": return "km traveled";
      case "FOOD": return "meals";
      case "ENERGY": return "kWh consumed";
      case "SHOPPING": return "items bought";
      default: return "units";
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
    
    // Validation with error state
    if (value <= 0) {
      setErrors({ amount: "Amount must be greater than 0" });
    } else {
      setErrors({});
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (amount <= 0) {
      setErrors({ amount: "Amount must be greater than 0" });
      e.preventDefault();
      return;
    }
    setErrors({});
    handleManualSubmit(e);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/5 flex flex-col space-y-6 self-start text-left">
      <h2 className="font-display font-bold text-lg text-white">Custom Manual Entry</h2>
      
      <form onSubmit={handleFormSubmit} className="flex flex-col space-y-4" noValidate>
        {/* Action Type Field */}
        <div className="space-y-1">
          <label htmlFor="action-type-select" className="text-xs text-gray-400 block font-medium">
            Activity Type
            <span className="text-rose-400" aria-label="required">*</span>
          </label>
          <select
            id="action-type-select"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            aria-label="Select an activity type for carbon logging"
            aria-describedby="action-type-help"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-colors font-semibold focus:ring-2"
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
          <span id="action-type-help" className="text-[10px] text-gray-400">
            Choose the type of activity you want to log
          </span>
        </div>

        {/* Amount Field */}
        <div className="space-y-1">
          <label htmlFor="amount-input" className="text-xs text-gray-400 block font-medium">
            Amount ({getAmountUnit(activeTab)})
            <span className="text-rose-400" aria-label="required">*</span>
          </label>
          <input
            id="amount-input"
            type="number"
            min="0.1"
            step="any"
            value={amount || ""}
            onChange={handleAmountChange}
            aria-invalid={!!errors.amount}
            aria-errormessage={errors.amount ? "amount-error" : undefined}
            aria-describedby={errors.amount ? "amount-error amount-help" : "amount-help"}
            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white text-xs focus:outline-none focus:ring-2 transition-colors font-semibold ${
              errors.amount
                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500"
                : "border-white/10 focus:border-emerald-500 focus:ring-emerald-500"
            }`}
            required
          />
          {errors.amount && (
            <span id="amount-error" className="text-xs text-rose-400 font-medium">
              {errors.amount}
            </span>
          )}
          <span id="amount-help" className="text-[10px] text-gray-400">
            Enter a value greater than 0
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !!errors.amount}
          aria-label={loading ? "Saving your activity log" : "Add activity to logs"}
          className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#090d16] font-display hover:scale-103 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-55 disabled:cursor-not-allowed mt-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Add to Logs</span>
            </>
          )}
        </button>
      </form>

      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-start space-x-2 text-[10px] text-gray-400 leading-normal" role="note" aria-label="Information about carbon calculations">
        <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Emissions are calculated immediately based on local indices. Values show in the history view right away.
        </p>
      </div>
    </div>
  );
}
