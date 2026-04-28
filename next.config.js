/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.evbuc.com' },
      { protocol: 'https', hostname: '**.eventbrite.com' },
      { protocol: 'https', hostname: 'cdn.evbstatic.com' },
      { protocol: 'https', hostname: 'img.evbuc.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ]
  }
};

module.exports = nextConfig;
