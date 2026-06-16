/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdf-parse is CommonJS and reads files at runtime — keep it external so
    // the bundler doesn't try to trace its optional test fixtures.
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
