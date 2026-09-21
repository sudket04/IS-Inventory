import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained deploy บน Windows Server (ไม่มี Internet หลังติดตั้ง) — ดู docs/HANDOFF.md §10.2
  // รวมเฉพาะไฟล์ที่ Node process ต้องใช้จริงไว้ใน .next/standalone แทนการพึ่ง node_modules เต็มโปรเจกต์
  output: "standalone",
};

export default nextConfig;
