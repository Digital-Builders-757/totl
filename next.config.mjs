/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed ignores to catch real issues in CI
  eslint: {
    // ignoreDuringBuilds: true, // Removed - let CI catch linting issues
  },
  typescript: {
    // ignoreBuildErrors: true, // Removed - let CI catch type errors
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
