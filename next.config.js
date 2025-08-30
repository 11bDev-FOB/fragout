/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  output: 'standalone',
  experimental: {
    // Optimize for Docker
    outputFileTracingRoot: __dirname,
  }
}

module.exports = nextConfig
