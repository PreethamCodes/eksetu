/** @type {import('next').NextConfig} */
let backendUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL.trim() : '';

// Ensure URL starts with http:// or https:// if provided
if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
  backendUrl = `https://${backendUrl}`;
}

// Remove any trailing slashes
if (backendUrl) {
  backendUrl = backendUrl.replace(/\/+$/, '');
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
