"use client";

import { useState, useEffect } from "react";
import type { Service, ServiceFormData } from "@/types";

interface ServiceFormProps {
  service?: Service | null;
  onSave: (data: ServiceFormData) => Promise<void>;
  onClose: () => void;
}

export default function ServiceForm({ service, onSave, onClose }: ServiceFormProps) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDuration(service.duration_minutes.toString());
      setPrice(service.price.toString());
      setActive(service.active);
    } else {
      setName("");
      setDuration("30");
      setPrice("");
      setActive(true);
    }
  }, [service]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Requerido";
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur <= 0) newErrors.duration = "Duración inválida";
    const pr = parseFloat(price);
    if (isNaN(pr) || pr < 0) newErrors.price = "Precio inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        duration_minutes: parseInt(duration, 10),
        price: parseFloat(price),
        active,
      });
      onClose();
    } catch (err) {
      console.error("ServiceForm save error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "440px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
            {service ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#6b7280" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Nombre" error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Corte de pelo"
              style={inputStyle(!!errors.name)}
            />
          </Field>

          <Field label="Duración (minutos)" error={errors.duration}>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="5"
              step="5"
              style={inputStyle(!!errors.duration)}
            />
          </Field>

          <Field label="Precio ($)" error={errors.price}>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="100"
              placeholder="5000"
              style={inputStyle(!!errors.price)}
            />
          </Field>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="active" style={{ fontSize: "0.9rem", color: "#374151", cursor: "pointer" }}>
              Servicio activo
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#f3f4f6",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: isLoading ? "#93c5fd" : "#3b82f6",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: isLoading ? "not-allowed" : "pointer",
                color: "#ffffff",
              }}
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "0.65rem 0.75rem",
    border: `1px solid ${hasError ? "#ef4444" : "#d1d5db"}`,
    borderRadius: "0.5rem",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  };
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{error}</p>}
    </div>
  );
}
