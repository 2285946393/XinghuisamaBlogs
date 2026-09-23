"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

const cfg = siteConfig.live2d;

// 模块级单例：跨 StrictMode 双挂载 / 路由切换只创建一次 pixi Application 与模型，
// 卸载时只把 canvas 从 DOM 摘掉，绝不销毁（否则二次加载会复用旧 WebGL 上下文的纹理而报警）
let pixiSingleton: { app: any; model: any; view: HTMLCanvasElement } | null = null;
let loadPromise: Promise<{ app: any; model: any; view: HTMLCanvasElement }> | null = null;

async function ensureLive2D() {
  if (pixiSingleton) return pixiSingleton;
  if (!loadPromise) {
    loadPromise = (async () => {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Live2DCubismCore) return resolve();
        const s = document.createElement('script');
        s.src = cfg!.coreScript;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('cubism core load failed'));
        document.head.appendChild(s);
      });
      const PIXI = await import('pixi.js');
      (window as any).PIXI = PIXI;
      const { Live2DModel } = await import('pixi-live2d-display/cubism4');
      const model = await Live2DModel.from(cfg!.modelSrc, {
        autoInteract: true,
        logLevel: 0,
        motionPreload: 'ALL',
      });
      const app = new PIXI.Application({
        width: cfg!.width,
        height: Math.round(cfg!.width * 1.35),
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      const fit = Math.min(
        app.screen.width / model.internalModel.width,
        app.screen.height / model.internalModel.height
      );
      model.scale.set(fit);
      model.x = (app.screen.width - model.internalModel.width * fit) / 2;
      model.y = (app.screen.height - model.internalModel.height * fit) / 2;
      app.stage.addChild(model);
      pixiSingleton = { app, model, view: app.view as HTMLCanvasElement };
      return pixiSingleton;
    })();
  }
  return loadPromise;
}

export default function Live2DChan() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const disposedRef = useRef(false);
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [ready, setReady] = useState(false);

  const speak = useCallback((text: string, duration = 6000) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration);
  }, []);

  // --- 加载 Live2D 模型 ---
  useEffect(() => {
    if (!cfg?.enabled || !mountRef.current) return;
    disposedRef.current = false;
    let view: HTMLCanvasElement | null = null;

    ensureLive2D()
      .then(({ app, model, view: v }) => {
        if (disposedRef.current) return;
        view = v;
        mountRef.current!.appendChild(v);
        model.motion(cfg.idleMotion);
        modelRef.current = model;
        setReady(true);
        setTimeout(() => {
          if (!disposedRef.current && !speech) speak(cfg.greetings[0], 7000);
        }, 2000);
      })
      .catch((err) => console.warn('[Live2DChan] 加载失败，看板娘休息一天：', err));

    return () => {
      disposedRef.current = true;
      modelRef.current = null;
      if (view && view.parentNode === mountRef.current) mountRef.current.removeChild(view);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 点它本体：动作 + 吐槽 ---
  const handleTap = () => {
    const model = modelRef.current;
    if (!model || isThinking) return;
    model.motion(cfg.tapMotion);
    const text = cfg.touchTalks[Math.floor(Math.random() * cfg.touchTalks.length)];
    speak(text, 4000);
  };

  // --- 聊天 ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    const userMessage = inputValue;
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    modelRef.current?.motion(cfg.tapMotion);
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
      speak('鲸鱼音都发不出来了…信号被海浪卷走啦！', 4000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 随机挂机语录 ---
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      if (!speech && !showInput && !isThinking && Math.random() > 0.75) {
        modelRef.current?.motion(cfg.idleMotion);
        speak(cfg.idleTalks[Math.floor(Math.random() * cfg.idleTalks.length)], 5000);
      }
    }, 24000);
    return () => clearInterval(timer);
  }, [ready, speech, showInput, isThinking, speak]);

  if (!cfg?.enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="fixed bottom-4 right-4 z-[9998] flex flex-col items-center"
    >
      {/* 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-3">
        <AnimatePresence>
          {speech && (
            <motion.div
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

      {/* Live2D 本体 */}
      <div
        ref={mountRef}
        onClick={handleTap}
        className="cursor-pointer drop-shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
        style={{ width: cfg.width, height: Math.round(cfg.width * 1.35), visibility: ready ? 'visible' : 'hidden' }}
      />
    </motion.div>
  );
}
