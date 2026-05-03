export const dynamic = "force-dynamic";

import type { AdminStats } from "@/types";
import { cookies } from "next/headers";

async function fetchStats(): Promise<AdminStats | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;
    if (!token) return null;

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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

    type ServiceRow = { price: number; name: string } | null;

    const { data: allData } = await adminClient
      .from("appointments")
      .select("appointment_date, status, services(price, name), client_name, start_time, end_time")
      .neq("status", "cancelled")
      .gte("appointment_date", monthStart)
      .lte("appointment_date", today)
      .order("start_time");

    const rows = allData ?? [];
    const getPrice = (r: (typeof rows)[0]) => (r.services as unknown as ServiceRow)?.price ?? 0;

    const todayRows = rows.filter((r) => r.appointment_date === today);
    const weekRows = rows.filter((r) => r.appointment_date >= weekStart);

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

    const ingresosMes = rows.reduce((s, r) => s + getPrice(r), 0);
    const ingresosMesAnterior = (lastMonthData ?? []).reduce((s, r) => {
      const svc = r.services as unknown as ServiceRow;
      return s + (svc?.price ?? 0);
    }, 0);

    const variacionMes = ingresosMesAnterior === 0
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

    return {
      turnosHoy: todayRows.length,
      ingresosHoy: todayRows.reduce((s, r) => s + getPrice(r), 0),
      turnosSemana: weekRows.length,
      ingresosMes,
      variacionMes,
      turnosDeHoy,
    };
  } catch (err) {
    console.error("fetchStats error:", err);
    return null;
  }
}

const STAT_LABELS: Record<string, string> = {
  turnosHoy: "Turnos hoy",
  ingresosHoy: "Ingresos hoy",
  turnosSemana: "Turnos semana",
  ingresosMes: "Ingresos mes",
};

export default async function AdminDashboard() {
  const stats = await fetchStats();

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
          Resumen
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {!stats ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)", borderLeft: "2px solid var(--dust)", paddingLeft: "0.75rem" }}>
          Error al cargar estadísticas.
        </p>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: "var(--dust)", border: "1px solid var(--dust)", marginBottom: "2.5rem" }}>
            {(["turnosHoy", "ingresosHoy", "turnosSemana", "ingresosMes"] as const).map((key) => {
              const raw = stats[key];
              const value = key.startsWith("ingresos")
                ? `$${(raw as number).toLocaleString("es-AR")}`
                : String(raw);
              const sub = key === "ingresosMes" && stats.variacionMes !== null
                ? `${stats.variacionMes >= 0 ? "+" : ""}${stats.variacionMes}% vs mes anterior`
                : null;
              return (
                <div key={key} style={{ background: "var(--cream)", padding: "1.25rem 1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
                    {STAT_LABELS[key]}
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 300, color: "var(--ink)", margin: 0, lineHeight: 1 }}>
                    {value}
                  </p>
                  {sub && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "var(--stone)", marginTop: "0.4rem" }}>
                      {sub}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Today's appointments */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.25rem" }}>
              Turnos de hoy
            </p>

            {stats.turnosDeHoy.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
                Sin turnos para hoy.
              </p>
            ) : (
              <div style={{ borderTop: "1px solid var(--dust)" }}>
                {stats.turnosDeHoy.map((appt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      padding: "0.9rem 0",
                      borderBottom: "1px solid var(--dust)",
                    }}
                  >
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 400, color: "var(--ink)", margin: "0 0 0.15rem" }}>
                        {appt.client_name}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", margin: 0 }}>
                        {appt.service_name} · {appt.start_time}hs
                      </p>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: appt.status === "completed" ? "var(--stone)" : "var(--ink)",
                      border: "1px solid var(--dust)",
                      padding: "0.2rem 0.5rem",
                    }}>
                      {appt.status === "completed" ? "Completado" : appt.status === "cancelled" ? "Cancelado" : "Confirmado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
