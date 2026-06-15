import { ActivityLog, Goal } from "@/types/activity";
import { UserProfile } from "@/types/user";
import { Tip, ScoredTip, DynamicInsight } from "@/types/recommendation";

/**
 * Compares current week's tracked emissions against the previous week's emissions.
 */
export function generateWeeklyInsight(logs: ActivityLog[]): DynamicInsight {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const currentWeekLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    const diffDays = (now.getTime() - logDate.getTime()) / oneDay;
    return diffDays >= 0 && diffDays <= 7;
  });

  const prevWeekLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    const diffDays = (now.getTime() - logDate.getTime()) / oneDay;
    return diffDays > 7 && diffDays <= 14;
  });

  const currentSum = currentWeekLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);
  const prevSum = prevWeekLogs.reduce((sum, log) => sum + log.estimatedCO2e, 0);

  if (prevSum === 0) {
    if (currentSum === 0) {
      return {
        trendMessage: "No activity logs tracked yet.",
        percentChange: 0,
        direction: "FLAT",
        explanation: "Log your daily transport, meals, or home energy activities to see your weekly footprint trend.",
      };
    }
    return {
      trendMessage: "Active tracking started this week!",
      percentChange: 0,
      direction: "DOWN",
      explanation: `You've logged ${Math.round(currentSum)} kg CO2e in the last 7 days. Keep logging to establish a weekly trend.`,
    };
  }

  const diff = currentSum - prevSum;
  const percentChange = Math.round((Math.abs(diff) / prevSum) * 100);
  const direction = diff > 0 ? "UP" : diff < 0 ? "DOWN" : "FLAT";

  // Identify source of changes
  const getCategorySum = (logsList: ActivityLog[], category: string) => 
    logsList.filter(l => l.category === category).reduce((s, l) => s + l.estimatedCO2e, 0);

  let largestSource = "Transport";
  let maxDiff = 0;
  const categories = ["TRANSPORT", "FOOD", "ENERGY", "SHOPPING"];
  for (const cat of categories) {
    const catDiff = Math.abs(getCategorySum(currentWeekLogs, cat) - getCategorySum(prevWeekLogs, cat));
    if (catDiff > maxDiff) {
      maxDiff = catDiff;
      largestSource = cat.toLowerCase();
    }
  }

  let trendMessage = "";
  let explanation = "";

  if (direction === "UP") {
    trendMessage = `Tracked emissions increased by ${percentChange}% this week.`;
    explanation = `The increase is primarily driven by your ${largestSource} activities. Consider swapping two single trips or switching to meat-free alternatives next week.`;
  } else if (direction === "DOWN") {
    trendMessage = `Tracked emissions decreased by ${percentChange}% this week!`;
    explanation = `Excellent job! Reduced logging or positive shifts in your ${largestSource} footprint helped shrink your climate impact.`;
  } else {
    trendMessage = "Tracked emissions remained flat this week.";
    explanation = "Your carbon output is stable. Try pinning a new high-impact goal from the insights panel to push it lower.";
  }

  return {
    trendMessage,
    percentChange,
    direction,
    explanation,
  };
}

/**
 * Generates personalized natural-language explanation explaining *why* a tip fits the user's context.
 */
