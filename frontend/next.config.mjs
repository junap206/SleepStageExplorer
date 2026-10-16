/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Hides the small "N" badge that Next.js shows in development only.
  devIndicators: false,
};

export default nextConfig;