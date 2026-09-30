/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Silence the "console.*" calls in production the same way the old Vite
  // build did (vite.config.js -> removeConsole plugin). Next's SWC compiler
  // strips console calls in production while keeping console.error.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // In production the Express custom server handles /api/* and /uploads/*
  // natively (same process). No rewrites needed.

  images: {
    // The app renders remote Cloudinary images directly through <img> tags and
    // its own LazyImage component (no next/image), so no remote patterns are
    // strictly required. Left unoptimized to preserve the existing behaviour.
    unoptimized: true,
  },
};

export default nextConfig;
