import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barbería Bot",
  description: "Agendá tu turno por WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
