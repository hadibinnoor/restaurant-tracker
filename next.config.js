/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jnqzfzmbrhhyptfchvub.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/restaurant-images/**',
      },
    ],
  },
}

module.exports = nextConfig
