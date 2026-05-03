import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const durationStr = searchParams.get("duration");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid date parameter (expected YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const duration = durationStr ? parseInt(durationStr, 10) : 30;
  if (isNaN(duration) || duration <= 0) {
    return NextResponse.json(
      { error: "Invalid duration parameter" },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(date, duration);
    return NextResponse.json({ date, duration, slots });
  } catch (err) {
    console.error("GET /api/availability error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
