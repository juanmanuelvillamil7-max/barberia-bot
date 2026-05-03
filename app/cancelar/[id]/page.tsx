export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CancelClient from "./CancelClient";

interface Props {
  params: { id: string };
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function CancelarPage({ params }: Props) {
  const { id } = params;

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, client_name, appointment_date, start_time, status, services(name, price)")
    .eq("id", id)
    .single();

  if (!appointment) {
    notFound();
  }

  const d = new Date(`${appointment.appointment_date}T12:00:00`);
  const displayDate = `${DAYS[d.getDay()]} ${d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  const svc = appointment.services as unknown as { name: string; price: number } | null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f4f4f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem", fontWeight: 700, color: "#111827" }}>
          Cancelar turno
        </h1>

        {appointment.status === "cancelled" ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "0.75rem",
              padding: "1rem",
              color: "#991b1b",
              fontSize: "0.9rem",
              marginTop: "1rem",
            }}
          >
            Este turno ya fue cancelado anteriormente.
          </div>
        ) : appointment.status === "completed" ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "0.75rem",
              padding: "1rem",
              color: "#065f46",
              fontSize: "0.9rem",
              marginTop: "1rem",
            }}
          >
            Este turno ya fue completado.
          </div>
        ) : (
          <CancelClient
            appointmentId={id}
            summary={{
              clientName: appointment.client_name,
              serviceName: svc?.name ?? "—",
              price: svc?.price ?? 0,
              displayDate,
              startTime: appointment.start_time.substring(0, 5),
            }}
          />
        )}
      </div>
    </div>
  );
}
