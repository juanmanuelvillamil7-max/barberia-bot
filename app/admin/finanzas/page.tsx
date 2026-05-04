"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { FinanceData, Expense } from "@/types";

const FinanceChart = dynamic(() => import("@/components/admin/FinanceChart"), {
  ssr: false,
  loading: () => <div style={{ height: 220, background: "var(--dust)" }} />,
});

type Period = "today" | "week" | "month";
const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function formatDate(d: string) {
  const dt = new Date(`${d}T12:00:00`);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

const CATEGORIES = ["Productos", "Equipamiento", "Alquiler", "Servicios", "Otro"];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "0.62rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--stone)",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.45rem 0",
  border: "none",
  borderBottom: "1px solid var(--dust)",
  background: "transparent",
  fontFamily: "var(--font-body)",
  fontSize: "0.9rem",
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

export default function FinanzasPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<FinanceData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: "", description: "", category: "Productos", date: new Date().toISOString().split("T")[0] });
  const [savingExpense, setSavingExpense] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incomeRes, expenseRes] = await Promise.all([
        fetch(`/api/admin/finances?period=${period}`),
        fetch(`/api/admin/expenses?period=${period}`),
      ]);
      const [income, exp] = await Promise.all([incomeRes.json(), expenseRes.json()]);
      setData(income);
      setExpenses(exp.expenses ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return;
    setSavingExpense(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(expenseForm.amount), description: expenseForm.description, category: expenseForm.category, date: expenseForm.date }),
      });
      const json = await res.json();
      if (res.ok) {
        setExpenses((prev) => [json.expense, ...prev]);
        setExpenseForm({ amount: "", description: "", category: "Productos", date: new Date().toISOString().split("T")[0] });
        setShowExpenseForm(false);
      }
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm("¿Eliminar este egreso?")) return;
    await fetch(`/api/admin/expenses?id=${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const totalIngresos = data?.totalPeriodo ?? 0;
  const totalEgresos = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
            Contabilidad
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
            Finanzas
          </h1>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: "4px" }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "0.4rem 0.75rem",
                background: period === p.value ? "var(--ink)" : "transparent",
                color: period === p.value ? "var(--cream)" : "var(--stone)",
                border: `1px solid ${period === p.value ? "var(--ink)" : "var(--dust)"}`,
                fontFamily: "var(--font-body)",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Cargando…</p>
      ) : (
        <>
          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--dust)", border: "1px solid var(--dust)", marginBottom: "2.5rem" }}>
            {[
              { label: "Ingresos", value: totalIngresos, color: "var(--ink)" },
              { label: "Egresos", value: totalEgresos, color: "var(--stone)" },
              { label: "Balance", value: balance, color: balance >= 0 ? "var(--ink)" : "#991b1b" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "var(--cream)", padding: "1.25rem 1.5rem" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
                  {stat.label}
                </p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 300, color: stat.color, margin: 0, lineHeight: 1 }}>
                  ${stat.value.toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>

          {/* Income chart */}
          {data && data.ingresosPorDia.length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1rem" }}>
                Ingresos por día (turnos completados)
              </p>
              <FinanceChart data={data.ingresosPorDia} />
            </div>
          )}

          {/* Service breakdown */}
          {data && data.desglosePorServicio.length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1rem" }}>
                Por servicio
              </p>
              <div style={{ borderTop: "1px solid var(--dust)" }}>
                {data.desglosePorServicio.map((row) => (
                  <div key={row.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.85rem 0", borderBottom: "1px solid var(--dust)" }}>
                    <div>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 400, color: "var(--ink)" }}>{row.name}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--stone)", marginLeft: "0.75rem" }}>{row.count} {row.count === 1 ? "turno" : "turnos"}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 400, color: "var(--ink)" }}>
                      ${row.total.toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", margin: 0 }}>
                Egresos
              </p>
              <button
                onClick={() => setShowExpenseForm((v) => !v)}
                style={{
                  padding: "0.45rem 0.9rem",
                  background: showExpenseForm ? "var(--ink)" : "#B8922A",
                  color: "#fff",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {showExpenseForm ? "Cancelar" : "Nuevo egreso"}
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} style={{ borderTop: "1px solid var(--dust)", paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>Monto ($)</label>
                    <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha</label>
                    <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} required style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Descripción</label>
                  <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ej: Pomada para el pelo" required style={inputStyle} />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={labelStyle}>Categoría</label>
                  <select value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={savingExpense} style={{ padding: "0.75rem 1.5rem", background: "#B8922A", color: "#fff", border: "none", fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: savingExpense ? "not-allowed" : "pointer" }}>
                  {savingExpense ? "Guardando…" : "Guardar egreso"}
                </button>
              </form>
            )}

            {expenses.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Sin egresos en este período.</p>
            ) : (
              <div style={{ borderTop: "1px solid var(--dust)" }}>
                {expenses.map((exp) => (
                  <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.85rem 0", borderBottom: "1px solid var(--dust)" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 400, color: "var(--ink)", margin: "0 0 0.15rem" }}>{exp.description}</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", margin: 0 }}>
                        {exp.category} · {formatDate(exp.date)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--ink)" }}>
                        ${Number(exp.amount).toLocaleString("es-AR")}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 }}
                      >
                        Eliminar
                      </button>
                    </div>
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
