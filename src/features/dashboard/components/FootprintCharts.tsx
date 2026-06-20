import React from "react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { ActivityLog } from "@/types/activity";

interface FootprintChartsProps {
  breakdown: {
    total: number;
    transport: number;
    food: number;
    energy: number;
    shopping: number;
  };
  logs: ActivityLog[];
  mounted: boolean;
}

export default function FootprintCharts({
  breakdown,
  logs,
  mounted,
}: FootprintChartsProps) {
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

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Category Split Donut Chart (2 cols) */}
      <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-white/5 flex flex-col space-y-4">
        <div className="flex justify-between items-center text-left">
          <h2 className="font-display font-bold text-lg text-white">Baseline Breakdown</h2>
          <span className="text-[10px] uppercase font-semibold text-gray-500">Categories</span>
        </div>

        <div className="h-64 w-full relative min-w-0">
          {mounted ? (
            <div 
              role="img" 
              aria-label="Carbon footprint breakdown by category: Transport, Food, Home Energy, and Shopping. Interactive pie chart showing the distribution of your baseline emissions."
            >
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
            </div>
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
          <h4>Carbon Footprint Category Breakdown Table</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Emissions (kg CO₂e)</th>
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
        <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-4 text-left">
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
        <div className="flex justify-between items-center text-left">
          <h2 className="font-display font-bold text-lg text-white">Emissions Tracked over Time</h2>
          <span className="text-[10px] uppercase font-semibold text-gray-500">Last 4 Weeks</span>
        </div>

        <div className="h-64 w-full min-w-0">
          {mounted ? (
            <div 
              role="img" 
              aria-label="Weekly emissions tracked over the last 4 weeks across all categories: Transport, Food, Home Energy, and Shopping. Stacked bar chart showing trends in your carbon footprint over time."
            >
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
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">Loading chart...</div>
          )}
        </div>

        {/* Accessibility details */}
        <div className="sr-only">
          <h4>Weekly Logged Footprint Trends Table</h4>
          <table>
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Transport</th>
                <th scope="col">Food</th>
                <th scope="col">Energy</th>
                <th scope="col">Shopping</th>
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
  );
}
