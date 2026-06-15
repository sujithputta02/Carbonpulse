import React from "react";
import { getDashboardData } from "../actions";
import { getCurrentUser } from "@/utils/auth";
import { redirect } from "next/navigation";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <HistoryClient
      initialLogs={data.logs}
    />
  );
}
