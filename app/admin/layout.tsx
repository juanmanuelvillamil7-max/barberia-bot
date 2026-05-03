import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let hasSession = false;
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    hasSession = !!session;
  } catch {
    hasSession = false;
  }

  if (!hasSession) {
    redirect("/admin/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#f4f4f5" }}>
      <Sidebar />

      {/* Desktop main content offset */}
      <main
        style={{
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
        }}
        className="admin-main"
      >
        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .admin-main {
            margin-left: 220px;
          }
        }
        @media (max-width: 767px) {
          .admin-main {
            padding: 1rem;
            padding-bottom: 5rem; /* space for mobile bottom nav */
          }
        }
      `}</style>
    </div>
  );
}
