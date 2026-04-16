import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["1314138d9p.zicp.fun"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
