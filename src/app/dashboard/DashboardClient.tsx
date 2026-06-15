"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteActivityAction, toggleGoalCompletionAction, logActivity } from "@/app/actions";
import { getRecommendedTips, ScoredTip } from "@/utils/recommender";
import { UserProfile, ActivityLog, Goal, EmissionFactor } from "@/utils/db";
import { calculateBaseline } from "@/utils/calculator";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { 
  Leaf, Car, Zap, ShoppingBag, Trash2, CheckCircle2, 
  TrendingUp, Award, Calendar, AlertCircle, ArrowRight, Loader2
} from "lucide-react";

interface DashboardClientProps {
  initialProfile: UserProfile | null;
  initialLogs: ActivityLog[];
  initialGoals: Goal[];
  initialFactors: EmissionFactor[];
}

export default function DashboardClient({
  initialProfile,
  initialLogs,
  initialGoals,
  initialFactors,
}: DashboardClientProps) {
  const router = useRouter();
  const [profile] = useState<UserProfile | null>(initialProfile);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [factors] = useState<EmissionFactor[]>(initialFactors);
  
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // If no profile, show onboarding prompt
  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <Leaf className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl text-white">Setup Your Footprint</h2>
          <p className="text-gray-400 text-sm">
            You haven&apos;t calculated your carbon footprint baseline yet. Get started with our quick 1-minute profile builder.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#090d16] font-display font-bold hover:scale-105 transition-transform"
        >
          Begin Onboarding
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Calculate user baseline category splits
  // The baseline profile stores the aggregate total baselineFootprint.
  // We reconstruct the breakdown for visualization.
  // We can estimate these by running the calculator against their profile settings.
  const getProfileBreakdown = () => {
    // Estimate distances & electricity based on typical values for their questionnaire choices
    const commuteDistanceWeekly = profile.commuteType === "NONE" ? 0 : 100;
    const electricityMonthlyKwh = 250;
    const naturalGasMonthlyKwh = 50;
    const shoppingPattern = profile.dietPattern === "HIGH_MEAT" ? "HEAVY" as const : "MODERATE" as const;

    return calculateBaseline({
      commuteType: profile.commuteType,
      commuteDistanceWeekly,
      dietPattern: profile.dietPattern,
      electricityMonthlyKwh,
      naturalGasMonthlyKwh,
      householdSize: profile.householdSize,
      shoppingPattern,
    }, factors);
  };

  const breakdown = getProfileBreakdown();

  // Get recommendations
  const recommendations = getRecommendedTips(profile, breakdown);
  const primaryTip = recommendations[0];

  // Sum tracked emissions in the current month
  const currentMonthLogs = logs.filter((log) => {
    const d = new Date(log.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalTrackedMonth = currentMonthLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);

  // Compute logging streak
  const getStreak = () => {
    if (logs.length === 0) return 0;
    const dates = logs.map((l) => l.date.split("T")[0]);
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const logDateStr = uniqueDates[i];
      const diffTime = Math.abs(checkDate.getTime() - new Date(logDateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If the log is today or yesterday, increment streak and advance checkDate
      if (diffDays <= 2) {
        streak++;
        checkDate = new Date(logDateStr);
      } else {
        break;
      }
    }
    return streak;
  };

  const streakCount = getStreak();

  // Handle deleting an activity
  const handleDeleteActivity = async (id: string) => {
    setActionLoading(`delete_${id}`);
    try {
      const ok = await deleteActivityAction(id);
      if (ok) {
        setLogs((prev) => prev.filter((log) => log.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggling goal completion
  const handleToggleGoal = async (id: string, currentStatus: boolean) => {
    setActionLoading(`goal_${id}`);
    try {
      const updated = await toggleGoalCompletionAction(id, !currentStatus);
      if (updated) {
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isCompleted: updated.isCompleted } : g))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Pin a recommendation as a goal
  const handlePinRecommendation = async (tip: ScoredTip) => {
    setActionLoading(`pin_${tip.id}`);
    try {
      // Let's simulate adding the goal to db
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        userId: profile.id,
        title: tip.title,
        category: tip.category,
        targetCO2e: tip.potentialSavingsCO2e,
        isCompleted: false,
        streakCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      // Save locally
      const stored = localStorage.getItem("carbonpulse_db");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.goals.push(newGoal);
        localStorage.setItem("carbonpulse_db", JSON.stringify(parsed));
      }
      
      // Update local state
      setGoals((prev) => [...prev, newGoal]);
      
      // Refresh the page data
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Quick log the recommended tip action
  const handleQuickLogTip = async (tip: ScoredTip) => {
    setActionLoading(`quicklog_${tip.id}`);
    try {
      let actionType = "VEGAN_MEAL";
      let amount = 1;
      const category = tip.category;

      if (tip.id === "tip_walk_cycle") {
        actionType = "EV";
        amount = 10; // 10 km walking instead of driving
      } else if (tip.id === "tip_meatless_day") {
        actionType = "VEGGIE_MEAL";
        amount = 3; // 3 meals vegetarian
      } else if (tip.id === "tip_cold_wash") {
        actionType = "ELECTRICITY";
        amount = 2; // saved 2 kWh
      }

      const newLog = await logActivity({
        category,
        actionType,
        amount,
      });

      setLogs((prev) => [newLog, ...prev]);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // Donut chart colors
  const COLORS = {
    transport: "#10b981", // Emerald
    food: "#06b6d4",      // Cyan
    energy: "#f59e0b",    // Amber
    shopping: "#a855f7",  // Purple
  };

  const donutData = [
    { name: "Transport", value: breakdown.transport, color: COLORS.transport },
    { name: "Food", value: breakdown.food, color: COLORS.food },
    { name: "Home Energy", value: breakdown.energy, color: COLORS.energy },
    { name: "Shopping", value: breakdown.shopping, color: COLORS.shopping },
  ];

  // Weekly logged data helper (past 4 weeks)
  const getWeeklyEmissions = () => {
    const weeklyData = [
      { week: "Week 4", transport: 0, food: 0, energy: 0, shopping: 0 },
      { week: "Week 3", transport: 0, food: 0, energy: 0, shopping: 0 },
      { week: "Week 2", transport: 0, food: 0, energy: 0, shopping: 0 },
      { week: "This Week", transport: 0, food: 0, energy: 0, shopping: 0 },
    ];
    
    const now = new Date();
    
    logs.forEach((log) => {
      const logDate = new Date(log.date);
      const diffMs = now.getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      let index = -1;
      if (diffDays <= 7) index = 3;
      else if (diffDays <= 14) index = 2;
      else if (diffDays <= 21) index = 1;
      else if (diffDays <= 28) index = 0;
      
      if (index !== -1) {
        const cat = log.category.toLowerCase();
        if (cat === "transport") weeklyData[index].transport += log.estimatedCO2e;
        else if (cat === "food") weeklyData[index].food += log.estimatedCO2e;
        else if (cat === "energy") weeklyData[index].energy += log.estimatedCO2e;
        else if (cat === "shopping") weeklyData[index].shopping += log.estimatedCO2e;
      }
    });

    // Round values
    return weeklyData.map(w => ({
      ...w,
      transport: Math.round(w.transport),
      food: Math.round(w.food),
      energy: Math.round(w.energy),
      shopping: Math.round(w.shopping),
    }));
  };

  const weeklyChartData = getWeeklyEmissions();

  // Get icon by category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TRANSPORT": return <Car className="h-4 w-4 text-emerald-400" />;
      case "FOOD": return <Leaf className="h-4 w-4 text-cyan-400" />;
      case "ENERGY": return <Zap className="h-4 w-4 text-amber-400" />;
      case "SHOPPING": return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      default: return <Leaf className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white">Welcome back, {profile.name}</h1>
          <p className="text-sm text-gray-400">Here is your customized carbon coach & footprint pulse.</p>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-slate-900 border border-white/5 rounded-2xl p-3 shadow-inner">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span className="font-medium text-gray-300">Tracking Month: <strong className="text-white">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</strong></span>
        </div>
      </div>

      {/* 2. Primary Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Footprint Card */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Baseline Footprint</span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            {Math.round(profile.baselineFootprint)}
            <span className="text-xs font-normal text-gray-500 ml-1">kg CO₂e/mo</span>
          </span>
          <p className="text-[10px] text-gray-400">Calculated from onboarding profile</p>
        </div>

        {/* Tracked This Month Card */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tracked This Month</span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            {Math.round(totalTrackedMonth)}
            <span className="text-xs font-normal text-gray-500 ml-1">kg CO₂e</span>
          </span>
          <p className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 mr-0.5" />
            <span>Active tracking is live</span>
          </p>
        </div>

        {/* Goals Progress Card */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Goals</span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            {goals.filter(g => !g.isCompleted).length}
            <span className="text-xs font-normal text-gray-500 ml-1">pending</span>
          </span>
          <p className="text-[10px] text-gray-400">
            {goals.filter(g => g.isCompleted).length} goals completed so far
          </p>
        </div>

        {/* Streaks Card */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col space-y-2 border-white/5 relative overflow-hidden">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Logging Streak</span>
          <span className="font-display font-extrabold text-2xl sm:text-3xl text-white flex items-center space-x-2">
            <Award className="h-6 w-6 text-amber-400 shrink-0" />
            <span>{streakCount} {streakCount === 1 ? 'day' : 'days'}</span>
          </span>
          <p className="text-[10px] text-gray-400">Log presets daily to grow your badge</p>
        </div>
      </div>

      {/* 3. Primary Coach Recommendation Card */}
      {primaryTip && (
        <section className="glass-panel rounded-3xl p-6 sm:p-8 border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-950/70 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl text-left">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                <Leaf className="h-3.5 w-3.5" />
                <span>Coach Recommendation</span>
              </div>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">{primaryTip.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{primaryTip.reason}</p>
              
              {/* Impact / Effort / Cost badges */}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/10">
                  Carbon Impact: {primaryTip.impactScore}/10
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/10">
                  Ease of Adoption: {primaryTip.effortScore}/10
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/10">
                  {primaryTip.costScore >= 9 ? "Saves Money" : "Investment Option"}
                </span>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto">
              <button
                disabled={actionLoading !== null}
                onClick={() => handleQuickLogTip(primaryTip)}
                className="flex-1 md:w-44 inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-emerald-500 text-[#090d16] hover:bg-emerald-400 font-display transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {actionLoading === `quicklog_${primaryTip.id}` ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Log Action Now"
                )}
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={() => handlePinRecommendation(primaryTip)}
                className="flex-1 md:w-44 inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                Pin to Goals
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Charts Section */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Category Split Donut Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-white">Baseline Breakdown</h3>
            <span className="text-[10px] uppercase font-semibold text-gray-500">Categories</span>
          </div>

          <div className="h-64 w-full relative min-w-0">
            {mounted ? (
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 256 }}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#090d16", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>
            )}

            {/* Middle Total Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total</span>
              <span className="font-display font-extrabold text-2xl text-white">
                {Math.round(breakdown.total)}
              </span>
              <span className="text-[10px] text-gray-500 block">kg CO₂e</span>
            </div>
          </div>

          {/* Underlay accessibility table */}
          <div className="sr-only">
            <h4>Carbon Footprint Category Breakdown</h4>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Emissions (kg CO2e)</th>
                </tr>
              </thead>
              <tbody>
                {donutData.map((d) => (
                  <tr key={d.name}>
                    <td>{d.name}</td>
                    <td>{Math.round(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custom Labels List */}
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-4">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                <span className="text-gray-300">{d.name}:</span>
                <span className="font-semibold text-white ml-auto">{Math.round(d.value)} kg</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Logged Chart (3 cols) */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-white">Emissions Tracked over Time</h3>
            <span className="text-[10px] uppercase font-semibold text-gray-500">Last 4 Weeks</span>
          </div>

          <div className="h-64 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="99%" height={256} minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 256 }}>
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#090d16", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="transport" name="Transport" stackId="a" fill={COLORS.transport} />
                  <Bar dataKey="food" name="Food" stackId="a" fill={COLORS.food} />
                  <Bar dataKey="energy" name="Energy" stackId="a" fill={COLORS.energy} />
                  <Bar dataKey="shopping" name="Shopping" stackId="a" fill={COLORS.shopping} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>
            )}
          </div>

          {/* Accessibility details */}
          <div className="sr-only">
            <h4>Weekly Logged Footprint Trends (Last 4 Weeks)</h4>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Transport</th>
                  <th>Food</th>
                  <th>Energy</th>
                  <th>Shopping</th>
                </tr>
              </thead>
              <tbody>
                {weeklyChartData.map((row) => (
                  <tr key={row.week}>
                    <td>{row.week}</td>
                    <td>{row.transport}</td>
                    <td>{row.food}</td>
                    <td>{row.energy}</td>
                    <td>{row.shopping}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Lower Content: Goals & Recent Activity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Goals Checklist */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-white">Active Goals</h3>
            <span className="text-xs text-gray-400 font-semibold">{goals.filter(g => g.isCompleted).length}/{goals.length} Done</span>
          </div>

          {goals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <CheckCircle2 className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm">No active goals pinned. Select suggestions from the insights tab to build habits.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal.id, goal.isCompleted)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-white/5 ${
                    goal.isCompleted
                      ? "bg-emerald-500/5 border-emerald-500/30 text-gray-400"
                      : "bg-slate-900 border-white/5 text-white"
                  }`}
                >
                  <div className="space-y-1">
                    <span className={`text-sm font-semibold block ${goal.isCompleted ? "line-through text-gray-500" : ""}`}>
                      {goal.title}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Target monthly savings: {goal.targetCO2e} kg CO₂e
                    </span>
                  </div>

                  <div className="shrink-0">
                    {goal.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/10" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-white/20 hover:border-emerald-500 transition-colors"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-lg text-white">Recent Log History</h3>
            <Link href="/history" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
              View All
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <AlertCircle className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm">No activities logged yet.</p>
              <Link href="/track" className="mt-4 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20">
                Log First Activity
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {getCategoryIcon(log.category)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block capitalize">
                        {log.actionType.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        {log.amount} units logged • {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-white whitespace-nowrap">
                      +{Math.round(log.estimatedCO2e)} kg
                    </span>
                    <button
                      disabled={actionLoading === `delete_${log.id}`}
                      onClick={() => handleDeleteActivity(log.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete activity"
                    >
                      {actionLoading === `delete_${log.id}` ? (
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
