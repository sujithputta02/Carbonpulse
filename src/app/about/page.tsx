import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Database, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col space-y-8 py-4 text-left">
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Scientific Foundation</h1>
          <p className="text-sm text-gray-400">Learn about CarbonPulse calculations, factors, and research sources.</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/5 flex flex-col space-y-6">
        <div className="space-y-3">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <span>Behavioral Design</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            CarbonPulse is designed to shift carbon awareness into habit formation. Traditional calculators demand heavy, complex paperwork (such as uploading gas bills or measuring precise trash weights), leading to high abandonment. Behavioral science suggests that offering a simplified baseline, clear categories, and one specific, actionable recommendation yields significantly higher adoption.
          </p>
        </div>

        <div className="space-y-3 border-t border-white/5 pt-6">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <span>Emissions Factor Data Sources</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Our baseline carbon factors are adapted from peer-reviewed climate database releases, including the **Intergovernmental Panel on Climate Change (IPCC)**, **UK Defra**, and the **US EPA Greenhouse Gas Equivalencies**.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1.5 pl-2">
            <li><strong>Petrol Commute:</strong> 0.27 kg CO2e per vehicle kilometer (average passenger car).</li>
            <li><strong>Electric Vehicle (EV):</strong> 0.05 kg CO2e per kilometer (accounting for electric grid charging mix).</li>
            <li><strong>Diet Patterns:</strong> Meat-heavy diets are estimated at 7.26 kg/day, whereas plant-based vegan diets generate 2.89 kg/day due to lower agricultural land/methane footprints.</li>
            <li><strong>Electricity:</strong> 0.38 kg CO2e per kWh (standard national average power grid mix).</li>
          </ul>
        </div>

        <div className="space-y-3 border-t border-white/5 pt-6">
          <h3 className="font-display font-bold text-lg text-white flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span>Formulas & Calculations</span>
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Baseline energy footprints are shared: the total monthly electricity and natural gas emissions are divided by your household size to show your personalized footprint fraction. Recommendations are ranked using a personalized weighting system:
          </p>
          <code className="block p-4 rounded-xl bg-slate-950 text-emerald-300 text-xs font-mono leading-normal">
            Score = (HighestCategoryMatch * 4.0) + (BudgetSensitivityMatch * 3.0) + (GoalMatch * 3.0) + (EaseOfAdoption * 0.1) + (ImpactScore * 0.1)
          </code>
        </div>
      </div>
    </div>
  );
}
