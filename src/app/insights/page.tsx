import React from "react";
import { getDashboardData } from "../actions";
import { getCurrentUser } from "@/utils/auth";
import { redirect } from "next/navigation";
import InsightsClient from "./InsightsClient";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <InsightsClient
      profile={data.profile}
      logs={data.logs}
      goals={data.goals}
      factors={data.factors}
    />
  );
}
