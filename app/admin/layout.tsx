import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--cream)" }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "2.5rem 2rem",
          overflowY: "auto",
        }}
        className="admin-main"
      >
        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .admin-main {
            margin-left: 200px;
          }
        }
        @media (max-width: 767px) {
          .admin-main {
            padding: 1.5rem 1.25rem;
            padding-bottom: 5rem;
          }
        }
      `}</style>
    </div>
  );
}