export function generatePersonalizedExplanation(tip: Tip, profile: UserProfile, highestCategory: string): string {
  const isHighestCat = tip.category === highestCategory;
  
  // Custom explanation template matching budget, goals and category
  if (tip.id === "tip_walk_cycle") {
    if (profile.budgetSensitivity === "HIGH") {
      return "Since your budget is tight, walking or cycling for short commutes is 100% free and cuts down petrol costs immediately, directly reducing transport emissions.";
    }
    return `Transport is a significant part of your footprint. Walking or cycling for short commutes directly reduces your ${profile.commuteType.toLowerCase().replace(/_/g, " ")} emissions.`;
  }

  if (tip.id === "tip_carpool") {
    if (profile.goals.includes("SAVE_MONEY")) {
      return "Carpooling splits your fuel expenses in half while directly dividing your car commuting footprint. Fits your goal to save money.";
    }
    return "Commuting by car represents your primary travel footprint. Sharing a ride twice a week splits your solo drive emissions and cuts traffic strain.";
  }

  if (tip.id === "tip_public_transit") {
    return "Switching from a solo car drive to bus/train commutes is the single most effective transit behavior change. It lowers your passenger emissions by over 60%.";
  }

  if (tip.id === "tip_meatless_day") {
    if (profile.goals.includes("BUILD_HABITS")) {
      return "Eating meat-free just one day a week is a low-effort habit builder. It reduces your diet emissions by 10% without a major lifestyle shift.";
    }
    return "Livestock agriculture (especially beef) creates high methane. Skipping meat one day a week is a direct, measurable win for your food footprint.";
  }

  if (tip.id === "tip_vegetarian") {
    return "Transitioning to a vegetarian diet cuts your diet's carbon footprint in half. It is highly effective for reducing methane and land footprint.";
  }

  if (tip.id === "tip_vegan") {
    return "Adopting a plant-based diet offers the lowest possible agricultural footprint, saving up to 130 kg CO2e monthly compared to high-meat diets.";
  }

  if (tip.id === "tip_cold_wash") {
    return "Washing clothes in cold water is universally applicable. Heating water takes 90% of a washer's energy. Switching to cold cuts electric bills immediately.";
  }

  if (tip.id === "tip_thermostat") {
    return "Adjusting the thermostat by 2°F cuts your natural gas or electricity draw by 6-8%, lowering utility expenses and home energy emissions.";
  }

  if (tip.id === "tip_smart_thermostat") {
    return "Since your budget is flexible, upgrading to a smart thermostat optimizes climate control schedules while you sleep, automating home energy conservation.";
  }

  if (tip.id === "tip_secondhand") {
    if (profile.goals.includes("SAVE_MONEY")) {
      return "Buying pre-owned clothing and furniture saves money while stopping raw extraction and manufacturing emissions. Perfect circular match.";
    }
    return "Extending the lifespan of items by purchasing secondhand cuts lifecycle carbon by up to 70% per garment.";
  }

  if (tip.id === "tip_electronics") {
    return "Manufacturing smartphones and gadgets requires rare element mining. Keeping devices for 4 years instead of 2 cuts their manufacturing emissions in half.";
  }

  return tip.reason;
}

/**
 * Returns the highest ranked tip that is NOT already active in the goals list.
 */
export function getNextBestAction(tips: ScoredTip[], activeGoals: Goal[]): ScoredTip | null {
  const activeTitles = new Set(activeGoals.map(g => g.title));
  return tips.find(tip => !activeTitles.has(tip.title)) || null;
}

/**
 * Returns a science-based 'Why this matters' explanation for the user's highest category.
 */
export function getCategoryWhyItMatters(category: string): { title: string; explanation: string } {
  switch (category) {
    case "TRANSPORT":
      return {
        title: "Transport Carbon Dynamics",
        explanation: "Transportation is the leading source of greenhouse gases in industrialized nations, primarily due to burning petrol and diesel in internal combustion engines. Solo passenger car drives produce approximately 270g CO2e per kilometer, whereas shared buses produce under 80g, and electric vehicles charged on typical grids emit under 50g per km. Switching commutes is the highest impact footprint lever.",
      };
    case "FOOD":
      return {
        title: "Agricultural Carbon & Methane",
        explanation: "Food production accounts for over 26% of global greenhouse emissions. Ruminant animals (beef and lamb) produce methane via enteric fermentation—a gas with 28 times the warming potential of CO2 over a century. A high-meat diet produces over 7.2kg CO2e per day, whereas vegetarian and vegan diets emit 3.8kg and 2.8kg respectively. Shifting diets directly reduces land use and methane release.",
      };
    case "ENERGY":
      return {
        title: "Residential Energy & Grid Mix",
        explanation: "Home energy footprint is determined by natural gas heating and grid electricity mix. Fossil fuel combustion (coal/natural gas) generates heavy CO2 emissions. In typical grids, every kWh of electricity emits about 0.38kg CO2e. Adjusting temperatures by 2°F or switching laundry to cold washes cuts immediate draw and reduces peak grid load.",
      };
    case "SHOPPING":
      return {
        title: "Manufacturing & Supply Chain Lifecycle",
        explanation: "Every consumer product represents 'embodied carbon'—the sum of emissions from raw mineral extraction, supply chain logistics, high-heat factory assembly, and global transportation. A typical smartphone embodies 80kg of CO2e before it is unboxed. Prolonging device lifespans and purchasing pre-owned items halts the demand for new production and encourages circular economics.",
      };
    default:
      return {
        title: "Ecology & Climate Consciousness",
        explanation: "Small incremental modifications in daily choices compound into significant structural carbon reductions. Tracking activities builds continuous awareness, leading to persistent behavioral shifts.",
      };
  }
}
