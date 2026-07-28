import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Самодостатній сервер для VPS: .next/standalone/server.js із мінімумом node_modules.
  output: "standalone",
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
