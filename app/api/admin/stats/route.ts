import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AdminStats } from "@/types";

export async function GET() {
  // Verify admin session
  try {
    const serverClient = createSupabaseServerClient();
    const { data: { session } } = await serverClient.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tzOffset = -3; // America/Argentina/Buenos_Aires
    const localNow = new Date(now.getTime() + tzOffset * 60 * 60 * 1000);
    const today = localNow.toISOString().split("T")[0];

    // Start of week (Monday)
    const dayOfWeek = localNow.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(localNow);
    monday.setUTCDate(monday.getUTCDate() - daysToMonday);
    const weekStart = monday.toISOString().split("T")[0];

    // Start of month
    const monthStart = `${today.substring(0, 7)}-01`;

    // Fetch all relevant appointments
    const { data: allData } = await supabase
      .from("appointments")
      .select("appointment_date, status, services(price, name), client_name, start_time, end_time")
      .neq("status", "cancelled")
      .gte("appointment_date", monthStart)
      .lte("appointment_date", today)
      .order("appointment_date", { ascending: false });

    const rows = allData ?? [];

    // Today's appointments
    const todayRows = rows.filter((r) => r.appointment_date === today);
    const turnosHoy = todayRows.length;

    type ServiceRow = { price: number; name: string } | null;
    const getPrice = (r: typeof rows[0]): number => {
      const svc = r.services as unknown as ServiceRow;
      return svc?.price ?? 0;
    };

    const ingresosHoy = todayRows.reduce((sum, r) => sum + getPrice(r), 0);

    // This week
    const weekRows = rows.filter((r) => r.appointment_date >= weekStart);
    const turnosSemana = weekRows.length;

    // This month
    const monthRows = rows.filter((r) => r.appointment_date >= monthStart);
    const ingresosMes = monthRows.reduce((sum, r) => sum + getPrice(r), 0);

    // Last month variation
    const lastMonthStart = new Date(localNow);
    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);
    const lastMonthStr = `${lastMonthStart.toISOString().substring(0, 7)}-01`;
    const lastMonthEnd = `${today.substring(0, 7)}-01`;

    const { data: lastMonthData } = await supabase
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

    // Today's appointment list
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

    const stats: AdminStats = {
      turnosHoy,
      ingresosHoy,
      turnosSemana,
      ingresosMes,
      variacionMes,
      turnosDeHoy,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
