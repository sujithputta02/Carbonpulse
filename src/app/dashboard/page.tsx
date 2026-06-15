import React from "react";
import { getDashboardData } from "../actions";
import { getCurrentUser } from "@/utils/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch data on the server
  const data = await getDashboardData();

  return (
    <DashboardClient
      initialProfile={data.profile}
      initialLogs={data.logs}
      initialGoals={data.goals}
      initialFactors={data.factors}
    />
  );
}
