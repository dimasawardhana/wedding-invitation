import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Wedding Invitation",
  description: "Digital Wedding Invitation SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[#F8F5F2]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
