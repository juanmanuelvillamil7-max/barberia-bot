"use client";

import { useState } from "react";
import AppointmentList from "@/components/admin/AppointmentList";
import type { AdminStats } from "@/types";

type TodayAppt = AdminStats["turnosDeHoy"][0];

interface FullAppt extends TodayAppt {
  id: string;
  services: { name: string; price: number } | null;
}

interface AppointmentListWrapperProps {
  initialAppointments: TodayAppt[];
}

export default function AppointmentListWrapper({
  initialAppointments,
}: AppointmentListWrapperProps) {
  const [appointments, setAppointments] = useState<FullAppt[]>(
    initialAppointments.map((a, i) => ({
      ...a,
      id: `placeholder-${i}`,
      services: a.service_name
        ? { name: a.service_name, price: a.price }
        : null,
    }))
  );

  async function handleComplete(id: string) {
    const res = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });

    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a))
      );
    }
  }

  return <AppointmentList appointments={appointments} onComplete={handleComplete} />;
}
