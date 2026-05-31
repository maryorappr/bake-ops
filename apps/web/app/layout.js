import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const headingFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

export const metadata = {
  title: "Cookie Ops",
  description: "Operations dashboard for order, fulfillment, and inventory flow."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <div className="app-shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Cookie Ops</p>
              <h1 className="brand">Bakery Control Center</h1>
            </div>
            <nav className="topnav">
              <a href="/">Dashboard</a>
              <a href="/fulfillment">Fulfillment</a>
              <a href="/inventory">Inventory</a>
              <a href="/recipes">Recipes</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
