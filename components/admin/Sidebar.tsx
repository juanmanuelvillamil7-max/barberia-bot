"use client";

import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { BARBERIA_CONFIG } from "@/lib/config";

const navLinks = [
  { href: "/admin", label: "Inicio", icon: "🏠" },
  { href: "/admin/turnos", label: "Turnos", icon: "📅" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/admin/servicios", label: "Servicios", icon: "✂️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "220px",
          height: "100vh",
          background: "#111827",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid #1f2937" }}>
          <p style={{ margin: 0, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6b7280" }}>Panel Admin</p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
            {BARBERIA_CONFIG.nombre}
          </h1>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  color: isActive ? "#ffffff" : "#9ca3af",
                  background: isActive ? "#1f2937" : "transparent",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #1f2937" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.6rem",
              background: "transparent",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
              color: "#9ca3af",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
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
          background: "#111827",
          display: "flex",
          justifyContent: "space-around",
          borderTop: "1px solid #1f2937",
          zIndex: 100,
          padding: "0.5rem 0",
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                padding: "0.25rem 0.5rem",
                color: isActive ? "#3b82f6" : "#6b7280",
                textDecoration: "none",
                fontSize: "0.65rem",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{link.icon}</span>
              {link.label}
            </a>
          );
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}
