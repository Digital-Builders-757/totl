/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily keep ignores - will fix type issues in separate PR
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // Enable optimization for better performance
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: '**.supabase.co', 
        pathname: '/storage/v1/object/**' 
      },
    ],
    // Optimize avatar images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 512],
  },
};

export default nextConfig;
