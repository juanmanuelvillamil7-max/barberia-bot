"use client";

import type { Service } from "@/types";

interface ServiceSelectorProps {
  services: Service[];
  selected: Service | null;
  onSelect: (service: Service) => void;
}

export default function ServiceSelector({ services, selected, onSelect }: ServiceSelectorProps) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
        Seleccioná un servicio
      </p>

      <div style={{ borderTop: "1px solid var(--dust)" }}>
        {services.map((service) => {
          const isSelected = selected?.id === service.id;
          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 0",
                borderBottom: "1px solid var(--dust)",
                background: isSelected ? "var(--ink)" : "transparent",
                border: "none",
                borderTop: "none",
                cursor: "pointer",
                textAlign: "left",
                marginLeft: isSelected ? "-1.25rem" : 0,
                marginRight: isSelected ? "-1.25rem" : 0,
                paddingLeft: isSelected ? "1.25rem" : 0,
                paddingRight: isSelected ? "1.25rem" : 0,
                transition: "background 0.2s",
                position: "relative",
              }}
            >
              {isSelected && (
                <div style={{ position: "absolute", bottom: 0, left: "1.25rem", right: "1.25rem", height: "1px", background: "var(--stone)" }} />
              )}
              <div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.2rem",
                  fontWeight: 400,
                  color: isSelected ? "var(--cream)" : "var(--ink)",
                  lineHeight: 1.2,
                  marginBottom: "0.2rem",
                }}>
                  {service.name}
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isSelected ? "var(--rule)" : "var(--stone)",
                }}>
                  {service.duration_minutes} min
                </p>
              </div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 300,
                color: isSelected ? "var(--cream)" : "var(--ink)",
                whiteSpace: "nowrap",
                marginLeft: "1rem",
              }}>
                ${service.price.toLocaleString("es-AR")}
              </p>
            </button>
          );
        })}
      </div>

      {services.length === 0 && (
        <p style={{ color: "var(--stone)", fontSize: "0.9rem", padding: "2rem 0" }}>
          Cargando servicios…
        </p>
      )}
    </div>
  );
}
