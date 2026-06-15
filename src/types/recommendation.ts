import { UserProfile } from "./user";
import { CategoryType } from "./activity";

export interface Tip {
  id: string;
  title: string;
  category: CategoryType;
  reason: string;
  impactScore: number; // 1-10 (carbon savings level)
  effortScore: number; // 1-10 (10 being easiest)
  costScore: number; // 1-10 (10 being saves most money)
  potentialSavingsCO2e: number; // estimated monthly kg CO2e saved
  applicabilityRule: (
    profile: UserProfile,
    categoryBreakdown: { transport: number; food: number; energy: number; shopping: number }
  ) => boolean;
}

export interface ScoredTip extends Tip {
  score: number;
}

export interface DynamicInsight {
  trendMessage: string;
  percentChange: number;
  direction: "UP" | "DOWN" | "FLAT";
  explanation: string;
}
