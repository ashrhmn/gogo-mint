/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "cdn.discordapp.com",
      "firebasestorage.googleapis.com",
      "gateway.pinata.cloud",
    ],
  },
  output: "standalone",
};

module.exports = nextConfig;
