"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { FinanceData } from "@/types";

const FinanceChart = dynamic(
  () => import("@/components/admin/FinanceChart"),
  { ssr: false, loading: () => <div style={{ height: 280, background: "#f9fafb", borderRadius: "0.75rem" }} /> }
);

type Period = "today" | "week" | "month";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Última semana" },
  { value: "month", label: "Este mes" },
];

export default function FinanzasPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finances?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("loadFinanceData error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
        Finanzas
      </h1>

      {/* Period selector */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "#f3f4f6",
          padding: "0.25rem",
          borderRadius: "0.75rem",
          width: "fit-content",
        }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: "0.45rem 0.9rem",
              border: "none",
              borderRadius: "0.6rem",
              fontSize: "0.85rem",
              fontWeight: period === p.value ? 700 : 500,
              cursor: "pointer",
              background: period === p.value ? "#ffffff" : "transparent",
              color: period === p.value ? "#111827" : "#6b7280",
              boxShadow: period === p.value ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "background 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
          Cargando datos...
        </div>
      ) : data ? (
        <>
          {/* Total */}
          <div
            style={{
              background: "#111827",
              borderRadius: "0.75rem",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>
              Ingresos del período
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "2rem", fontWeight: 700, color: "#ffffff" }}>
              ${data.totalPeriodo.toLocaleString("es-AR")}
            </p>
          </div>

          {/* Chart */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
              Ingresos por día
            </h2>
            <FinanceChart data={data.ingresosPorDia} />
          </div>

          {/* Service breakdown */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1.25rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
              Desglose por servicio
            </h2>

            {data.desglosePorServicio.length === 0 ? (
              <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.9rem" }}>Sin datos.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Servicio", "Turnos", "Ingresos"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === "Servicio" ? "left" : "right",
                          padding: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.desglosePorServicio.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: "#111827", fontWeight: 500 }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: "#6b7280", textAlign: "right" }}>
                        {row.count}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem", color: "#111827", fontWeight: 600, textAlign: "right" }}>
                        ${row.total.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: "2rem", background: "#fef2f2", borderRadius: "0.75rem", color: "#991b1b" }}>
          Error al cargar los datos financieros.
        </div>
      )}
    </div>
  );
}
