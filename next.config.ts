import type { NextConfig } from "next";
import { securityHeadersForNextConfig } from "./lib/security/http-headers";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeadersForNextConfig(),
      },
    ];
  },
};

export default nextConfig;
