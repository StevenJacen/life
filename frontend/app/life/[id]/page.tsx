"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, LifeState, NextTurnData, ChooseData, LogItem, SkipYearData, HumorItem } from "@/lib/api";

// ========== 辅助函数：状态映射 ==========
function getMoneyStatus(money: number): { emoji: string; label: string; color: string } {
  if (money < 0) return { emoji: "💸", label: "负债累累", color: "text-rose-600" };
  if (money < 5000) return { emoji: "💰", label: "捉襟见肘", color: "text-red-500" };
  if (money < 20000) return { emoji: "💵", label: "勉强生活", color: "text-orange-500" };
  if (money < 50000) return { emoji: "💳", label: "还算体面", color: "text-yellow-600" };
  if (money < 100000) return { emoji: "🏦", label: "小康水平", color: "text-blue-500" };
  return { emoji: "🚀", label: "财务自由", color: "text-emerald-500" };
}

function getStatStatus(key: "intelligence" | "health" | "happiness" | "charm", value: number): { label: string; color: string } {
  const tier = value < 30 ? 0 : value < 50 ? 1 : value < 70 ? 2 : 3;
  const map: Record<typeof key, Array<{ label: string; color: string }>> = {
    intelligence: [
      { label: "有点迷糊", color: "text-rose-500" },
      { label: "思路一般", color: "text-orange-500" },
      { label: "脑子在线", color: "text-yellow-600" },
      { label: "聪明绝顶", color: "text-emerald-600" },
    ],
    health: [
      { label: "状态告急", color: "text-rose-500" },
      { label: "时好时坏", color: "text-orange-500" },
      { label: "总体稳定", color: "text-yellow-600" },
      { label: "活力满格", color: "text-emerald-600" },
    ],
    happiness: [
      { label: "有点丧", color: "text-rose-500" },
      { label: "凑合过", color: "text-orange-500" },
      { label: "心态平稳", color: "text-yellow-600" },
      { label: "快乐拉满", color: "text-emerald-600" },
    ],
    charm: [
      { label: "平平无奇", color: "text-rose-500" },
      { label: "顺眼耐看", color: "text-orange-500" },
      { label: "魅力在线", color: "text-yellow-600" },
      { label: "回头率超高", color: "text-emerald-600" },
    ],
  };
  return map[key][tier];
}

