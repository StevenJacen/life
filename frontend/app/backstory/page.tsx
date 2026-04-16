"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const PRESET_ROLES = [
  "孙悟空",
  "甄嬛",
  "韦小宝",
  "许三多",
  "安迪（《肖申克的救赎》）",
  "高启强",
  "程勇（《我不是药神》）",
  "李逍遥",
  "许幻山",
  "自定义...",
];

export default function BackstoryPage() {
  const router = useRouter();
  const [age, setAge] = useState<string>("25");
  const [description, setDescription] = useState<string>("");
  const [roleModel, setRoleModel] = useState<string>("");
  const [customRole, setCustomRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const isCustom = roleModel === "自定义...";
  const finalRole = isCustom ? customRole.trim() : roleModel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 80) {
      setError("年龄需在 10-80 岁之间");
      return;
    }
    if (description.trim().length < 5) {
      setError("请输入至少5个字的前半生描述");
      return;
    }
    if (isCustom && !customRole.trim()) {
      setError("请输入自定义的内心角色");
      return;
    }

    setLoading(true);
    try {
      const life = await api.fromBackstory(ageNum, description.trim(), finalRole || undefined);
      router.push(`/life/${life.id}`);
    } catch (err: any) {
      setError(err?.message || "创建失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="animate-fade-in-up max-w-xl w-full rounded-3xl bg-white/80 backdrop-blur-sm p-10 shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-3 gradient-text tracking-tight">
            从半途开始
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            设定你的起点年龄，写下前半生的故事。
            <br />
            AI 将为你总结过往，并编排后半生的剧本。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
              开始年龄（10-80）
            </label>
            <input
              id="age"
              type="number"
              min={10}
              max={80}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              前半生描述
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：我出身普通家庭，考上了985计算机专业，毕业后进了一家大厂做程序员，996五年攒下一套房的首付，但感情一直空白，身体也开始亚健康……"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition resize-none"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              AI 会根据这段描述推断你的状态，并为你生成后半生的高概率伏笔事件。
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              内心角色（可选）
            </label>
            <p className="text-xs text-gray-500 mb-3">
              选一位影视角色或名人作为你这辈子的参考样例，AI 会在事件和叙事中埋下他的影子。
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_ROLES.map((r) => {
                const active = roleModel === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleModel(r);
                      if (r !== "自定义...") setCustomRole("");
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-700"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            {isCustom && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="输入你心中的角色，例如：乔布斯、张桂梅、蝙蝠侠..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
              />
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-300 bg-white px-6 py-4 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              返回首页
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex flex-[2] items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "AI 编排中..." : "开启这段人生"}
            </button>
          </div>
        </form>
      </div>

      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
