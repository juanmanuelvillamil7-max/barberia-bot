import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbería El Navajero",
  description: "Agendá tu turno",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
