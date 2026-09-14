import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, Camera, MessageCircle, Feather, Briefcase } from 'lucide-react';

interface VisibilitySectionProps {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
}

export default function VisibilitySection({ formData, handleUpdate, pushToQueue }: VisibilitySectionProps) {
  const visibility = formData.contentVisibility || { photoWall: true, moments: true, chatters: true };

  const updateVisibility = (key: string, value: boolean) => {
    handleUpdate('contentVisibility', { ...visibility, [key]: value });
  };

  const saveToQueue = () => {
    pushToQueue('内容可见性配置', 'contentVisibility', visibility);
  };

  const blocks = [
    {
      key: 'photoWall',
      title: '照片墙',
      desc: '导航入口、首页海报、/photowall 页面、关于页活动流、灵境照片成就',
      icon: <Camera size={20} className="text-pink-500" />,
    },
    {
      key: 'moments',
      title: '说说',
      desc: '导航入口、/moments 页面、关于页活动流、灵境说说经验',
      icon: <MessageCircle size={20} className="text-sky-500" />,
    },
    {
      key: 'chatters',
      title: '杂谈',
      desc: '导航入口、首页杂谈轮播、/chatter 列表与详情页、关于页活动流',
      icon: <Feather size={20} className="text-purple-500" />,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>🎭</span> 内容可见性配置
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">面试、外发简历时一键隐藏"不务正业"的板块，数据不删只是藏起来</p>
          </div>
          <button
            onClick={saveToQueue}
            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
          >
            <Save size={16} /> 保存修改
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-3 items-start mb-8">
          <Briefcase size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-1">使用场景提醒</p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              隐藏后前台导航、首页卡片、对应页面（访问返回"被藏起来了"）、关于页动态和灵境成就全部同步消失，
              别人翻遍全站也看不到这些板块存在过的痕迹。数据仍完整保留在本站，重新打开开关即可恢复。
              保存后记得点右上角「更新本地」再「同步 Blog」才会生效到线上。
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {blocks.map((block) => {
            const isVisible = visibility[block.key] !== false;
            return (
              <div
                key={block.key}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border transition-all duration-300 ${
                  isVisible
                    ? 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-300/50 dark:border-slate-700/50 opacity-80'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/60 dark:bg-slate-700/60 flex items-center justify-center shrink-0 shadow-sm border border-white/40 dark:border-slate-600/50">
                    {block.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 dark:text-white">{block.title}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isVisible
                            ? 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20'
                        }`}
                      >
                        {isVisible ? '对外展示中' : '已隐藏'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-md">
                      {block.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => updateVisibility(block.key, !isVisible)}
                  className={`w-full md:w-32 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isVisible
                      ? 'bg-green-500/90 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                      : 'bg-slate-400 hover:bg-slate-500 text-white shadow-lg shadow-slate-400/20'
                  }`}
                >
                  {isVisible ? <><Eye size={14} /> 公开展示</> : <><EyeOff size={14} /> 隐藏板块</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
