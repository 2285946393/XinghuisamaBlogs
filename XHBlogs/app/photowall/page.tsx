import { siteConfig } from "../../siteConfig";
import PhotoWallClient from "./PhotoWallClient";

export const metadata = {
  title: "照片墙 | " + siteConfig.title,
};

export default function PhotoWallPage() {
  // 内容可见性开关：关闭时本页对外隐藏（返回 404）
  if (siteConfig.contentVisibility?.photoWall === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🫧</div>
          <p className="text-lg font-black text-slate-500 dark:text-slate-400">这个板块被站长藏起来了</p>
          <p className="text-xs text-slate-400 mt-2">404 · Not Found</p>
        </div>
      </div>
    );
  }

  return <PhotoWallClient />;
}