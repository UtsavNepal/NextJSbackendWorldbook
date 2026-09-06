import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "nodemailer", "@vercel/blob", "cloudinary"],
};

export default nextConfig;