function getChangeTone(entry: string) {
  return entry.includes("-")
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function getAgeTheme(age: number) {
  if (age < 30) return "from-violet-100 via-blue-50 to-cyan-100";
  if (age < 55) return "from-amber-100 via-rose-50 to-purple-100";
  return "from-slate-200 via-blue-100 to-indigo-100";
}

// ========== 组件 ==========
function Toast({ show, title, description, onClose }: { show: boolean; title: string; description: string; onClose: () => void }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto history-toast-enter">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/2 -translate-x-1/2 rounded-full bg-white/10" />
        <button onClick={onClose} className="absolute right-2 top-2 z-10 text-xl leading-none text-white/80 hover:text-white">×</button>
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white/80"><span>📅</span><span>人生时刻</span></div>
          <div className="text-lg font-bold">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-white/90">{description}</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white/60 animate-[shrink_5s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
}

export default function LifePage() {
  const params = useParams();
  const router = useRouter();
  const lifeId = Number(params.id);

  const [state, setState] = useState<LifeState | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [turn, setTurn] = useState<NextTurnData | null>(null);
  const [result, setResult] = useState<ChooseData | null>(null);
  const [humor, setHumor] = useState<HumorItem | null>(null);
  const [suddenEvents, setSuddenEvents] = useState<Array<{ event: any; results: any[] }>>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [flashClass, setFlashClass] = useState<string>("");
  const [toast, setToast] = useState<{ show: boolean; title: string; description: string }>({ show: false, title: "", description: "" });
  const [showSummary, setShowSummary] = useState(true);

  const fetchState = async () => {
    const s = await api.getLife(lifeId);
    setState(s);
  };

  const fetchLogs = async () => {
    const l = await api.getLogs(lifeId);
    setLogs(l);
  };

  useEffect(() => {
    if (!lifeId) return;
    fetchState();
    fetchLogs();
  }, [lifeId]);

  useEffect(() => {
    if (state && state.is_active === 0 && !summary) {
      api.getSummary(lifeId).then(setSummary);
    }
  }, [state, lifeId, summary]);

  const triggerFlash = (tone: "positive" | "negative" | "neutral") => {
    setFlashClass(`year-flash-${tone}`);
    setTimeout(() => setFlashClass(""), 900);
  };

  const showToast = (title: string, description: string) => {
    setToast({ show: true, title, description });
  };

  const closeToast = () => setToast({ show: false, title: "", description: "" });

  const handleNextTurn = async () => {
    setLoading(true);
    setResult(null);
    setSuddenEvents([]);
    setMessage("");
    try {
      const t = await api.nextTurn(lifeId);
      setTurn(t);
      setHumor(t.humor_quote);
      // 闪光效果移到结果阶段，选项展示阶段不闪光
    } catch (e: any) {
      setMessage(e.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipYear = async () => {
    setLoading(true);
    try {
      const data: SkipYearData = await api.skipYear(lifeId);
      setState(data.state);
      setTurn(null);
      setHumor(data.humor_quote);
      setSuddenEvents(data.sudden_events || []);
      await fetchLogs();

      if (data.ended) {
        const s = await api.getSummary(lifeId);
        setSummary(s);
        triggerFlash("negative");
        showToast("人生谢幕", data.cause_of_death || "这一生走到了尽头。");
        return;
      }

      // 只在有突发事件或显著变化时闪光
      if (data.sudden_events && data.sudden_events.length > 0) {
        const net = data.sudden_events.reduce((sum, se) => sum + se.results.reduce((s, r) => s + (r.delta ?? 0), 0), 0);
        triggerFlash(net < 0 ? "negative" : net > 0 ? "positive" : "neutral");
        for (const se of data.sudden_events || []) {
          showToast(`[突发] ${se.event.title}`, se.event.description);
        }
      }
    } catch (e: any) {
      setMessage(e.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = async (optionId: number) => {
    setLoading(true);
    try {
      const r = await api.chooseOption(lifeId, optionId);
      setResult(r);
      setTurn(null);
      setState(r.state);
      setHumor(r.humor_quote);
      setSuddenEvents(r.sudden_events || []);
      await fetchLogs();

      if (r.ended) {
        const s = await api.getSummary(lifeId);
        setSummary(s);
        triggerFlash("negative");
        showToast("人生谢幕", r.cause_of_death || "这一生走到了尽头。");
        return;
      }

      // 判断是否值得闪光：有突发事件、或有显著变化（任意 delta 绝对值 >= 10）
      const hasSudden = (r.sudden_events ?? []).length > 0;
      const maxDelta = Math.max(...r.results.map((x) => Math.abs(x.delta ?? 0)), 0);
      const shouldFlash = hasSudden || maxDelta >= 10;

      if (shouldFlash) {
        const hasNegative = r.results.some((x) => (x.delta ?? 0) < 0) || (r.sudden_events || []).some((se) => se.results.some((x: any) => (x.delta ?? 0) < 0));
        const hasPositive = r.results.some((x) => (x.delta ?? 0) > 0) || (r.sudden_events || []).some((se) => se.results.some((x: any) => (x.delta ?? 0) > 0));
        if (hasNegative) triggerFlash("negative");
        else if (hasPositive) triggerFlash("positive");
        else triggerFlash("neutral");
      }

      if (r.event.title && r.event.title !== "平淡的一年") {
        showToast(r.event.title, `你选择了「${r.option.text}」，人生轨迹发生了变化。`);
      }

      for (const se of r.sudden_events || []) {
        showToast(`[突发] ${se.event.title}`, se.event.description);
      }
    } catch (e: any) {
      setMessage(e.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setLoading(true);
    try {
      const ev = await api.generateAIEvent(lifeId);
      showToast("AI 事件已生成", `新事件「${ev.title}」已加入你的人生剧本！`);
    } catch (e: any) {
      showToast("AI 生成失败", e.message || "AI 生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = () => {
    if (confirm("确定要结束这局人生吗？")) {
      showToast("人生结算", `${state?.age}岁的你，提前收下了人生的剧本。`);
      setTimeout(() => router.push("/"), 1500);
    }
  };

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-3 animate-spin text-3xl">🔄</div>
          <div className="text-gray-500">加载人生中...</div>
        </div>
      </div>
    );
  }

  const ageTheme = getAgeTheme(state.age);
  const moneyStatus = getMoneyStatus(state.money);

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${ageTheme} p-4 transition-all duration-700 md:p-6`}>
      {flashClass && <div className={`pointer-events-none fixed inset-0 z-40 ${flashClass}`} />}
      <Toast show={toast.show} title={toast.title} description={toast.description} onClose={closeToast} />

      <div className="mx-auto max-w-5xl space-y-5">
        {/* 顶部状态栏 */}
        <div className="rounded-2xl bg-white/90 p-5 shadow-xl backdrop-blur border border-white/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👤</div>
              <div>
                <div className="text-lg font-bold text-gray-900">人生 #{state.id}</div>
                <div className="text-sm text-gray-500">{state.age} 岁 · {state.career}</div>
                {state.role_model && (
                  <div className="mt-0.5 text-xs text-indigo-600 font-medium">内心角色：{state.role_model}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {state.is_active === 0 ? (
                <span className="rounded-full px-3 py-1 text-sm font-semibold bg-gray-800 text-white">
                  已离世
                </span>
              ) : (
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    state.age < 18
                      ? "bg-blue-100 text-blue-700"
                      : state.age < 35
                      ? "bg-purple-100 text-purple-700"
                      : state.age < 60
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {state.age < 18 ? "未成年" : state.age < 35 ? "青年" : state.age < 60 ? "中年" : "老年"}
                </span>
              )}
            </div>
          </div>

          {/* 属性进度条 */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {/* 财富 */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <div className="text-2xl">{moneyStatus.emoji}</div>
              <div className={`mt-1 text-sm font-bold ${moneyStatus.color}`}>{moneyStatus.label}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, state.money / 1500))}%` }}
                />
              </div>
            </div>

            {/* 智力 */}
            {(() => {
              const v = state.attributes.intelligence ?? 0;
              const s = getStatStatus("intelligence", v);
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className="text-2xl">🧠</div>
                  <div className={`mt-1 text-sm font-bold ${s.color}`}>{s.label}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* 健康 */}
            {(() => {
              const v = state.health;
              const s = getStatStatus("health", v);
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className="text-2xl">❤️</div>
                  <div className={`mt-1 text-sm font-bold ${s.color}`}>{s.label}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* 快乐 */}
            {(() => {
              const v = state.happiness;
              const s = getStatStatus("happiness", v);
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className="text-2xl">😊</div>
                  <div className={`mt-1 text-sm font-bold ${s.color}`}>{s.label}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* 魅力 */}
            {(() => {
              const v = state.attributes.charm ?? 0;
              const s = getStatStatus("charm", v);
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                  <div className="text-2xl">✨</div>
                  <div className={`mt-1 text-sm font-bold ${s.color}`}>{s.label}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, v))}%` }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 主体：左叙事 + 右历史 */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* 左侧 */}
          <div className="md:col-span-2 space-y-5">
            {/* 前半生回顾 */}
            {state.backstory_summary && (
              <div className={`rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 p-5 shadow-sm transition-all ${showSummary ? '' : 'opacity-90'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    <span className="font-bold text-indigo-900">前半生回顾</span>
                  </div>
                  <button
                    onClick={() => setShowSummary(v => !v)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    {showSummary ? '收起' : '展开'}
                  </button>
                </div>
                {showSummary && (
                  <p className="mt-3 text-sm leading-relaxed text-indigo-800">
                    {state.backstory_summary}
                  </p>
                )}
              </div>
            )}

            {/* 年度事件头卡 */}
            {logs.length > 0 && (
              <div className="animate-slide-show-in rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 p-4 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-white/80">{state.age} 岁 · 第 {logs.length} 年</div>
                  <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                    {result ? (result.event.title || "人生节点") : turn?.event ? (turn.event.title || "人生节点") : "等待开始"}
                  </span>
                </div>
              </div>
            )}

            {/* 中央交互卡片 */}
            <div className="relative min-h-[300px] overflow-hidden rounded-3xl bg-white p-6 shadow-xl backdrop-blur border border-white/60">
              {/* 顶部渐变条 */}
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

              {(state.is_active === 0 || summary) && (
                <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up">
                  <div className="mb-6 text-center">
                    <div className="mb-2 text-4xl">🕯️</div>
                    <h2 className="text-2xl font-bold text-gray-900">人生谢幕</h2>
                    <p className="mt-2 text-lg text-gray-600">{state.cause_of_death || summary?.state?.cause_of_death || "这一生走到了尽头。"}</p>
                    <p className="mt-1 text-sm text-gray-500">享年 {state.age} 岁 · 人生 #{state.id}</p>
                  </div>

                  {summary && (
                    <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-gray-50 p-5">
                      <div className="mb-4 grid grid-cols-2 gap-4 text-center">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="text-xl font-bold text-purple-600">{summary.totalYears}</div>
                          <div className="text-xs text-gray-500">存活年数</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="text-xl font-bold text-emerald-600">{summary.maxMoney}</div>
                          <div className="text-xs text-gray-500">巅峰财富</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="text-xl font-bold text-rose-600">{summary.totalSudden}</div>
                          <div className="text-xs text-gray-500">遭遇突发</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="text-xl font-bold text-blue-600">{summary.maxHappiness}</div>
                          <div className="text-xs text-gray-500">最高快乐</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">{summary.finalCareer}</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{summary.finalEducation}</span>
                        {summary.isMarried && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">已婚</span>}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={async () => {
                        const newLife = await api.createLife();
                        router.push(`/life/${newLife.id}`);
                      }}
                      className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    >
                      🔄 开启新人生
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="rounded-2xl bg-gray-200 px-8 py-3 text-lg font-semibold text-gray-700 shadow transition-all hover:bg-gray-300"
                    >
                      🏠 返回首页
                    </button>
                  </div>
                </div>
              )}

              {state.is_active !== 0 && !turn && !result && (
                <div className="flex flex-col items-center justify-center py-14 animate-fade-in-up">
                  {suddenEvents.length > 0 && (
                    <div className="mb-6 w-full max-w-lg space-y-4">
                      {suddenEvents.map((se, idx) => {
                        const hasNegative = se.results.some((r: any) => (r.delta ?? 0) < 0);
                        const cardClass = hasNegative
                          ? "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50"
                          : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50";
                        const titleClass = hasNegative ? "text-rose-700" : "text-emerald-700";
                        return (
                          <div key={idx} className={`rounded-2xl border ${cardClass} p-5 animate-slide-show-in`}>
                            <div className={`mb-1 text-sm font-bold ${titleClass}`}>⚡ {se.event.title}</div>
                            <p className="text-gray-700">{se.event.description}</p>
                            {se.results.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {se.results.map((r: any, i: number) => {
                                  const labelMap: Record<string, string> = {
                                    money: "💰 财力", attribute: r.target ? `🎯 ${r.target}` : "🎯 属性",
                                    career: "💼 职业", education: "🎓 学历", family: "🏠 家庭",
                                    happiness: "😊 快乐", health: "❤️ 健康",
                                  };
                                  const val = r.delta ?? 0;
                                  const tone = val > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : val < 0 ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-100 text-gray-700 border-gray-200";
                                  return (
                                    <span key={i} className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
                                      {labelMap[r.type] || r.type} {val > 0 ? `+${val}` : val} → {r.newValue}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="mb-6 text-center text-lg text-gray-600">这一年剧本尚未翻开，点击按钮推进人生。</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleNextTurn}
                      disabled={loading}
                      className="next-year-btn rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                    >
                      {loading ? "进行中..." : logs.length === 0 ? "🎬 开始人生" : "⏭ 下一年"}
                    </button>
                    <button
                      onClick={handleGenerateAI}
                      disabled={loading}
                      className="rounded-2xl bg-fuchsia-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-fuchsia-700 disabled:opacity-50"
                    >
                      {loading ? "生成中..." : "✨ 来点意外的"}
                    </button>
                  </div>
                </div>
              )}

              {state.is_active !== 0 && turn && turn.event === null && (
                <div className="flex flex-col items-center justify-center py-14 animate-fade-in-up">
                  <p className="mb-6 text-center text-lg text-gray-600">这一年平平淡淡，没有什么特别的事情发生。</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleSkipYear}
                      disabled={loading}
                      className="rounded-2xl bg-gray-800 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-900 disabled:opacity-50"
                    >
                      {loading ? "进行中..." : "⏭ 继续下一年"}
                    </button>
                    <button
                      onClick={handleGenerateAI}
                      disabled={loading}
                      className="rounded-2xl bg-fuchsia-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-fuchsia-700 disabled:opacity-50"
                    >
                      {loading ? "生成中..." : "✨ 来点意外的"}
                    </button>
                  </div>
                </div>
              )}

              {state.is_active !== 0 && turn?.event && (
                <div className="space-y-5 animate-card-flip">
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
                    <h3 className="mb-3 text-2xl font-bold text-indigo-900">{turn.event.title}</h3>
                    <p className="text-lg leading-relaxed text-indigo-800">{turn.event.description}</p>
                  </div>
                  {turn.options.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {turn.options.map((opt, idx) => {
                        const tone = [
                          { border: "border-blue-200", bg: "bg-blue-50", hover: "hover:border-blue-400 hover:bg-blue-100" },
                          { border: "border-purple-200", bg: "bg-purple-50", hover: "hover:border-purple-400 hover:bg-purple-100" },
                          { border: "border-emerald-200", bg: "bg-emerald-50", hover: "hover:border-emerald-400 hover:bg-emerald-100" },
                        ][idx % 3];
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleChoose(opt.id)}
                            disabled={loading}
                            className={`card-hover rounded-2xl border-2 ${tone.border} ${tone.bg} p-5 text-left transition-all disabled:opacity-50`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-semibold text-gray-900">{opt.text}</span>
                              <span className="text-sm font-medium text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">选这个 →</span>
                            </div>
                            {opt.description && <div className="mt-2 text-sm text-gray-500">{opt.description}</div>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <button
                        onClick={handleSkipYear}
                        disabled={loading}
                        className="rounded-2xl bg-gray-800 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-900 disabled:opacity-50"
                      >
                        {loading ? "进行中..." : "⏭ 继续下一年"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {message && !turn && !result && <div className="py-8 text-center text-gray-600">{message}</div>}

              {state.is_active !== 0 && result && (
                <div className="space-y-5 animate-slide-show-in">
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                    <h3 className="mb-3 text-2xl font-bold text-emerald-900">{result.event.title}</h3>
                    <p className="text-lg text-emerald-800">你选择了「{result.option.text}」，结果如下：</p>
                  </div>

                  {result.results.length > 0 && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span className="font-semibold text-gray-700">这一年账本公开</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.results.map((r, idx) => {
                          const labelMap: Record<string, string> = {
                            money: "💰 财力",
                            attribute: r.target ? `🎯 ${r.target}` : "🎯 属性",
                            career: "💼 职业",
                            education: "🎓 学历",
                            family: "🏠 家庭",
                            happiness: "😊 快乐",
                            health: "❤️ 健康",
                          };
                          const label = labelMap[r.type] || r.type;
                          const val = r.delta ?? 0;
                          const tone = val > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : val < 0 ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-100 text-gray-700 border-gray-200";
                          return (
                            <span key={idx} className={`animate-text-reveal rounded-full border px-4 py-2 text-sm font-medium ${tone}`} style={{ animationDelay: `${idx * 0.08}s` }}>
                              {label} {val > 0 ? `+${val}` : val} → {r.newValue}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {result.sudden_events && result.sudden_events.length > 0 && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5 animate-slide-show-in">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <span className="font-semibold text-rose-700">突发事件</span>
                      </div>
                      <div className="space-y-3">
                        {result.sudden_events.map((se, idx) => (
                          <div key={idx}>
                            <div className="font-medium text-rose-800">{se.event.title}</div>
                            <p className="text-sm text-rose-700/80">{se.event.description}</p>
                            {se.results.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {se.results.map((r, i) => {
                                  const labelMap: Record<string, string> = {
                                    money: "💰 财力", attribute: r.target ? `🎯 ${r.target}` : "🎯 属性",
                                    career: "💼 职业", education: "🎓 学历", family: "🏠 家庭",
                                    happiness: "😊 快乐", health: "❤️ 健康",
                                  };
                                  const val = r.delta ?? 0;
                                  const tone = val > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : val < 0 ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-100 text-gray-700 border-gray-200";
                                  return (
                                    <span key={i} className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
                                      {labelMap[r.type] || r.type} {val > 0 ? `+${val}` : val} → {r.newValue}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={handleNextTurn}
                      disabled={loading}
                      className="next-year-btn rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                    >
                      {loading ? "进行中..." : "⏭ 继续下一年"}
                    </button>
                  </div>
                </div>
              )}

              {/* Humor Quote */}
              {humor && (
                <div className="mt-6 rounded-xl border-l-4 border-fuchsia-400 bg-fuchsia-50/60 p-4 animate-text-reveal">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700">今日金句</div>
                  <div className="font-medium leading-relaxed text-fuchsia-900">{humor.content}</div>
                </div>
              )}
            </div>

            {/* 控制栏 */}
            {state.is_active !== 0 && (
              <div className="flex flex-wrap gap-3">
                <button onClick={handleEndGame} className="rounded-xl bg-rose-100 px-5 py-3 font-semibold text-rose-700 transition-all hover:bg-rose-200">🏁 结束人生</button>
              </div>
            )}
          </div>

          {/* 右侧：人生轨迹 */}
          <div className="rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur border border-white/60">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <span>📜</span> 人生轨迹
              <span className="text-xs font-normal text-gray-500">({logs.length} 年)</span>
            </h3>
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">人生刚刚开始...</p>
              ) : (
                logs.slice().reverse().map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{log.age}岁</span>
                        <span className="font-mono font-bold text-purple-600">{log.event_title || "平淡的一年"}</span>
                        {log.sudden_title && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                            ⚡{log.sudden_title}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.option_text && <div className="mb-2 text-sm text-gray-600">选择了：{log.option_text}</div>}
                    {/* 简单展示结果摘要（尝试解析 JSON） */}
                    <ResultTags resultJson={log.result} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultTags({ resultJson }: { resultJson: string }) {
  try {
    const arr = JSON.parse(resultJson || "[]") as Array<{ type: string; target?: string; delta?: number; newValue?: number | string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {arr.slice(0, 4).map((r, idx) => {
          const labelMap: Record<string, string> = { money: "💰", attribute: "🎯", career: "💼", education: "🎓", family: "🏠", happiness: "😊", health: "❤️" };
          const v = r.delta ?? 0;
          const tone = v > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : v < 0 ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-gray-100 text-gray-700 border-gray-200";
          return (
            <span key={idx} className={`rounded-full border px-2 py-0.5 text-xs ${tone}`}>
              {labelMap[r.type] || r.type} {v > 0 ? `+${v}` : v}
            </span>
          );
        })}
        {arr.length > 4 && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{arr.length - 4}</span>}
      </div>
    );
  } catch {
    return null;
  }
}
