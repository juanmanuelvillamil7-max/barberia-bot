export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        background: "#111",
        color: "#fff",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        Barbería Bot
      </h1>
      <p style={{ color: "#aaa", fontSize: "1.1rem" }}>
        Agendá tu turno por WhatsApp
      </p>
    </main>
  );
}
