// open-next.config.ts - Cloudflare 适配配置
// 用 Workers 静态资源作为增量缓存：预渲染页面在构建期烘进 assets，
// Workers 请求时直接读缓存，不再在运行时调用 fs（workerd 无 fs），也不需 KV/R2。
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
});
