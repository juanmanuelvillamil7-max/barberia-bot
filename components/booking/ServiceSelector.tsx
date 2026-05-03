"use client";

import type { Service } from "@/types";

interface ServiceSelectorProps {
  services: Service[];
  selected: Service | null;
  onSelect: (service: Service) => void;
}

export default function ServiceSelector({
  services,
  selected,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
        ¿Qué servicio querés?
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
        }}
      >
        {services.map((service) => {
          const isSelected = selected?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              style={{
                padding: "1rem",
                border: `2px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
                borderRadius: "0.75rem",
                background: isSelected ? "#eff6ff" : "#ffffff",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: isSelected ? "#1d4ed8" : "#111827",
                }}
              >
                {service.name}
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                {service.duration_minutes} min
              </p>
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: isSelected ? "#1d4ed8" : "#374151",
                }}
              >
                ${service.price.toLocaleString("es-AR")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
