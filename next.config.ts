import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Product previews, decals and thumbnails come from the Supabase Storage CDN. */
function storageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  if (!supabaseUrl) {
    console.warn(
      "[next.config] NEXT_PUBLIC_SUPABASE_URL is unset — next/image will reject Supabase Storage URLs. " +
        "Set it in .env.local (see .env.example).",
    );
    return [];
  }

  try {
    return [
      {
        protocol: "https",
        hostname: new URL(supabaseUrl).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    // Never fail the build on a malformed var: src/env.ts names the offending
    // key when the server boots, which is the actionable error surface.
    console.warn(
      `[next.config] NEXT_PUBLIC_SUPABASE_URL is not a valid URL (got ${supabaseUrl.length} chars) — skipping Supabase image patterns.`,
    );
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: storageRemotePatterns(),
  },
};

export default withBundleAnalyzer(nextConfig);
