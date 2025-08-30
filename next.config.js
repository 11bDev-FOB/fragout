/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  output: 'standalone',
  // Fixed: moved outputFileTracingRoot out of experimental
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig
