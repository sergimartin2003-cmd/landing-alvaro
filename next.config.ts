import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite servir imágenes de producto alojadas en Supabase Storage.
    // El host concreto (tu-proyecto.supabase.co) se resuelve por el patrón comodín.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Placeholders fiables para los productos de ejemplo del seed.
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
