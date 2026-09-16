/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  reactStrictMode: true,
  ...(isGithubPages && {
    trailingSlash: true,
    output: 'export',
    basePath: '/gravefin',
    assetPrefix: '/gravefin/',
    images: {
      unoptimized: true,
    },
  }),
};

module.exports = nextConfig;
