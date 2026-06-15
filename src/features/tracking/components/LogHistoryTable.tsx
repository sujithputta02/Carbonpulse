import React from "react";
import { Car, Leaf, Zap, ShoppingBag, Trash2, Loader2, AlertCircle } from "lucide-react";
import { ActivityLog } from "@/types/activity";

interface LogHistoryTableProps {
  logs: ActivityLog[];
  actionLoading: string | null;
  handleDelete: (id: string) => void;
  showCategoryIcon?: boolean;
}

export default function LogHistoryTable({
  logs,
  actionLoading,
  handleDelete,
  showCategoryIcon = true,
}: LogHistoryTableProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRANSPORT": return <Car className="h-4 w-4 text-emerald-400" />;
      case "FOOD": return <Leaf className="h-4 w-4 text-cyan-400" />;
      case "ENERGY": return <Zap className="h-4 w-4 text-amber-400" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      default: return <Leaf className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAmountUnit = (cat: string) => {
    switch (cat) {
      case "TRANSPORT": return "km";
      case "FOOD": return "meals";
      case "ENERGY": return "kWh";
      case "SHOPPING": return "items";
      default: return "units";
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3 glass-panel rounded-2xl border-white/5">
        <AlertCircle className="h-10 w-10 text-gray-600" />
        <p className="text-sm">No activity logs found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-gray-400 uppercase tracking-wider bg-slate-900/50 border-b border-white/5">
          <tr>
            <th scope="col" className="px-6 py-4">Activity</th>
            <th scope="col" className="px-6 py-4">Category</th>
            <th scope="col" className="px-6 py-4">Quantity</th>
            <th scope="col" className="px-6 py-4">Carbon Cost</th>
            <th scope="col" className="px-6 py-4">Date Logged</th>
            <th scope="col" className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {logs.map((log) => {
            const isDeleting = actionLoading === log.id;
            return (
              <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4 font-semibold text-white capitalize">
                  {log.actionType.replace(/_/g, " ").toLowerCase()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-xs">
                    {showCategoryIcon && (
                      <span className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                        {getCategoryIcon(log.category)}
                      </span>
                    )}
                    <span className="text-gray-300 capitalize text-xs">{log.category.toLowerCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-300">
                  {log.amount} <span className="text-xs text-gray-500 font-normal">{getAmountUnit(log.category)}</span>
                </td>
                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                  {Math.round(log.estimatedCO2e)} kg CO₂e
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {new Date(log.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    disabled={isDeleting}
                    onClick={() => handleDelete(log.id)}
                    className="p-2 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center justify-center cursor-pointer"
                    title="Delete log"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
