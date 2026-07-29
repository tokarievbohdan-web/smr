import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Самодостатній сервер для VPS: .next/standalone/server.js із мінімумом node_modules.
  output: "standalone",
  // Root = корінь репозиторію, щоб turbopack бачив спільний пакет ../shared
  // (єдине джерело контрактів/лейблів для web+mobile).
  turbopack: { root: path.join(__dirname, "..") },
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
