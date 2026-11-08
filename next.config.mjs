/** @type {import('next').NextConfig} */
const nextConfig = {
  // nextstepjs ships ESM only
  transpilePackages: ["nextstepjs"],
  images: {
    unoptimized: true,
  },
  // These packages contain native binaries or hashed runtime paths that esbuild cannot
  // bundle for Cloudflare Workers. They are not needed at runtime:
  // - @prisma/client: the generated client in src/generated/prisma is pure TS; the runtime
  //   package is only used for type re-exports and is replaced by the driver adapter.
  // - sharp / @img/sharp-win32-x64: native .node binaries, not compatible with Workers.
  //   The app does not use next/image.
  serverExternalPackages: [
    "@prisma/client",
    "sharp",
    "@img/sharp-win32-x64",
  ],
};

export default nextConfig;
