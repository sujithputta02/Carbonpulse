import React from "react";
import { getCurrentUser } from "@/utils/auth";
import { redirect } from "next/navigation";
import TrackClient from "./TrackClient";

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <TrackClient />;
}
