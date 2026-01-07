import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poll Template Builder",
  description: "Build customized poll instruments from a categorized question library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
