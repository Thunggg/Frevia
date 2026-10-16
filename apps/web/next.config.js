/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // File upload trong hội thoại được phục vụ từ backend (NestJS) tại /uploads
      {
        source: "/uploads/:path*",
        destination: `${process.env.NESTJS_API_URL || "http://localhost:3000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
