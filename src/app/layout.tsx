import type { Metadata } from "next";
import "./globals.css";

// Sem isso, o Next não consegue resolver URLs relativas de imagem
// (og:image, banner etc.) em URLs absolutas — e sem URL absoluta, o
// WhatsApp/Instagram/Facebook simplesmente não mostram a prévia com foto.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "Central de Campanhas — Lucrattiva",
  description: "Gerencie e automatize as campanhas de divulgação da Lucrattiva.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
