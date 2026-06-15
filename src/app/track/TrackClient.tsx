"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logActivity } from "../actions";
import { 
  Car, Leaf, Zap, ShoppingBag, ArrowLeft, CheckCircle2, 
  Info, PlusCircle, AlertCircle, Loader2 
} from "lucide-react";

type CategoryType = "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING";

interface PresetItem {
  id: string;
  name: string;
  actionType: string;
  amount: number;
  label: string;
  description: string;
}

const PRESETS: Record<CategoryType, PresetItem[]> = {
  TRANSPORT: [
    { id: "tp_petrol", name: "Carpool/Petrol Ride", actionType: "PETROL_CAR", amount: 15, label: "15 km Petrol trip", description: "Standard short drive share" },
    { id: "tp_diesel", name: "Diesel Car Drive", actionType: "DIESEL_CAR", amount: 25, label: "25 km Diesel trip", description: "Medium-range highway commute" },
    { id: "tp_ev", name: "EV Commute", actionType: "EV", amount: 30, label: "30 km EV trip", description: "Zero-exhaust city commute" },
    { id: "tp_bus", name: "Bus Ride", actionType: "BUS", amount: 10, label: "10 km Bus ride", description: "Shared transit route" },
    { id: "tp_train", name: "Train Journey", actionType: "TRAIN", amount: 50, label: "50 km Train ride", description: "Low carbon high-speed transit" },
  ],
  FOOD: [
    { id: "fd_meat", name: "Standard Meat Meal", actionType: "MEAT_MEAL", amount: 1, label: "1 Meat Meal", description: "Contains beef, pork, or lamb" },
    { id: "fd_low_meat", name: "Poultry / Low Meat Meal", actionType: "LOW_MEAT_MEAL", amount: 1, label: "1 Light Meal", description: "Contains chicken or pork" },
    { id: "fd_veggie", name: "Vegetarian Meal", actionType: "VEGGIE_MEAL", amount: 1, label: "1 Veggie Meal", description: "Egg/Dairy based meal" },
    { id: "fd_vegan", name: "Vegan / Plant-based Meal", actionType: "VEGAN_MEAL", amount: 1, label: "1 Vegan Meal", description: "Fully plant-based raw/cooked" },
  ],
  ENERGY: [
    { id: "eg_elec", name: "Daily Electricity Usage", actionType: "ELECTRICITY", amount: 10, label: "10 kWh Electricity", description: "Average daily home draw" },
    { id: "eg_gas", name: "Daily Natural Gas Draw", actionType: "NATURAL_GAS", amount: 5, label: "5 kWh Gas", description: "Daily cooking or heating gas" },
  ],
  SHOPPING: [
    { id: "sp_cloth", name: "New Clothing Purchase", actionType: "CLOTHING", amount: 1, label: "1 Clothing Item", description: "T-shirt, jeans, or sneakers" },
    { id: "sp_elec", name: "Electronic Gadget", actionType: "ELECTRONICS", amount: 1, label: "1 Electronic Item", description: "Chargers, smartphones, headphones" },
    { id: "sp_misc", name: "Miscellaneous Product", actionType: "MISC", amount: 1, label: "1 Retail Item", description: "Household goods or home decor" },
  ],
};

export default function TrackClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CategoryType>("TRANSPORT");
  const [amount, setAmount] = useState<number>(10);
  const [actionType, setActionType] = useState<string>("PETROL_CAR");
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick log helper for preset clicks
  const handleQuickLog = async (preset: PresetItem) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await logActivity({
        category: activeTab,
        actionType: preset.actionType,
        amount: preset.amount,
      });
      setSuccessMsg(`Successfully logged "${preset.name}"!`);
      // Auto clear message
      setTimeout(() => setSuccessMsg(null), 3000);
      router.refresh();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Failed to log activity. Please try again.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Manual submit helper
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg("Amount must be greater than zero.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await logActivity({
        category: activeTab,
        actionType,
        amount,
      });
      setSuccessMsg(`Successfully logged ${amount} units of ${actionType.replace(/_/g, " ").toLowerCase()}!`);
      setAmount(10);
      setTimeout(() => setSuccessMsg(null), 3000);
      router.refresh();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Failed to log activity.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (cat: CategoryType) => {
    switch (cat) {
      case "TRANSPORT": return <Car className="h-4 w-4" />;
      case "FOOD": return <Leaf className="h-4 w-4" />;
      case "ENERGY": return <Zap className="h-4 w-4" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const getAmountUnit = (cat: CategoryType) => {
    switch (cat) {
      case "TRANSPORT": return "km traveled";
      case "FOOD": return "meals";
      case "ENERGY": return "kWh consumed";
      case "SHOPPING": return "items bought";
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-8 py-4 text-left">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Log Daily Activities</h1>
          <p className="text-sm text-gray-400">Track transport, meals, energy, or retail items to update your footprint splits.</p>
        </div>
      </div>

      {/* Success / Error Toast notices */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-semibold flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Categories Tabs */}
      <div className="flex border-b border-white/5 space-x-4">
        {(["TRANSPORT", "FOOD", "ENERGY", "SHOPPING"] as CategoryType[]).map((cat) => {
          const active = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                // Pre-populate manual select value based on category
                if (cat === "TRANSPORT") setActionType("PETROL_CAR");
                else if (cat === "FOOD") setActionType("VEGGIE_MEAL");
                else if (cat === "ENERGY") setActionType("ELECTRICITY");
                else if (cat === "SHOPPING") setActionType("CLOTHING");
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
                active
                  ? "border-emerald-500 text-emerald-400 font-bold"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {getTabIcon(cat)}
              <span className="capitalize">{cat.toLowerCase()}</span>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left Side: Quick Presets (3 cols) */}
        <div className="md:col-span-3 flex flex-col space-y-4">
          <h3 className="font-display font-bold text-lg text-white">One-Click Presets</h3>
          <p className="text-xs text-gray-400">Select standard activities for fast, estimated logging.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {PRESETS[activeTab].map((preset) => (
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

        {/* Right Side: Manual Log Form (2 cols) */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border-white/5 flex flex-col space-y-6 self-start">
          <h3 className="font-display font-bold text-lg text-white">Custom Manual Entry</h3>
          
          <form onSubmit={handleManualSubmit} className="flex flex-col space-y-4">
            <div className="space-y-1">
              <label htmlFor="action-type-select" className="text-xs text-gray-400 block font-medium">Activity Type</label>
              <select
                id="action-type-select"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
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

            <div className="space-y-1">
              <label htmlFor="amount-input" className="text-xs text-gray-400 block font-medium">Amount ({getAmountUnit(activeTab)})</label>
              <input
                id="amount-input"
                type="number"
                min="0.1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#090d16] font-display hover:scale-103 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-55 mt-2"
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
      </div>
    </div>
  );
}
