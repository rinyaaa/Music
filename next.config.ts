import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像ドメインの設定（これは元のまま）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lineup-images.scdn.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "wrapped-images.spotifycdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image-cdn-ak.spotifycdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image-cdn-fa.spotifycdn.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // ▼▼▼ ここからがSVGを扱うための設定 ▼▼▼
  webpack(config) {
    // ファイル名に .svg が含まれるものを取得
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      (rule as { test?: RegExp }).test?.test(".svg")
    );

    config.module.rules.push(
      // SVG を React コンポーネントとしてインポートできるようにする
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ["@svgr/webpack"],
      }
    );

    // SVG を CSS の url() などで読み込めるようにする設定（元の設定を変更）
    if (fileLoaderRule) {
      (fileLoaderRule as { exclude: RegExp }).exclude = /\.svg$/i;
    }
    
    return config;
  },
  // ▲▲▲ ここまで ▲▲▲
};

export default nextConfig;