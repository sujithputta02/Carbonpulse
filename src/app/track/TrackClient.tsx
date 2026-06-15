"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logActivity } from "../actions";
import { CategoryType } from "@/types/activity";

import PresetLogger, { PresetItem } from "@/features/tracking/components/PresetLogger";
import ManualLogForm from "@/features/tracking/components/ManualLogForm";

import { 
  Car, Leaf, Zap, ShoppingBag, ArrowLeft, CheckCircle2, AlertCircle 
} from "lucide-react";

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

      {/* Success / Error notices */}
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
                if (cat === "TRANSPORT") setActionType("PETROL_CAR");
                else if (cat === "FOOD") setActionType("VEGGIE_MEAL");
                else if (cat === "ENERGY") setActionType("ELECTRICITY");
                else if (cat === "SHOPPING") setActionType("CLOTHING");
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
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
        <div className="md:col-span-3">
          <PresetLogger
            activeTab={activeTab}
            presets={PRESETS[activeTab]}
            handleQuickLog={handleQuickLog}
            loading={loading}
          />
        </div>

        <div className="md:col-span-2">
          <ManualLogForm
            activeTab={activeTab}
            actionType={actionType}
            setActionType={setActionType}
            amount={amount}
            setAmount={setAmount}
            handleManualSubmit={handleManualSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
