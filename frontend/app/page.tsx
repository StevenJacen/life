"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      const life = await api.createLife();
      router.push(`/life/${life.id}`);
    } catch (e) {
      alert("创建人生失败，请确保后端服务已启动 (localhost:3001)");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="animate-fade-in-up max-w-xl w-full rounded-3xl bg-white/80 backdrop-blur-sm p-10 shadow-2xl text-center border border-white/50">
        <h1 className="text-5xl font-extrabold mb-4 gradient-text tracking-tight">
          中式人生模拟器
        </h1>
        <p className="text-gray-600 mb-10 text-lg leading-relaxed">
          每一回合代表一年，随机事件将塑造你的命运。
          <br />
          从出生到退休，体验一段独一无二的人生旅程。
        </p>
        <button
          onClick={startGame}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-10 py-5 text-xl font-bold text-white shadow-lg hover:bg-indigo-700 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 next-year-btn"
        >
          {loading ? "创建中..." : "开始新人生"}
        </button>
        <p className="mt-8 text-sm text-gray-400">powered by Next.js + Node.js + SQLite + AI</p>
      </div>

      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
