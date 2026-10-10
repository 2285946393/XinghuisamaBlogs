import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚨 核心修改 1：关掉纯静态导出，让 Vercel 帮你把 API 跑起来！
  // output: 'export',

  // 🚨 核心修改 2：Vercel 不需要强制加斜杠，关掉它能避免很多 API 路径匹配错误
  // trailingSlash: true,

  // 下面这些可以保留
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TS 错误，方便快速部署
  },
};

export default nextConfig;

// ⚠️ 只在 `next dev` 时启用 OpenNext 的本地平台代理（用于给 dev 提供 wrangler bindings）。
// 构建期必须跳过：否则它会启动一个本地 miniflare 服务并一直等待，导致 `next build` 永久卡死
// （症状：.next/lock 生成后 10 分钟零写入，进程在 127.0.0.1 上 LISTENING 且 CPU 接近 0）。
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
