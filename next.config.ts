import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tools/camera-fov-calculator", destination: "/tools/camera-fov-calibration/fov-calculator", permanent: true },
      { source: "/tools/camera-calibration-tool", destination: "/tools/camera-fov-calibration/calibration-patterns", permanent: true },
    ];
  },
};

export default nextConfig;
