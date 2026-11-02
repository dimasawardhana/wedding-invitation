import type { NextConfig } from "next";

// MinIO host port is overridable so the e2e suite (which shifts it to avoid
// collisions with other local stacks) doesn't trip next/image's hostname check.
const minioPort = process.env.NEXT_PUBLIC_MINIO_PORT ?? "9000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: minioPort },
    ],
  },
};

export default nextConfig;
