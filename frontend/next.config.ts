import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Static export ke liye image optimization disable karna padta hai
  }
};

export default nextConfig;
