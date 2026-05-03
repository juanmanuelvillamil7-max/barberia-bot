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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
          Servicios
        </h1>
        <button
          onClick={openCreate}
          style={{
            padding: "0.6rem 1rem",
            background: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
          Cargando servicios...
        </div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", background: "#f9fafb", borderRadius: "0.75rem", color: "#6b7280" }}>
          No hay servicios. Creá uno nuevo.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "#111827" }}>
                    {service.name}
                  </p>
                  {!service.active && (
                    <span
                      style={{
                        background: "#f3f4f6",
                        color: "#6b7280",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "999px",
                        textTransform: "uppercase",
                      }}
                    >
                      Inactivo
                    </span>
                  )}
                </div>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
                  {service.duration_minutes} min · ${service.price.toLocaleString("es-AR")}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => openEdit(service)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    color: "#374151",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "#fef2f2",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    color: "#991b1b",
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
