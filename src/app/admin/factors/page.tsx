import React from "react";
import { getDashboardData } from "@/app/actions";
import { getCurrentUser } from "@/utils/auth";
import { redirect } from "next/navigation";
import { db } from "@/utils/db";
import FactorsClient from "./FactorsClient";

export const dynamic = "force-dynamic";

export default async function FactorsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();
  const auditLogs = db.getAuditLogs();

  return (
    <FactorsClient
      initialFactors={data.factors}
      initialAuditLogs={auditLogs}
    />
  );
}
