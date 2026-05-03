/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Map server-side vars to client-accessible vars at build time
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEI: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEI,
  },
};

module.exports = nextConfig;
