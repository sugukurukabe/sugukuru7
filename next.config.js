/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone', // Standalone mode is often better for Docker
}

module.exports = nextConfig
