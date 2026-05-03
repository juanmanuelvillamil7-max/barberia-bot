import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";
import type { FinanceData } from "@/types";

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "week";

  try {
    const now = new Date();
    const tzOffset = -3;
    const localNow = new Date(now.getTime() + tzOffset * 60 * 60 * 1000);
    const today = localNow.toISOString().split("T")[0];

    let dateFrom: string;
    if (period === "today") {
      dateFrom = today;
    } else if (period === "week") {
      const d = new Date(localNow);
      d.setUTCDate(d.getUTCDate() - 6);
      dateFrom = d.toISOString().split("T")[0];
    } else {
      dateFrom = `${today.substring(0, 7)}-01`;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_date, services(id, name, price)")
      .neq("status", "cancelled")
      .gte("appointment_date", dateFrom)
      .lte("appointment_date", today)
      .order("appointment_date");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];
    type ServiceRef = { id: string; name: string; price: number } | null;

    const byDay: Record<string, number> = {};
    const byService: Record<string, { name: string; total: number; count: number }> = {};

    for (const row of rows) {
      const svc = row.services as unknown as ServiceRef;
      const price = svc?.price ?? 0;
      const date = row.appointment_date;
      byDay[date] = (byDay[date] ?? 0) + price;
      if (svc) {
        if (!byService[svc.id]) byService[svc.id] = { name: svc.name, total: 0, count: 0 };
        byService[svc.id].total += price;
        byService[svc.id].count += 1;
      }
    }

    const financeData: FinanceData = {
      period: period as "week" | "month" | "today",
      ingresosPorDia: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total })),
      desglosePorServicio: Object.values(byService).sort((a, b) => b.total - a.total),
      totalPeriodo: rows.reduce((sum, r) => sum + ((r.services as unknown as ServiceRef)?.price ?? 0), 0),
    };

    return NextResponse.json(financeData);
  } catch (err) {
    console.error("GET /api/admin/finances error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
