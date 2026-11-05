import type { NextConfig } from "next";
import path from "node:path";

// MinIO host/port are overridable so the e2e suite (which shifts them to avoid
// collisions with other local stacks) doesn't trip next/image's hostname check.
// Uploaded image URLs come from S3_PUBLIC_URL, so these must match wherever
// MinIO is exposed — localhost in dev, the deployment host in production.
const minioHost = process.env.NEXT_PUBLIC_MINIO_HOST ?? "localhost";
const minioPort = process.env.NEXT_PUBLIC_MINIO_PORT ?? "9000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: minioHost, port: minioPort },
      { protocol: "https", hostname: minioHost, port: minioPort },
    ],
  },
};

export default nextConfig;
