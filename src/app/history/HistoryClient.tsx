"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteActivityAction, getExportDataAction, importLogsAction, ImportedLogItem } from "@/app/actions";
import { ActivityLog } from "@/utils/db";
import { 
  Car, Leaf, Zap, ShoppingBag, ArrowLeft, Trash2, 
  Loader2, AlertCircle, Download, Upload 
} from "lucide-react";

interface HistoryClientProps {
  initialLogs: ActivityLog[];
}

export default function HistoryClient({ initialLogs }: HistoryClientProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const data = await getExportDataAction();
      const content = format === "json" ? data.jsonString : data.csvString;
      const mimeType = format === "json" ? "application/json" : "text/csv";
      const fileExtension = format === "json" ? "json" : "csv";
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carbonpulse_logs_${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export logs", e);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let parsedLogs: ImportedLogItem[] = [];
        
        if (file.name.endsWith(".json")) {
          parsedLogs = JSON.parse(text) as ImportedLogItem[];
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n");
          if (lines.length > 1) {
            const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
              const item: Record<string, string> = {};
              headers.forEach((header, idx) => {
                item[header] = values[idx];
              });
              parsedLogs.push(item as unknown as ImportedLogItem);
            }
          }
        }
        
        if (parsedLogs.length === 0) {
          alert("No valid logs found in file.");
          setImporting(false);
          return;
        }

        const ok = await importLogsAction(parsedLogs);
        if (ok) {
          alert(`Successfully imported ${parsedLogs.length} logs!`);
          router.refresh();
          // Reload page to fetch updated database logs
          window.location.reload();
        }
      } catch (err) {
        console.error("Failed to parse logs", err);
        alert("Failed to parse file. Make sure it's valid JSON or CSV.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity entry?")) return;
    
    setActionLoading(id);
    try {
      const ok = await deleteActivityAction(id);
      if (ok) {
        setLogs((prev) => prev.filter((log) => log.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRANSPORT": return <Car className="h-4 w-4 text-emerald-400" />;
      case "FOOD": return <Leaf className="h-4 w-4 text-cyan-400" />;
      case "ENERGY": return <Zap className="h-4 w-4 text-amber-400" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      default: return <Leaf className="h-4 w-4 text-gray-400" />;
    }
  };

  // Filter logs
  const filteredLogs = activeFilter === "ALL" 
    ? logs 
    : logs.filter((log) => log.category === activeFilter);

  // Sum emissions
  const totalEmissions = filteredLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);

  return (
    <div className="flex flex-col space-y-8 text-left">
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Activity Log History</h1>
          <p className="text-sm text-gray-400">Review, filter, and audit your daily emissions logs.</p>
        </div>
      </div>

      {/* Filter and stats banner */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "TRANSPORT", "FOOD", "ENERGY", "SHOPPING"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeFilter === filter
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Aggregate Stat */}
        <div className="text-xs bg-slate-900 border border-white/5 rounded-2xl px-4 py-2.5 shadow-inner flex items-center space-x-2">
          <span className="text-gray-400">Filtered Carbon Weight:</span>
          <strong className="text-white font-display text-sm font-bold">{Math.round(totalEmissions)} kg CO₂e</strong>
        </div>
      </div>

      {/* Data Operations Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Download className="h-4 w-4 text-emerald-400" />
          <span>Export Logs:</span>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white font-semibold text-[11px] cursor-pointer disabled:opacity-50"
          >
            JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white font-semibold text-[11px] cursor-pointer disabled:opacity-50"
          >
            CSV
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span>Import Logs (.json / .csv):</span>
          <label className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-cyan-500 hover:text-cyan-400 transition-colors text-white font-semibold text-[11px] cursor-pointer relative">
            {importing ? "Importing..." : "Choose File"}
            <input
              type="file"
              accept=".json,.csv"
              disabled={importing}
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Tabular data log list */}
      <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="h-10 w-10 text-gray-600" />
            <p className="text-sm">No logged activities found matching your filters.</p>
            <Link href="/track" className="inline-flex items-center text-xs font-semibold bg-emerald-500 text-[#090d16] px-4 py-2 rounded-xl">
              Track Activity
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 uppercase tracking-wider bg-slate-900/50 border-b border-white/5">
                <tr>
                  <th scope="col" className="px-6 py-4">Activity</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Quantity / Unit</th>
                  <th scope="col" className="px-6 py-4">Carbon Cost</th>
                  <th scope="col" className="px-6 py-4">Date Logged</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white capitalize">
                      {log.actionType.replace(/_/g, " ").toLowerCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                          {getCategoryIcon(log.category)}
                        </span>
                        <span className="text-gray-300 capitalize text-xs">{log.category.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-300">
                      {log.amount}
                    </td>
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {Math.round(log.estimatedCO2e)} kg CO₂e
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={actionLoading === log.id}
                        onClick={() => handleDelete(log.id)}
                        className="p-2 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center justify-center"
                        title="Delete log"
                      >
                        {actionLoading === log.id ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
