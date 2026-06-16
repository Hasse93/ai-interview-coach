/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep native/runtime-heavy packages external so the bundler doesn't try
    // to trace them: pdf-parse (test fixtures) and the Transformers.js stack
    // (onnxruntime + model weights loaded at runtime).
    serverComponentsExternalPackages: ["pdf-parse", "@xenova/transformers", "onnxruntime-node"],
  },
};

export default nextConfig;
