"use client";

import { usePathname, useRouter } from "next/navigation";
import { BARBERIA_CONFIG } from "@/lib/config";

const navLinks = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/turnos", label: "Turnos" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/chats", label: "Chats" },
  { href: "/admin/finanzas", label: "Finanzas" },
  { href: "/admin/servicios", label: "Servicios" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "200px",
          height: "100vh",
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
        className="desktop-sidebar"
      >
        <div style={{ padding: "1.75rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--stone)", margin: "0 0 0.3rem" }}>
            Panel
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 300, color: "var(--cream)", margin: 0 }}>
            {BARBERIA_CONFIG.nombre}
          </h1>
        </div>

        <nav style={{ flex: 1, padding: "1.25rem 0" }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  padding: "0.65rem 1.5rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: isActive ? "var(--cream)" : "var(--stone)",
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  borderLeft: isActive ? "1px solid var(--cream)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--stone)",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Salir
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--ink)",
          display: "flex",
          justifyContent: "space-around",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          zIndex: 100,
          padding: "0.65rem 0",
        }}
        className="mobile-bottom-nav"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: isActive ? "var(--cream)" : "var(--stone)",
                textDecoration: "none",
                padding: "0.25rem 0.5rem",
              }}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) { .mobile-bottom-nav { display: none !important; } }
        @media (max-width: 767px) { .desktop-sidebar { display: none !important; } }
      `}</style>
    </>
  );
}
