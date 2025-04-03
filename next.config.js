/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000', '192.168.2.50:3000', '127.0.0.1:50572', 
                       'localhost:3001', '127.0.0.1:3001', '192.168.2.50:3001', '127.0.0.1:53054'],
    },
  },
  reactStrictMode: true,
}

module.exports = nextConfig
