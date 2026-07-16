import type { NextConfig } from "next";
import { securityHeadersForNextConfig } from "./lib/security/http-headers";

const nextConfig: NextConfig = {
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
