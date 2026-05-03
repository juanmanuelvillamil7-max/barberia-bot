export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import StatsCards from "@/components/admin/StatsCards";
import AppointmentListWrapper from "./AppointmentListWrapper";
import type { AdminStats } from "@/types";

async function fetchStats(token: string): Promise<AdminStats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: `sb-access-token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AdminDashboard() {
  // Fetch stats server-side using supabase directly
  const { supabase: adminStats } = await getStats();

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
        Dashboard
      </h1>

      {adminStats ? (
        <>
          <StatsCards stats={adminStats} />
          <div style={{ marginTop: "1.5rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
              Turnos de hoy
            </h2>
            <AppointmentListWrapper initialAppointments={adminStats.turnosDeHoy} />
          </div>
        </>
      ) : (
        <div
          style={{
            padding: "2rem",
            background: "#fef2f2",
            borderRadius: "0.75rem",
            color: "#991b1b",
            fontSize: "0.9rem",
          }}
        >
          Error al cargar estadísticas. Verificá la conexión a Supabase.
        </div>
      )}
    </div>
  );
}

async function getStats(): Promise<{ supabase: AdminStats | null }> {
  try {
    const supabaseClient = createSupabaseServerClient();

    const now = new Date();
    const tzOffset = -3;
    const localNow = new Date(now.getTime() + tzOffset * 60 * 60 * 1000);
    const today = localNow.toISOString().split("T")[0];

    const dayOfWeek = localNow.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(localNow);
    monday.setUTCDate(monday.getUTCDate() - daysToMonday);
    const weekStart = monday.toISOString().split("T")[0];

    const monthStart = `${today.substring(0, 7)}-01`;

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: allData } = await adminClient
      .from("appointments")
      .select("appointment_date, status, services(price, name), client_name, start_time, end_time")
      .neq("status", "cancelled")
      .gte("appointment_date", monthStart)
      .lte("appointment_date", today)
      .order("start_time");

    const rows = allData ?? [];

    type ServiceRow = { price: number; name: string } | null;
    const getPrice = (r: (typeof rows)[0]): number => {
      const svc = r.services as unknown as ServiceRow;
      return svc?.price ?? 0;
    };

    const todayRows = rows.filter((r) => r.appointment_date === today);
    const turnosHoy = todayRows.length;
    const ingresosHoy = todayRows.reduce((sum, r) => sum + getPrice(r), 0);

    const weekRows = rows.filter((r) => r.appointment_date >= weekStart);
    const turnosSemana = weekRows.length;

    const monthRows = rows;
    const ingresosMes = monthRows.reduce((sum, r) => sum + getPrice(r), 0);

    const lastMonthStart = new Date(localNow);
    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);
    const lastMonthStr = `${lastMonthStart.toISOString().substring(0, 7)}-01`;
    const lastMonthEnd = `${today.substring(0, 7)}-01`;

    const { data: lastMonthData } = await adminClient
      .from("appointments")
      .select("services(price)")
      .neq("status", "cancelled")
      .gte("appointment_date", lastMonthStr)
      .lt("appointment_date", lastMonthEnd);

    const ingresosMesAnterior = (lastMonthData ?? []).reduce((sum, r) => {
      const svc = r.services as unknown as ServiceRow;
      return sum + (svc?.price ?? 0);
    }, 0);

    const variacionMes =
      ingresosMesAnterior === 0
        ? null
        : Math.round(((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100);

    const turnosDeHoy = todayRows.map((r) => {
      const svc = r.services as unknown as ServiceRow;
      return {
        date: r.appointment_date,
        status: r.status as "confirmed" | "cancelled" | "completed",
        client_name: r.client_name,
        start_time: r.start_time,
        end_time: r.end_time,
        service_name: svc?.name ?? "",
        price: svc?.price ?? 0,
      };
    });

    void supabaseClient; // suppress unused warning

    return {
      supabase: {
        turnosHoy,
        ingresosHoy,
        turnosSemana,
        ingresosMes,
        variacionMes,
        turnosDeHoy,
      },
    };
  } catch (err) {
    console.error("getStats error:", err);
    return { supabase: null };
  }
}
