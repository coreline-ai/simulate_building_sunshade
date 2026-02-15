import type { NextConfig } from "next";

const allowTypeErrors = process.env.ALLOW_TS_ERRORS === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: allowTypeErrors,
  },
  reactStrictMode: true,
};

export default nextConfig;
