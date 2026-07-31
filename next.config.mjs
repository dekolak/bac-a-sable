/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build autonome pour un conteneur léger (Coolify / Docker).
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
