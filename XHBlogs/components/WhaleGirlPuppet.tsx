"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { siteConfig } from '../siteConfig';

const cfg = siteConfig.live2d;

// 台词池：摸头时 = 原有摸头台词 + 余额鲸鱼娘台词；挂机时 = 原有挂机语录 + 余额鲸鱼娘台词
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
const TAP_TALKS = [...cfg.touchTalks, ...(cfg.whaleTalks || [])];
const IDLE_TALKS = [...cfg.idleTalks, ...(cfg.whaleTalks || [])];

// 程序化 2.5D 鲸鱼娘：单张透明立绘 + 呼吸/浮动/摇摆/视线倾斜/点击弹跳。
// 不需要 .moc3，零模型下载；等有网跑 psd2live 出 moc3 后把 mode 改回 'live2d' 即可升级。
export default function WhaleGirlPuppet() {
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readyRef = useRef(false);

  const t = useMotionValue(0);          // 时间轴（秒）
  const pointerX = useMotionValue(0);   // -1..1 光标相对水平
  const bounce = useMotionValue(0);     // 点击弹跳脉冲 0..1

  const scaleY = useTransform([t, bounce], ([time, b]: number[]) =>
    1 + Math.sin(time * 1.9) * 0.035 - (b as number) * 0.16);
  const scaleX = useTransform([t, bounce], ([time, b]: number[]) =>
    1 - Math.sin(time * 1.9) * 0.02 + (b as number) * 0.12);
  const bobY = useTransform(t, (time: number) => Math.sin(time * 1.5) * 6);
  const tilt = useTransform([t, pointerX], ([time, px]: number[]) =>
    Math.sin(time * 0.9) * 1.6 + (px as number) * 5);

  useAnimationFrame((timeMs) => {
    t.set(timeMs / 1000);
    // 弹跳脉冲自然衰减
    if (bounce.get() > 0.001) bounce.set(bounce.get() * 0.9);
    else if (bounce.get() !== 0) bounce.set(0);
  });

  const speak = useCallback((text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  }, []);

  const poke = useCallback((text: string) => {
    bounce.set(1);
    speak(text, 4200);
  }, [bounce, speak]);

  // 开场问候
  useEffect(() => {
    if (!cfg?.enabled) return;
    const id = setTimeout(() => {
      if (!speech) speak(cfg.greetings[0], 7000);
    }, 1800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 光标水平跟随（整屏范围映射到 -1..1）
  useEffect(() => {
    const onMove = (e: PointerEvent) => pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointerX]);

  // 随机挂机语录
  useEffect(() => {
    const timer = setInterval(() => {
      if (!speech && !showInput && !isThinking && Math.random() > 0.45) {
        poke(pick(IDLE_TALKS));
      }
    }, 16000);
    return () => clearInterval(timer);
  }, [speech, showInput, isThinking, poke]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    bounce.set(1);
    speak('让小实想想…', 10000);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, persona: cfg.systemPrompt }),
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      speak(data.reply, 8000);
    } catch {
      speak('鲸鱼音都发不出来了…信号被海浪卷走啦！', 4200);
    } finally {
      setIsThinking(false);
    }
  };

  if (!cfg?.enabled) return null;

  const tap = () => poke(pick(TAP_TALKS));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="fixed bottom-4 right-4 z-[9998] flex flex-col items-center"
    >
      {/* 气泡 */}
      <div className="relative w-full flex justify-center mb-3">
        <AnimatePresence>
          {speech && (
            <motion.div
              key={speech}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-sm max-w-[240px] break-words text-center leading-relaxed backdrop-blur-sm"
              style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
            >
              {speech}
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 聊天按钮 */}
      <button
        onClick={() => setShowInput(!showInput)}
        className="mb-2 bg-white/90 dark:bg-slate-700/90 p-2 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-pink-400 hover:text-pink-500 flex items-center justify-center backdrop-blur-sm"
        title="找小实聊天"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 输入框 */}
      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleChatSubmit}
            className="mb-2 overflow-hidden"
          >
            <input
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="跟小实说点什么…"
              className="w-44 px-3 py-1.5 rounded-full text-sm bg-white/95 dark:bg-slate-800/95 border border-gray-200 dark:border-slate-600 text-slate-700 dark:text-gray-200 outline-none focus:border-pink-300 shadow-md"
            />
          </motion.form>
        )}
      </AnimatePresence>

      {/* 鲸鱼娘本体：程序化形变 */}
      <motion.div
        onClick={tap}
        style={{ scaleX, scaleY, y: bobY, rotate: tilt, transformOrigin: '50% 92%', touchAction: 'none' }}
        className="cursor-pointer drop-shadow-[0_10px_18px_rgba(0,0,0,0.28)] select-none"
        title="点我"
      >
        <img
          src={cfg.puppetSrc}
          alt="鲸鱼娘小实"
          draggable={false}
          className="pointer-events-none"
          style={{ width: cfg.width, height: 'auto', display: 'block' }}
        />
      </motion.div>
    </motion.div>
  );
}
