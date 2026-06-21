"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteActivityAction, getExportDataAction, importLogsAction } from "@/app/actions";
import { ActivityLog, ImportedLogItem } from "@/types/activity";
import { logError, getErrorMessage } from "@/lib/clientErrors";
import AccessibleDialog from "@/components/AccessibleDialog";

import LogHistoryTable from "@/features/tracking/components/LogHistoryTable";

import { 
  ArrowLeft, Download, Upload, AlertCircle
} from "lucide-react";

interface HistoryClientProps {
  initialLogs: ActivityLog[];
}

interface DialogState {
  isOpen: boolean;
  type: "delete" | "export" | "import" | null;
  message: string;
  targetId?: string;
}

export default function HistoryClient({ initialLogs }: HistoryClientProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: null,
    message: "",
  });

  /**
   * Handle exporting activity logs in specified format
   */
  const handleExport = useCallback(async (format: "json" | "csv") => {
    setExporting(true);
    setError(null);
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
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError("Failed to export logs", err);
    } finally {
      setExporting(false);
    }
  }, []);

  /**
   * Parse imported file (JSON or CSV) with validation
   */
  const parseImportedFile = useCallback((file: File, text: string): ImportedLogItem[] | null => {
    try {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON file must contain an array of logs");
        }
        return parsed as ImportedLogItem[];
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error("CSV file must have at least a header and one data row");
        }

        const headers = lines[0]
          .split(",")
          .map(h => h.replace(/"/g, "").trim());
        
        const parsedLogs: ImportedLogItem[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map(v => v.replace(/"/g, "").trim());
          
          const item: Record<string, string> = {};
          headers.forEach((header, idx) => {
            item[header] = values[idx] || "";
          });
          parsedLogs.push(item as unknown as ImportedLogItem);
        }
        return parsedLogs;
      }
      return null;
    } catch (err) {
      logError("Failed to parse imported file", err, { fileName: file.name });
      return null;
    }
  }, []);

  /**
   * Handle file import with validation
   */
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    setError(null);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsedLogs = parseImportedFile(file, text);
        
        if (!parsedLogs || parsedLogs.length === 0) {
          setError("No valid logs found in file. Please check the file format.");
          setImporting(false);
          return;
        }

        const ok = await importLogsAction(parsedLogs);
        if (ok) {
          setDialog({
            isOpen: true,
            type: "import",
            message: `Successfully imported ${parsedLogs.length} activity logs!`,
          });
          router.refresh();
        }
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        logError("Failed to import logs", err, { fileName: file.name });
      } finally {
        setImporting(false);
      }
    };
    
    reader.readAsText(file);
  }, [parseImportedFile, router]);

  /**
   * Handle deleting an activity with confirmation
   */
  const handleDelete = useCallback(async (id: string) => {
    setDialog({
      isOpen: true,
      type: "delete",
      message: "Are you sure you want to delete this activity entry? This action cannot be undone.",
      targetId: id,
    });
  }, []);

  /**
   * Confirm deletion after user approval
   */
  const confirmDelete = useCallback(async () => {
    if (!dialog.targetId) return;
    
    setActionLoading(`delete_${dialog.targetId}`);
    setError(null);
    try {
      const ok = await deleteActivityAction(dialog.targetId);
      if (ok) {
        setLogs((prev) => prev.filter((log) => log.id !== dialog.targetId));
        router.refresh();
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError("Failed to delete activity", err, { activityId: dialog.targetId });
    } finally {
      setActionLoading(null);
      setDialog({ isOpen: false, type: null, message: "" });
    }
  }, [dialog.targetId, router]);

  // Filter logs
  const filteredLogs = activeFilter === "ALL" 
    ? logs 
    : logs.filter((log) => log.category === activeFilter);

  // Sum emissions
  const totalEmissions = filteredLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);

  return (
    <>
      {/* Error banner */}
      {error && (
        <div 
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm font-medium flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="text-rose-400 hover:text-rose-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Dialog for confirmations */}
      <AccessibleDialog
        isOpen={dialog.isOpen}
        type={dialog.type === "delete" ? "confirm" : "alert"}
        title={
          dialog.type === "delete"
            ? "Delete Activity?"
            : dialog.type === "import"
            ? "Import Successful"
            : "Export Logs"
        }
        message={dialog.message}
        primaryLabel={dialog.type === "delete" ? "Delete" : "OK"}
        secondaryLabel={dialog.type === "delete" ? "Cancel" : undefined}
        onPrimary={() => {
          if (dialog.type === "delete") {
            confirmDelete();
          } else {
            setDialog({ isOpen: false, type: null, message: "" });
          }
        }}
        onSecondary={() => setDialog({ isOpen: false, type: null, message: "" })}
      />

      <div className="flex flex-col space-y-8 text-left">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            aria-label="Go back to dashboard"
            className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-white">Activity Log History</h1>
            <p className="text-sm text-gray-400">Review, filter, and audit your daily emissions logs.</p>
          </div>
        </div>

        {/* Filter and stats banner */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category filter options">
            {["ALL", "TRANSPORT", "FOOD", "ENERGY", "SHOPPING"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                aria-label={`Filter by ${filter === "ALL" ? "all categories" : filter.toLowerCase()}`}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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
            <Download className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Export Logs:</span>
            <button
              onClick={() => handleExport("json")}
              disabled={exporting}
              aria-label="Export logs as JSON file"
              className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white font-semibold text-[11px] cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              JSON
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              aria-label="Export logs as CSV file"
              className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white font-semibold text-[11px] cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              CSV
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Upload className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <span>Import Logs (.json / .csv):</span>
            <label className="px-3 py-1 rounded bg-slate-950 border border-white/10 hover:border-cyan-500 hover:text-cyan-400 transition-colors text-white font-semibold text-[11px] cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-cyan-500">
              {importing ? "Importing..." : "Choose File"}
              <input
                type="file"
                accept=".json,.csv"
                disabled={importing}
                onChange={handleImport}
                aria-label="Choose file to import activity logs"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Tabular data log list */}
        <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
              <AlertCircle className="h-10 w-10 text-gray-600" aria-hidden="true" />
              <p className="text-sm">No logged activities found matching your filters.</p>
              <Link href="/track" className="inline-flex items-center text-xs font-semibold bg-emerald-500 text-[#090d16] px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                Track Activity
              </Link>
            </div>
          ) : (
            <LogHistoryTable
              logs={filteredLogs}
              actionLoading={actionLoading}
              handleDelete={handleDelete}
              showCategoryIcon={true}
            />
          )}
        </div>
      </div>
    </>
  );
}
