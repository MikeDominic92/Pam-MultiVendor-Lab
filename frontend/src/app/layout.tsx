import { Inter, Fira_Code, Orbitron } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "PAM Multi-Vendor Lab | Unified Privileged Access Management",
  description: "Enterprise-grade Privileged Access Management Dashboard with multi-vendor support for Delinea, HashiCorp Vault, and AWS Secrets Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${firaCode.variable} ${orbitron.variable} antialiased bg-obsidian text-white min-h-screen overflow-x-hidden font-sans`}
      >
        {/* Animated Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyber-purple/20 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyber-cyan/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-neon-emerald/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-4s' }} />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,245,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Scanline effect */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,0.03) 2px, rgba(0,245,255,0.03) 4px)`,
            }}
          />
        </div>

        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Main content */}
        <ClientProviders>
          <main id="main-content" className="relative z-10" role="main">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
