// 构建后把 .next/static 与 public 同步进 standalone 产物。
// Next.js 的 output: 'standalone' 不会自动拷贝这两者，
// 缺了会导致控制台窗口一片底色（脚本/样式全部 404）。
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  console.log('[copy-static] 没有 standalone 产物，跳过。');
  process.exit(0);
}

function copyInto(srcDir, destDir) {
  if (!existsSync(srcDir)) {
    console.log(`[copy-static] 源不存在，跳过：${srcDir}`);
    return;
  }
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    cpSync(join(srcDir, name), join(destDir, name), { recursive: true, force: true });
  }
  console.log(`[copy-static] 已同步：${srcDir} -> ${destDir}`);
}

copyInto(join(root, '.next', 'static'), join(standalone, '.next', 'static'));
copyInto(join(root, 'public'), join(standalone, 'public'));

console.log('[copy-static] ✅ 完成');
