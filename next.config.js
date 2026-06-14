/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async redirects() {
    return [
      {
        source: "/chicken",
        destination: "/category/chicken",
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
