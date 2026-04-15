'use client';

import React, { useState } from 'react';

// 1. 类型定义
type FamilyType = 'RICH' | 'SYSTEM' | 'EDUCATED' | 'NORMAL' | 'POOR' | 'BUSINESS' | 'WINNER';

interface Family {
  type: FamilyType;
  name: string;
  moneyBase: number;
  intelligenceBase: number;
  networkBase: number;
  description: string;
  probability: number; // 概率百分比
}

interface PlayerStats {
  money: number;
  intelligence: number;
  network: number;
}

// 2. 核心数据配置
const FAMILIES: Family[] = [
  // 隐藏款 (0.1% 概率)
  { type: 'WINNER', name: '👑 隐藏款：拆二代', moneyBase: 120, intelligenceBase: 30, networkBase: 90, description: '你出生在一个充满暴发户气息的家庭，家里有个红圈写着"拆"！', probability: 0.1 },
  // 常规款 (合计 99.9%)
  { type: 'RICH', name: '💎 富裕家庭', moneyBase: 80, intelligenceBase: 60, networkBase: 80, description: '你出生在一个富裕家庭，衣食无忧。', probability: 4.9 },
  { type: 'SYSTEM', name: '🏛️ 体制内家庭', moneyBase: 60, intelligenceBase: 65, networkBase: 70, description: '你出生在体制内家庭，追求稳定。', probability: 15 },
  { type: 'EDUCATED', name: '📚 教师家庭', moneyBase: 50, intelligenceBase: 75, networkBase: 50, description: '你出生在教师家庭，家里对你寄予厚望。', probability: 15 },
  { type: 'NORMAL', name: '🏠 普通家庭', moneyBase: 50, intelligenceBase: 50, networkBase: 50, description: '你出生在普通家庭，平平淡淡。', probability: 40 },
  { type: 'POOR', name: '🍂 贫困家庭', moneyBase: 20, intelligenceBase: 45, networkBase: 20, description: '你出生在一个拮据的家庭，早早懂事。', probability: 20 },
  { type: 'BUSINESS', name: '💼 经商家庭', moneyBase: 65, intelligenceBase: 50, networkBase: 75, description: '你出生在经商家庭，从小耳濡目染。', probability: 5 },
];

// 3. 主组件
export default function ReincarnationSimulator() {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // 辅助函数：生成 -10 到 +10 的随机波动
  const fluctuate = (base: number) => base + Math.floor(Math.random() * 21) - 10;

  // 核心逻辑：加权随机抽取家庭
  const rollFamily = () => {
    setIsRolling(true);
    setCurrentFamily(null);
    setPlayerStats(null);

    setTimeout(() => {
      const rand = Math.random() * 100;
      let cumulativeProbability = 0;
      let selectedFamily = FAMILIES[FAMILIES.length - 2]; // 默认兜底普通家庭

      for (const family of FAMILIES) {
        cumulativeProbability += family.probability;
        if (rand <= cumulativeProbability) {
          selectedFamily = family;
          break;
        }
      }

      setCurrentFamily(selectedFamily);
      setPlayerStats({
        money: fluctuate(selectedFamily.moneyBase),
        intelligence: fluctuate(selectedFamily.intelligenceBase),
        network: fluctuate(selectedFamily.networkBase),
      });
      setIsRolling(false);
    }, 600); // 模拟一点点“加载/抽卡”的延迟感
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100 font-sans">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎲 投胎模拟器</h2>
        <p className="text-gray-500 text-sm">看看你这辈子拿到的是什么剧本</p>
      </div>

      <button
        onClick={rollFamily}
        disabled={isRolling}
        className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all 
          ${isRolling ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 active:scale-95 shadow-md'}`}
      >
        {isRolling ? '命运齿轮转动中...' : '立即重开'}
      </button>

      {currentFamily && playerStats && (
        <div className="mt-8 animate-fade-in-up">
          {/* 结果卡片 */}
          <div className={`p-5 rounded-lg border-2 ${
            currentFamily.type === 'WINNER' ? 'border-yellow-400 bg-yellow-50' : 
            currentFamily.type === 'RICH' || currentFamily.type === 'BUSINESS' ? 'border-blue-300 bg-blue-50' : 
            'border-gray-200 bg-gray-50'
          }`}>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{currentFamily.name}</h3>
            <p className="text-gray-600 mb-6 italic">"{currentFamily.description}"</p>

            {/* 属性面板 */}
            <div className="space-y-3">
              <StatBar label="💰 初始资金" value={playerStats.money} color="bg-green-500" />
              <StatBar label="🧠 智商发育" value={playerStats.intelligence} color="bg-blue-500" />
              <StatBar label="🤝 隐藏人脉" value={playerStats.network} color="bg-purple-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 简单的属性条子组件
function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  // 限制进度条宽度最高100%
  const width = Math.min(Math.max(value, 0), 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-medium text-gray-700">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${width}%` }}></div>
      </div>
    </div>
  );
}