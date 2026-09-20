import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "KKND — IT Inventory Management",
  description: "IT Inventory Management System",
};

// ป้องกันจอขาววาบตอนโหลด — ต้องรันก่อน React แสดงผล จึงฝังเป็น <script> ตรงๆ
// (Design System §10.3) อ่านธีมจาก localStorage ก่อนตั้งค่า class บน <html>
const themeInitScript = `(function () {
  try {
    var t = localStorage.getItem('kknd-theme');
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
  } catch (e) {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning จำเป็น — สคริปต์ด้านล่างตั้ง class "dark" ให้ <html>
    // นอกเหนือจากที่ JSX นี้ควบคุม ถ้าไม่ใส่ React Strict Mode (Dev) จะล้าง class
    // ที่สคริปต์ตั้งไว้ทิ้งตอน Remount (อ้างอิง Next.js 16 Docs — preventing-flash-before-hydration)
    // lang="en" — NFR-10 บังคับ UI ทั้งหมดเป็นภาษาอังกฤษ
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
