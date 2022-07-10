/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ["cdn.discordapp.com", "firebasestorage.googleapis.com"]
    }
}

module.exports = nextConfig