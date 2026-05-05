import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js 16+: helps trace Prisma files from custom output path
  outputFileTracingIncludes: {
    "/*": ["./app/generated/prisma/**/*"],
  },
};

export default nextConfig;