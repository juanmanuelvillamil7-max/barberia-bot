"use client";

import { useState, useEffect } from "react";
import ServiceForm from "@/components/admin/ServiceForm";
import type { Service, ServiceFormData } from "@/types";

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      setServices(data.services ?? []);
    } catch (err) {
      console.error("loadServices error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleSave(formData: ServiceFormData) {
    if (editingService) {
      await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingService.id, ...formData }),
      });
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setEditingService(null);
    setShowForm(false);
    await loadServices();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    await loadServices();
  }

  function openCreate() {
    setEditingService(null);
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setShowForm(true);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
            Gestión
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
            Servicios
          </h1>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: "0.65rem 1.25rem",
            background: "#B8922A",
            color: "#ffffff",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Nuevo servicio
        </button>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
          Cargando servicios…
        </p>
      ) : services.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
          Sin servicios. Creá uno nuevo.
        </p>
      ) : (
        <div style={{ borderTop: "1px solid var(--dust)" }}>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 0",
                borderBottom: "1px solid var(--dust)",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.2rem" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 400, color: "var(--ink)", margin: 0 }}>
                    {service.name}
                  </p>
                  {!service.active && (
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.55rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--stone)",
                      border: "1px solid var(--dust)",
                      padding: "0.15rem 0.4rem",
                    }}>
                      Inactivo
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)", margin: 0 }}>
                  {service.duration_minutes} min · ${service.price.toLocaleString("es-AR")}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => openEdit(service)}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--stone)",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ink)",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}
