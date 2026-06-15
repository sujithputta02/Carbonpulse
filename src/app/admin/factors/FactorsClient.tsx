"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateFactorAction } from "@/app/actions";
import { EmissionFactor, AuditLog } from "@/utils/db";
import { 
  ArrowLeft, Edit3, CheckCircle2, AlertCircle, 
  Calendar, ShieldAlert, FileText, Check, Loader2 
} from "lucide-react";

interface FactorsClientProps {
  initialFactors: EmissionFactor[];
  initialAuditLogs: AuditLog[];
}

export default function FactorsClient({
  initialFactors,
  initialAuditLogs,
}: FactorsClientProps) {
  const router = useRouter();
  const [factors, setFactors] = useState<EmissionFactor[]>(initialFactors);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  
  // Selected factor to edit
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleStartEdit = (factor: EmissionFactor) => {
    setEditingKey(factor.key);
    setNewValue(factor.value);
    setReason("");
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

  const handleSaveFactor = async (key: string) => {
    if (newValue < 0) {
      setErrorMsg("Factor value cannot be negative.");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("Please provide a reason for the modification.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updated = await updateFactorAction(key, newValue, reason);
      if (updated) {
        // Update local factors state
        setFactors((prev) =>
          prev.map((f) => (f.key === key ? { ...f, value: updated.value, updatedAt: updated.updatedAt } : f))
        );
        setEditingKey(null);
        setSuccessMsg(`Successfully updated factor for ${key}!`);
        
        // Append a mock audit log locally so it updates immediately in the UI
        const newAudit: AuditLog = {
          id: crypto.randomUUID(),
          action: "UPDATE_FACTOR",
          tableName: "EmissionFactor",
          recordId: updated.id,
          oldValue: factors.find(f => f.key === key)?.value.toString() || "",
          newValue: newValue.toString(),
          timestamp: new Date().toISOString(),
        };
        setAuditLogs((prev) => [newAudit, ...prev]);
        
        router.refresh();
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to update factor.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-display font-extrabold text-3xl text-white">Emission Factors Editor</h1>
          <p className="text-sm text-gray-400">Operations Panel: adjust carbon coefficients and audit modifications.</p>
        </div>
      </div>

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

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Factors Table (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <h3 className="font-display font-bold text-lg text-white">System Coefficients</h3>
          <p className="text-xs text-gray-400">Coefficients map activity volume to kg CO2e. Standard value units represent kg CO₂e / unit.</p>

          <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 uppercase tracking-wider bg-slate-900/50 border-b border-white/5">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Factor Key</th>
                    <th scope="col" className="px-5 py-3.5">Category</th>
                    <th scope="col" className="px-5 py-3.5">Current Coefficient</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {factors.map((factor) => {
                    const isEditing = editingKey === factor.key;
                    return (
                      <tr key={factor.key} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">
                          <code className="text-xs text-cyan-300">{factor.key}</code>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 uppercase tracking-wide">
                            {factor.category}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={newValue}
                                  onChange={(e) => setNewValue(Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/20 text-white text-xs focus:outline-none focus:border-emerald-500"
                                />
                                <span className="text-[10px] text-gray-400">{factor.unit}</span>
                              </div>
                              <input
                                type="text"
                                placeholder="Reason for edit..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-white">
                              {factor.value} <span className="text-[10px] font-normal text-gray-500 ml-1">{factor.unit}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                disabled={loading}
                                onClick={() => handleSaveFactor(factor.key)}
                                className="p-1.5 rounded bg-emerald-500 text-[#090d16] hover:bg-emerald-400 transition-colors inline-flex items-center justify-center"
                                title="Save changes"
                              >
                                {loading ? (
                                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-gray-200 transition-colors"
                                title="Cancel edit"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(factor)}
                              className="p-1.5 rounded bg-white/5 border border-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors inline-flex items-center justify-center"
                              title="Edit factor"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log Panel (2 cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <h3 className="font-display font-bold text-lg text-white">Modification Audit Trail</h3>
          <p className="text-xs text-gray-400">Internal tracking: logs updates made to emissions factors database.</p>

          <div className="glass-panel rounded-2xl p-5 border-white/5 flex flex-col space-y-4 bg-slate-950/20 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs flex flex-col items-center justify-center space-y-2">
                <FileText className="h-8 w-8 text-gray-700" />
                <p>No audit trail logs created yet. Modify a coefficient to test verification loops.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col space-y-2 text-left"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                        <ShieldAlert className="h-3 w-3 mr-0.5 text-cyan-400" />
                        <span>Update Factor</span>
                      </span>
                      <span className="text-gray-500 flex items-center space-x-1">
                        <Calendar className="h-3 w-3 mr-0.5" />
                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white">
                      Value shifted from <strong className="text-rose-400">{log.oldValue}</strong> to <strong className="text-emerald-400">{log.newValue}</strong>
                    </p>

                    <div className="p-2 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400 italic">
                      Audit Reason: {log.action === "UPDATE_FACTOR" ? "Manual adjustment for scientific calibration." : "Factor updated."}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
