/**
 * 人生重开模拟器 - 类型定义
 */

// ========== 核心玩家属性 ==========
export interface PlayerStats {
  money: number;        // 财力 (0-100，负数表示负债)
  intelligence: number; // 智力 (0-100)
  appearance: number;   // 外貌 (0-100)
  health: number;       // 健康 (0-100)
  happiness: number;    // 快乐 (0-100)
  network?: number;     // 人脉 (0-100，可选)
}

// ========== 出身家庭类型 ==========
export type FamilyType = 
  | 'RICH'      // 富裕家庭
  | 'SYSTEM'    // 体制内家庭
  | 'EDUCATED'  // 书香门第
  | 'NORMAL'    // 普通家庭
  | 'POOR'      // 贫困家庭
  | 'BUSINESS'  // 经商家庭
  | 'WINNER';   // 隐藏：拆迁户

export interface BirthFamily {
  type: FamilyType;
  description: string;
  initialMoney: number;      // 初始资金加成
  intelligenceBonus: number; // 智力加成
  appearanceBonus: number;   // 外貌加成
  healthBonus: number;       // 健康加成
  specialEvents: string[];   // 特殊事件池
}

// ========== 人生状态 ==========
export type LifeStateType = 
  | 'normal'      // 普通
  | 'student'     // 学生
  | 'worker'      // 打工人
  | 'business'    // 创业
  | 'freelancer'  // 自由职业
  | 'civil'       // 体制内
  | 'hermit'      // 隐居
  | 'beggar'      // 乞讨
  | 'criminal'    // 犯罪
  | 'addict'      // 成瘾
  | 'delinquent'  // 问题少年/不良少年
  | 'retired'     // 退休
  | 'elder'       // 老年
  | 'debt'        // 负债
  | 'bankrupt';   // 破产

// ========== 金钱状态 ==========
export type MoneyStatus = 'broke' | 'struggling' | 'decent' | 'comfortable' | 'rich';

// ========== 人生事件 ==========
export type EventRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 人生阶段
export type LifeStage = 'infant' | 'child' | 'teen' | 'youngAdult' | 'adult' | 'middleAge' | 'elderly';

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  minAge: number;
  maxAge: number;
  rarity: EventRarity;
  effects?: Partial<PlayerStats>;
  requiredStats?: {
    [K in keyof PlayerStats]?: {
      min?: number;
      max?: number;
    };
  };
  lifeStateTriggers?: LifeStateType[];
  familyBonus?: Partial<Record<FamilyType, number>>;
  gender?: 'male' | 'female' | 'both'; // 性别限定
  isChoice?: boolean;      // 是否为选择事件
  choices?: ChoiceOption[]; // 选择选项
}

// ========== 进行中的追求目标 ==========
export interface OngoingPursuit {
  id: string;                   // 目标ID: 'civil_exam', 'postgrad', 'job_hunt' 等
  name: string;                 // 目标名称
  startedAt: number;            // 开始年龄
  attempts: number;             // 尝试次数
  lastAttemptAge?: number;      // 上次尝试年龄
  status: 'ongoing' | 'paused' | 'abandoned' | 'succeeded';
  baseSuccessRate: number;      // 基础成功率 (0-1)
  accumulatedStress: number;    // 累积压力
  history: {
    age: number;
    result: 'failed' | 'passed' | 'gave_up' | 'paused';
    description: string;
  }[];
}

// ========== 玩家状态 ==========
export interface PlayerState {
  age: number;
  gender: 'male' | 'female';
  name: string;                 // 姓名
  birthYear: number;            // 出生年份
  birthplace: string;           // 出生地
  birthFamily: BirthFamily;
  lifeState: LifeStateType;
  stats: PlayerStats;
  usedEvents: Set<string>;      // 已触发的事件
  majorChoices: MajorChoice[];  // 重大选择记录
  lifePath: string[];           // 人生轨迹记录
  eraEvents: string[];          // 经历过的时代事件
  birthplaceEvents: string[];   // 经历过的出生地事件
  ongoingPursuits: OngoingPursuit[];  // 正在进行的目标追求
  gapYears: number;             // 累计gap年数
  lastSalary: number;           // 上一份工作的薪资水平 (0-100)
}

// ========== 重大选择记录 ==========
export interface MajorChoice {
  age: number;
  sceneId: string;
  choiceId: string;
  description: string;
  lifeState?: LifeStateType;  // 选择后的人生状态
}

// ========== 游戏阶段 ==========
export type GamePhase = 
  | 'intro'      // 开场
  | 'create'     // 角色创建
  | 'born'       // 出生
  | 'living'     // 人生中
  | 'choice'     // 选择节点
  | 'input'      // 输入节点
  | 'summary';   // 人生总结

// ========== 年度记录 ==========
export interface YearRecord {
  year: number;
  age: number;
  narrative: string;
  eventTitle?: string;
  headline?: string;
  changeEntries?: string[];
}

// ========== 选择场景 ==========
export interface ChoiceScene {
  id: string;
  title: string;
  description: string;
  age: number;
  options: ChoiceOption[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  description?: string;      // 选项详细描述
  effects?: Partial<PlayerStats>;
  lifeState?: LifeStateType;
  followUpScene?: string;
  narrative?: string;        // 选择后的叙事
  followUpEvents?: string[]; // 后续事件
}

// ========== 输入场景 ==========
export interface InputScene {
  id: string;
  title: string;
  description: string;
  ageRange: [number, number];
  hint: string;
  keywords: Record<string, {
    path: string;
    weight: number;
  }>;
}

// ========== AI叙事相关 ==========
export interface AINarrativeRequest {
  playerState: PlayerState;
  yearContext: {
    currentYear: number;
    recentEvents: string[];
    lifePathSummary: string;
  };
}

export interface AINarrativeResponse {
  narrative: string;
  eventTitle?: string;
  eventDescription?: string;
  statChanges: Partial<PlayerStats>;
  newLifeState?: LifeStateType;
  interaction?: {
    type: 'choice' | 'input';
    sceneId: string;
    options?: ChoiceOption[];
    inputHint?: string;
  };
  ending?: {
    type: 'death' | 'enlightenment' | 'breakdown' | 'natural';
    reason: string;
  };
  tags: string[];
}

// ========== 游戏结局 ==========
export type EndingType = 'death' | 'enlightenment' | 'breakdown' | 'natural';

export interface GameEnding {
  type: EndingType;
  reason: string;
  age: number;
  finalStats: PlayerStats;
  summary: string;
}

// ========== 人生总结 ==========
export interface LifeSummary {
  summary: string;
  achievements: string[];
  regrets: string[];
  finalComment: string;
  statistics: {
    totalYears: number;
    stateTransitions: number;
    majorChoices: number;
    averageHappiness: number;
    peakMoney: number;
    lowestHealth: number;
  };
}
