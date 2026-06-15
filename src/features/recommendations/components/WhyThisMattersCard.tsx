import React from "react";
import { Info } from "lucide-react";
import { getCategoryWhyItMatters } from "@/lib/recommendations/generateInsight";

interface WhyThisMattersCardProps {
  highestCategory: string;
}

export default function WhyThisMattersCard({ highestCategory }: WhyThisMattersCardProps) {
  const { title, explanation } = getCategoryWhyItMatters(highestCategory);

  return (
    <div className="glass-panel rounded-2xl p-5 border-white/5 bg-slate-950/20 text-xs text-gray-400 flex items-start space-x-3 leading-relaxed">
      <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p>{explanation}</p>
      </div>
    </div>
  );
}
