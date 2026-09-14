// components/LatestMomentsCard.tsx
// 杂谈轮播被隐藏时，首页右侧用“最新说说”卡片顶上，避免布局空缺
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function LatestMomentsCard() {
  let allMoments: any[] = [];
  try {
    const possibleDirs = [
      path.join(process.cwd(), 'posts', 'moments'),
      path.join(process.cwd(), 'moments')
    ];
    possibleDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const fileNames = fs.readdirSync(dir).filter((f: string) => f.endsWith('.md'));
        fileNames.forEach((fileName: string) => {
          const { data, content } = matter(fs.readFileSync(path.join(dir, fileName), 'utf8'));
          allMoments.push({
            id: fileName.replace(/\.md$/, ''),
            date: data.date || '1970-01-01',
            images: data.images || [],
            content: content.trim()
          });
        });
      }
    });
    allMoments = Array.from(new Map(allMoments.map(item => [item.id, item])).values());
    allMoments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {}

  const latest = allMoments[0];

  return (
    <div className="w-full h-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative group min-h-[220px] flex flex-col">
      <Link href="/moments" className="absolute inset-0 z-20" aria-label="查看说说" />

      <div className="relative z-10 flex flex-col justify-center p-6 md:p-8 h-full pointer-events-none w-full">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 shadow-sm">
            Moments
          </span>
          {latest && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-300 drop-shadow-md">
              {(() => { const d = new Date(latest.date); return isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; })()}
            </span>
          )}
        </div>

        {latest ? (
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-4">
            {latest.content}
          </p>
        ) : (
          <p className="text-sm text-slate-500 font-medium">还没有说说，去记录一段思绪吧。</p>
        )}
      </div>

      <div className="absolute bottom-5 right-6 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
        查看全部 →
      </div>
    </div>
  );
}
