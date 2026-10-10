<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## ⚠️ 部署本博客前必读（2026-10-10 血泪，别重复踩）

> 📄 全文铁律：`C:\Users\有花无实\Documents\Default Project\notes\部署验证铁律-20261010.md`

**这个仓库有两个名字只差一个字母的 Cloudflare Worker，传错了线上一个字节都不会变：**

| Worker 名 | 状态 | 说明 |
|---|---|---|
| `xinghuisama**b**logs`（**多一个 a**） | ✅ **线上真身** | `ephemeralbloom.dpdns.org` 绑在它上面 |
| `xinghuisanblogs` | ❌ 废弃 | 没绑任何域名，但 `wrangler.jsonc` 里写的偏偏是它 |

**铁律：**

1. **`wrangler.jsonc` 的 `name` 必须是 `xinghuisamablogs`。**
   传错时 `wrangler deploy` 照样打印 `✨ Success! Uploaded` —— **别信命令输出**。
2. **部署后必须验证线上内容真的变了：**
   ```bash
   curl -s -o /dev/null -w "%{http_code} %{size_download}\n" \
     "https://ephemeralbloom.dpdns.org/posts/<新slug>?v=$RANDOM"
   ```
   字节数要和本地一致。**线上 500 而本地 `wrangler dev --port 8799 --local` 是 200
   ⇒ 100% 是传错了目标，不是代码问题。**
3. **主路径是 `git push`**（GitHub → Cloudflare 自动构建，约 100~150 秒）。
   ⚠️ **本机没有 GitHub 凭据，`git push` 会 401** —— 推完必须 `git log origin/main -1` 核对远端 SHA。
   2026-10-10 文章 3 天没上线，根因就是**没推上去**。
4. 备用直传：`node_modules/.bin/wrangler deploy`
5. 工作目录是 `XHBlogs`，但 **git 仓库根在上一层** `D:\work\git\XinghuisamaBlogs`。
6. 本机沙箱会**强杀递归 `fs.cpSync`**（RC=127，无异常）。
   补丁：`D:\work\AI产出\小站部署\cpsync-shim.cjs`，用 `NODE_OPTIONS=--require=<该文件>` 预载。
