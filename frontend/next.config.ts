import type { NextConfig } from "next";

// Some deployments serve the app under a URL subpath (e.g. https://host/is-inventory) behind a
// front-door reverse proxy that forwards the full path through unchanged — see docs/DEPLOYMENT.md
// §3.4. BASE_PATH is a build-time-only env var (read here in next.config.ts, not NEXT_PUBLIC_*)
// baked into the standalone bundle by `npm run build`; it cannot be changed at runtime afterward.
const basePath = process.env.BASE_PATH?.trim();
if (basePath && !basePath.startsWith("/")) {
  throw new Error(`BASE_PATH must start with "/" (got "${basePath}")`);
}

const nextConfig: NextConfig = {
  // Self-contained deploy บน Windows Server (ไม่มี Internet หลังติดตั้ง) — ดู docs/HANDOFF.md §10.2
  // รวมเฉพาะไฟล์ที่ Node process ต้องใช้จริงไว้ใน .next/standalone แทนการพึ่ง node_modules เต็มโปรเจกต์
  output: "standalone",
  basePath: basePath || undefined,
};

export default nextConfig;
