"use client";

import { useState, useEffect } from "react";
import type { ClientWithStats } from "@/types";

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatBirthday(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

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

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ full_name: "", email: "", phone: "", birthday: "" });
  const [creatingClient, setCreatingClient] = useState(false);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClients(); }, []);

  async function handleSaveBirthday(clientId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clientId, birthday: birthdayInput || null }),
      });
      if (res.ok) {
        setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, birthday: birthdayInput || null } : c));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.full_name.trim()) return;
    setCreatingClient(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newForm.full_name.trim(),
          email: newForm.email.trim() || undefined,
          phone: newForm.phone.trim() || undefined,
          birthday: newForm.birthday || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setClients((prev) => [{ ...data.client, total_cuts: 0, last_visit: null }, ...prev]);
        setNewForm({ full_name: "", email: "", phone: "", birthday: "" });
        setShowNewForm(false);
      }
    } finally {
      setCreatingClient(false);
    }
  }

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
            Base de datos
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
            Clientes
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--stone)" }}>
            {clients.length} registros
          </span>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            style={{
              padding: "0.65rem 1.25rem",
              background: showNewForm ? "var(--ink)" : "#B8922A",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {showNewForm ? "Cancelar" : "Nuevo cliente"}
          </button>
        </div>
      </div>

      {/* New client form */}
      {showNewForm && (
        <form onSubmit={handleCreateClient} style={{ borderTop: "1px solid var(--dust)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input type="text" value={newForm.full_name} onChange={(e) => setNewForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Juan Pérez" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="juan@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input type="tel" value={newForm.phone} onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))} placeholder="11 1234-5678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cumpleaños</label>
              <input type="date" value={newForm.birthday} onChange={(e) => setNewForm((f) => ({ ...f, birthday: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <button
            type="submit"
            disabled={creatingClient || !newForm.full_name.trim()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#B8922A",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: creatingClient ? "not-allowed" : "pointer",
            }}
          >
            {creatingClient ? "Guardando…" : "Guardar cliente"}
          </button>
        </form>
      )}

      {/* Search */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono…"
          style={inputStyle}
        />
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Cargando clientes…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
          {search ? "Sin resultados." : "Sin clientes registrados."}
        </p>
      ) : (
        <div style={{ borderTop: "1px solid var(--dust)" }}>
          {filtered.map((client) => {
            const isEditing = editingId === client.id;
            return (
              <div key={client.id} style={{ borderBottom: "1px solid var(--dust)", padding: "1.25rem 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                    {client.full_name}
                  </p>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 300, color: "var(--ink)", margin: 0, lineHeight: 1 }}>
                      {client.total_cuts}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--stone)", margin: "0.15rem 0 0" }}>
                      {client.total_cuts === 1 ? "corte" : "cortes"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                  {client.email && <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--stone)" }}>{client.email}</span>}
                  {client.phone && <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--stone)" }}>{client.phone}</span>}
                </div>

                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--rule)" }}>Última visita</span>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--stone)", margin: "0.1rem 0 0" }}>{formatDate(client.last_visit)}</p>
                  </div>

                  <div>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--rule)" }}>Cumpleaños</span>
                    {isEditing ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
                        <input
                          type="date"
                          value={birthdayInput}
                          onChange={(e) => setBirthdayInput(e.target.value)}
                          style={{ border: "none", borderBottom: "1px solid var(--ink)", background: "transparent", fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--ink)", outline: "none", padding: "0.1rem 0" }}
                        />
                        <button onClick={() => handleSaveBirthday(client.id)} disabled={saving} style={{ background: "var(--ink)", color: "var(--cream)", border: "none", fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0.25rem 0.6rem", cursor: saving ? "not-allowed" : "pointer" }}>
                          {saving ? "…" : "Guardar"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--stone)", margin: 0 }}>{formatBirthday(client.birthday)}</p>
                        <button onClick={() => { setEditingId(client.id); setBirthdayInput(client.birthday ?? ""); }} style={{ background: "none", border: "none", fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rule)", cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: "2px" }}>
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
