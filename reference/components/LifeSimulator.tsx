'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlayerState, 
  GamePhase, 
  ChoiceScene,
  LifeEvent,
  ChoiceOption,
  LifeStateType,
  YearRecord
} from '@/lib/types';
import { generateBirthFamily, FAMILY_NAMES, getFamilyFlavorText } from '@/lib/familySystem';
import { getAINarrative, AINarrativeResult, generateLifeSummary, isKeyDecisionAge } from '@/lib/aiService';
import { START_YEAR, END_YEAR, getEraByBirthYear, generateEraDescription, getEraPreviewCommentary, getEraSpecificRoast } from '@/lib/eraSystem';
import { HUMOR_BIRTHPLACES, getBirthplaceById, getBirthplaceEvent, getBirthplacePreviewCommentary, BirthplaceType } from '@/lib/birthplaceSystem';
import { classifyInput, generateInputResponse, getSceneById } from '@/lib/inputProcessor';
import type { InputScene } from '@/lib/types';
import { determineLifeState, getLifeStateDescription, LIFE_STATE_NAMES, STATE_EFFECTS } from '@/lib/lifeState';
import { startPursuit, attemptPursuit, takeGapYear, abandonPursuit, resumePursuit, PURSUITS } from '@/lib/pursuitSystem';
import { tryTriggerRandomEvent, generateEventNarrative } from '@/lib/randomEvents';
import { getStatDrivenEvents, calculateEventProbability, StatDrivenEvent } from '@/lib/statDrivenEvents';
import { 
  initDatabase, 
  saveGameSession, 
  getGameSession, 
  clearGameSession, 
  saveArchive, 
  startAutoSave, 
  stopAutoSave,
  ArchiveRecord,
  getAllArchives,
  deleteArchive
} from '@/lib/archiveDatabase';

// 游戏速度（固定为适中速度，配合幻灯片效果）
const YEAR_TRANSITION_DURATION = 2000; // 2秒/年，留出时间看动画效果

const PREVIEW_NAME_FALLBACK = '无名氏';
type VisualCueTone = 'positive' | 'negative' | 'neutral';

function getVisualCueFromEntries(entries: string[]): VisualCueTone {
  const score = entries.reduce((acc, item) => {
    if (item.includes('+')) return acc + 1;
    if (item.includes('-')) return acc - 1;
    return acc;
  }, 0);

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function getNameRoast(name: string) {
  if (!name.trim()) {
    return '名字还没填，命运系统先给你挂了个“无名氏”档案，主打一个先活着再补手续。';
  }
  if (name.length <= 2) {
    return `“${name}”这名字短小有力，像是老师点名和亲戚催婚时都不容易念错的类型。`;
  }
  if (name.length >= 4) {
    return `“${name}”这名字信息量很足，一听就像家里当年翻了好几本字典才定下来的。`;
  }
  return `“${name}”这名字听着挺稳，像是会在班主任、HR 和物业群里都留下痕迹的人。`;
}

function formatStatPreview(value: number, label: string) {
  if (value >= 85) return `${label}拉满`;
  if (value >= 70) return `${label}在线`;
  if (value >= 50) return `${label}还行`;
  return `${label}得补`;
}

function formatStatChangeLabel(key: string, value: number) {
  const labels: Record<string, string> = {
    money: '财力',
    intelligence: '智力',
    appearance: '外貌',
    health: '健康',
    happiness: '快乐'
  };

  const prefix = value > 0 ? '+' : '';
  return `${labels[key] || key}${prefix}${value}`;
}

function getChoiceEffectSummary(option: ChoiceOption) {
  if (!option.effects) return '这条路先看气质，账回头再算。';

  const summary = Object.entries(option.effects)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => formatStatChangeLabel(key, value as number))
    .join(' · ');

  return summary || '表面看不出代价，往往才最像人生。';
}

export default function LifeSimulator() {
  // ========== 游戏状态 ==========
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [currentNarrative, setCurrentNarrative] = useState('');
  const [yearRecords, setYearRecords] = useState<YearRecord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // 年度切换动画状态
  const [isYearTransitioning, setIsYearTransitioning] = useState(false);
  
  // 手动控制模式 - 默认手动模式
  const [manualMode, setManualMode] = useState(true);
  const [waitingForNextYear, setWaitingForNextYear] = useState(true);
  const [showYearComplete, setShowYearComplete] = useState(false);
    
  // 交互状态
  const [currentChoice, setCurrentChoice] = useState<ChoiceScene | null>(null);
  const [currentInput, setCurrentInput] = useState<InputScene | null>(null);
  const [inputText, setInputText] = useState('');
  
  // 突发事件弹窗
  const [eventModal, setEventModal] = useState<{
    show: boolean;
    title: string;
    description: string;
    effects: { label: string; value: string; isPositive: boolean }[];
    // 交互式选择
    hasChoice?: boolean;
    choiceOptions?: {
      accept: { text: string; effects: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>> };
      reject: { text: string; effects: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>> };
    };
    onChoice?: (accepted: boolean) => void;
  }>({ show: false, title: '', description: '', effects: [] });
  
  // 事件队列（用于多个事件依次显示）
  const eventQueueRef = useRef<Array<{
    title: string;
    description: string;
    effects: { label: string; value: string; isPositive: boolean }[];
    hasChoice?: boolean;
    choiceOptions?: any;
    onChoice?: (accepted: boolean) => void;
  }>>([]);
  
  // 历史事件 Toast 提示
  const [historyToast, setHistoryToast] = useState<{
    show: boolean;
    year: number;
    title: string;
    description: string;
  }>({ show: false, year: 0, title: '', description: '' });
  
  // 支线任务弹窗
  const [sideQuestModal, setSideQuestModal] = useState<{
    show: boolean;
    eventTitle: string;
    quests: import('@/lib/birthplaceSystem').SideQuest[];
    selectedQuest: import('@/lib/birthplaceSystem').SideQuest | null;
  }>({ show: false, eventTitle: '', quests: [], selectedQuest: null });
  
  // 角色创建状态
  const [playerName, setPlayerName] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [birthYear, setBirthYear] = useState(1990);
  const [selectedBirthplace, setSelectedBirthplace] = useState<BirthplaceType>('first_tier_city');
  
  // AI叙事状态
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [pendingNarrative, setPendingNarrative] = useState<AINarrativeResult | null>(null);
  const [yearVisualCue, setYearVisualCue] = useState<VisualCueTone>('neutral');
  const [visualCueToken, setVisualCueToken] = useState(0);
  
  // 游戏结束总结
  const [lifeSummary, setLifeSummary] = useState<{
    summary: string;
    achievements: string[];
    regrets: string[];
    finalComment: string;
    aiEvaluation: string;
  } | null>(null);
  
  // 档案查看
  const [showArchives, setShowArchives] = useState(false);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const narrativeQueueRef = useRef<AINarrativeResult[]>([]);

  // ========== 页面加载时恢复状态 ==========
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await initDatabase();
        const session = await getGameSession();
        
        if (session && session.playerState) {
          // 恢复游戏状态
          setPlayerState(session.playerState);
          setCurrentNarrative(session.currentNarrative);
          setYearRecords(session.yearRecords);
          setGamePhase(session.gamePhase as GamePhase);
          setCurrentChoice(session.currentChoice);
          setCurrentInput(session.currentInput);
          setInputText(session.inputText);
          
          if (session.gamePhase === 'living') {
            setManualMode(true);
            setWaitingForNextYear(true);
          }
          
          console.log('[Session] 游戏状态已恢复');
        }
      } catch (error) {
        console.error('[Session] 恢复失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  // ========== 自动保存 ==========
  useEffect(() => {
    startAutoSave(() => ({
      playerState,
      currentNarrative,
      yearRecords,
      gamePhase,
      currentChoice,
      currentInput,
      inputText,
    }));
    
    return () => stopAutoSave();
  }, [playerState, currentNarrative, yearRecords, gamePhase, currentChoice, currentInput, inputText]);

  // ========== 游戏初始化 ==========
  const startGame = () => {
    setGamePhase('create');
  };
  
  // 确认角色创建，进入出生
  const confirmCharacter = () => {
    const family = generateBirthFamily();
    const era = getEraByBirthYear(birthYear);
    const birthplace = getBirthplaceById(selectedBirthplace);
    
    const initialState: PlayerState = {
      age: 0,
      gender: selectedGender,
      name: playerName || '无名氏',
      birthYear: birthYear,
      birthplace: selectedBirthplace,
      birthFamily: family,
      lifeState: 'normal',
      stats: {
        money: family.initialMoney + (era.statModifiers.money || 0),
        intelligence: family.intelligenceBonus + (era.statModifiers.intelligence || 0) + Math.floor(Math.random() * 20) + 40,
        appearance: family.appearanceBonus + (era.statModifiers.appearance || 0) + Math.floor(Math.random() * 40) + 40,
        health: family.healthBonus + (era.statModifiers.health || 0) + Math.floor(Math.random() * 20) + 70,
        happiness: (era.statModifiers.happiness || 0) + Math.floor(Math.random() * 20) + 50
      },
      usedEvents: new Set(),
      majorChoices: [],
      lifePath: [],
      eraEvents: [],
      birthplaceEvents: [],
      ongoingPursuits: [],
      gapYears: 0,
      lastSalary: 0
    };
    
    setPlayerState(initialState);
    setYearRecords([]);
    setGamePhase('born');
    
    const eraDesc = generateEraDescription(birthYear, selectedGender);
    setCurrentNarrative(`${eraDesc}\n\n你出生在${birthplace.name}${birthplace.emoji}，${birthplace.description}。\n\n你出生在一个${FAMILY_NAMES[family.type]}家庭。${family.description}`);
  };

  const proceedToLiving = () => {
    setGamePhase('living');
    setIsPlaying(true);
  };

  // ========== AI叙事核心循环 ==========
  const generateYearNarrative = useCallback(async () => {
    if (!playerState) return;
    
    // 生成下一年的叙事（playerState.age 是当前年龄，要生成的是下一年的故事）
    const nextAge = playerState.age + 1;
    const isKeyNode = isKeyDecisionAge(nextAge);
    
    // 只有关键节点显示加载状态
    if (isKeyNode) {
      setIsGeneratingNarrative(true);
      console.log(`[${nextAge}岁] 关键节点，调用AI生成抉择...`);
    } else {
      console.log(`[${nextAge}岁] 普通年份，使用本地叙事`);
    }
    
    try {
      // 构建年度上下文 - 使用下一年的年龄
      const recentEvents = yearRecords.slice(-5).map(r => r.narrative);
      const lifePathSummary = playerState.lifePath.join(' → ') || '人生刚开始';
      
      // 临时修改 playerState 的 age 为 nextAge 来生成正确的叙事
      const stateForNarrative = { ...playerState, age: nextAge };
      
      const result = await getAINarrative(stateForNarrative, {
        currentYear: nextAge,
        recentEvents,
        lifePathSummary
      });
      
      setPendingNarrative(result);
      
      // 如果有交互，暂停游戏
      if (result.interaction) {
        setIsPlaying(false);
        
        if (result.interaction.type === 'choice') {
          // 这里应该从场景库加载选择场景
          const mockChoice: ChoiceScene = {
            id: result.interaction.sceneId,
            title: '人生抉择',
            description: result.narrative,
            age: nextAge,
            options: result.interaction.options || generateDefaultOptions(nextAge)
          };
          setCurrentChoice(mockChoice);
          setGamePhase('choice');
        } else {
          const scene = getSceneById(result.interaction.sceneId);
          if (scene) {
            setCurrentInput(scene);
            setGamePhase('input');
          }
        }
        return;
      }
      
      // 直接应用叙事结果
      applyNarrativeResult(result);
      
    } catch (error) {
      console.error('生成叙事失败:', error);
      // 使用默认叙事继续（使用 nextAge 确保年龄正确）
      const fallbackState = { ...playerState, age: nextAge };
      const fallbackResult = await getAINarrative(fallbackState, {
        currentYear: nextAge,
        recentEvents: [],
        lifePathSummary: 'fallback'
      });
      applyNarrativeResult(fallbackResult);
    } finally {
      // 关键节点需要重置加载状态
      if (isKeyNode) {
        setIsGeneratingNarrative(false);
      }
    }
  }, [playerState, yearRecords]);

  // 生成默认选项 - 包含光明与黑暗的选择
  const generateDefaultOptions = (age: number): ChoiceOption[] => {
    if (age === 6) {
      return [
        { id: 'study_hard', text: '认真学习', effects: { intelligence: 5, happiness: -2 } },
        { id: 'play_more', text: '多交朋友', effects: { happiness: 5, intelligence: 2 } },
        { id: 'skip_school', text: '逃学去网吧', effects: { happiness: 8, intelligence: -3, health: -2 }, lifeState: 'delinquent' },
        { id: 'bully', text: '欺负同学立威', effects: { appearance: 3, happiness: 5, intelligence: -2 }, lifeState: 'delinquent' }
      ];
    }
    if (age === 12) {
      return [
        { id: 'study_middle', text: '埋头苦读', effects: { intelligence: 6, happiness: -3 } },
        { id: 'first_love', text: '早恋', effects: { happiness: 8, intelligence: -4, appearance: 2 } },
        { id: 'fight', text: '加入校霸团体', effects: { appearance: 5, happiness: 6, intelligence: -5 }, lifeState: 'delinquent' },
        { id: 'game_addict', text: '沉迷游戏', effects: { happiness: 10, intelligence: -6, health: -3 } }
      ];
    }
    if (age === 15) {
      return [
        { id: 'exam_prep', text: '全力备战中考', effects: { intelligence: 7, happiness: -4 } },
        { id: 'drop_out', text: '辍学混社会', effects: { money: 5, intelligence: -8, happiness: 3 }, lifeState: 'worker' },
        { id: 'street_race', text: '街头飙车', effects: { happiness: 10, health: -5, money: -3 }, lifeState: 'delinquent' }
      ];
    }
    if (age === 18) {
      return [
        { id: 'gaokao', text: '参加高考，冲击大学', effects: { happiness: -5, money: -3 } },  // 启动高考追求
        { id: 'vocational', text: '直接读技校/专科', effects: { money: 3, intelligence: 2 }, lifeState: 'worker' },
        { id: 'work_direct', text: '不读了，直接打工', effects: { money: 5, happiness: -3 }, lifeState: 'worker' },
        { id: 'gang', text: '加入帮派', effects: { money: 10, appearance: 5, happiness: 8, health: -10 }, lifeState: 'criminal' },
        { id: 'nightclub', text: '夜场陪酒', effects: { money: 8, appearance: 3, happiness: -5, health: -5 }, lifeState: 'worker' }
      ];
    }
    if (age === 22) {
      return [
        { id: 'kaoyan', text: '考研深造（可二战/在职备考）', effects: { money: -3, happiness: -2 } },  // 启动考研追求
        { id: 'job', text: '踏实工作', effects: { money: 5, intelligence: 2 }, lifeState: 'worker' },
        { id: 'startup', text: '创业搏一把', effects: { money: -5, happiness: 5, intelligence: 3 }, lifeState: 'business' },
        { id: 'gamble', text: '赌博来钱快', effects: { money: 15, happiness: 10, health: -8 }, lifeState: 'criminal' },
        { id: 'sugar', text: '傍大款/富婆', effects: { money: 12, appearance: -3, happiness: -5 } }
      ];
    }
    if (age === 30) {
      return [
        { id: 'career', text: '专注事业', effects: { money: 8, happiness: -3 } },
        { id: 'family', text: '成家立业', effects: { happiness: 6, money: -2 } },
        { id: 'affair', text: '出轨找刺激', effects: { happiness: 10, appearance: -5, health: -3 } },
        { id: 'corrupt', text: '贪污受贿', effects: { money: 20, happiness: 5, appearance: -10 }, lifeState: 'criminal' }
      ];
    }
    if (age === 40) {
      return [
        { id: 'stable', text: '稳中求进', effects: { money: 5, happiness: 2 } },
        { id: 'midlife', text: '中年危机放纵', effects: { happiness: 8, money: -5, health: -5 } },
        { id: 'fraud', text: '金融诈骗', effects: { money: 25, appearance: -15, happiness: 10 }, lifeState: 'criminal' }
      ];
    }
    // 通用选项
    return [
      { id: 'safe', text: '稳扎稳打', effects: { money: 2, health: 1 } },
      { id: 'risk', text: '放手一搏', effects: { money: 5, happiness: -3 } },
      { id: 'happy', text: '及时行乐', effects: { happiness: 5, money: -2 } },
      { id: 'dark', text: '走捷径', effects: { money: 10, appearance: -5, health: -3 }, lifeState: 'criminal' },
      { id: 'drink', text: '借酒消愁', effects: { happiness: 6, health: -4, money: -2 } }
    ];
  };

  // 应用AI叙事结果
  const applyNarrativeResult = (result: AINarrativeResult) => {
    const stateEffect = STATE_EFFECTS[result.newLifeState || playerState?.lifeState || 'normal'] || {};

    const combinedChanges: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>> = {
      money: (result.statChanges.money || 0) + (stateEffect.money || 0),
      intelligence: (result.statChanges.intelligence || 0),
      appearance: (result.statChanges.appearance || 0),
      health: (result.statChanges.health || 0) + (stateEffect.health || 0),
      happiness: (result.statChanges.happiness || 0) + (stateEffect.happiness || 0)
    };

    setPlayerState(prev => {
      if (!prev) return null;

      const newState = { ...prev };
      newState.age += 1;

      // 应用属性变化
      if (result.statChanges.money !== undefined) {
        newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + result.statChanges.money));
      }
      if (result.statChanges.intelligence !== undefined) {
        newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + result.statChanges.intelligence));
      }
      if (result.statChanges.appearance !== undefined) {
        newState.stats.appearance = Math.max(0, Math.min(100, newState.stats.appearance + result.statChanges.appearance));
      }
      if (result.statChanges.health !== undefined) {
        newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + result.statChanges.health));
      }
      if (result.statChanges.happiness !== undefined) {
        newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + result.statChanges.happiness));
      }

      // 更新人生状态
      if (result.newLifeState) {
        newState.lifeState = result.newLifeState;
        newState.lifePath.push(`${newState.age}岁：成为${LIFE_STATE_NAMES[result.newLifeState]}`);
      }

      // 应用状态被动效果
      if (stateEffect) {
        if (stateEffect.money !== undefined) {
          newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + stateEffect.money));
        }
        if (stateEffect.happiness !== undefined) {
          newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + stateEffect.happiness));
        }
        if (stateEffect.health !== undefined) {
          newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + stateEffect.health));
        }
      }

      // 检查出生地事件
      const currentYear = newState.birthYear + newState.age;
      const birthplaceEvent = getBirthplaceEvent(newState.birthplace as BirthplaceType, currentYear);
      if (birthplaceEvent && !newState.birthplaceEvents.includes(birthplaceEvent.title)) {
        newState.birthplaceEvents.push(birthplaceEvent.title);
        if (birthplaceEvent.statEffects) {
          if (birthplaceEvent.statEffects.money !== undefined) {
            newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + birthplaceEvent.statEffects.money));
            combinedChanges.money = (combinedChanges.money || 0) + birthplaceEvent.statEffects.money;
          }
          if (birthplaceEvent.statEffects.happiness !== undefined) {
            newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + birthplaceEvent.statEffects.happiness));
            combinedChanges.happiness = (combinedChanges.happiness || 0) + birthplaceEvent.statEffects.happiness;
          }
          if (birthplaceEvent.statEffects.health !== undefined) {
            newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + birthplaceEvent.statEffects.health));
            combinedChanges.health = (combinedChanges.health || 0) + birthplaceEvent.statEffects.health;
          }
          if (birthplaceEvent.statEffects.intelligence !== undefined) {
            newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + birthplaceEvent.statEffects.intelligence));
            combinedChanges.intelligence = (combinedChanges.intelligence || 0) + birthplaceEvent.statEffects.intelligence;
          }
        }
      }

      return newState;
    });

    // 检查是否有出生地事件
    const currentYear = (playerState?.birthYear || 1990) + (playerState?.age || 0) + 1;
    const birthplaceEvent = playerState ? getBirthplaceEvent(playerState.birthplace as BirthplaceType, currentYear) : null;

    // 显示历史事件 Toast（出生地相关的历史事件）
    if (birthplaceEvent && playerState && !playerState.birthplaceEvents.includes(birthplaceEvent.title)) {
      setHistoryToast({
        show: true,
        year: currentYear,
        title: birthplaceEvent.title,
        description: birthplaceEvent.description
      });
      
      // 如果有支线任务，显示选择弹窗
      if (birthplaceEvent.sideQuests && birthplaceEvent.sideQuests.length > 0) {
        // 过滤符合条件的支线任务
        const availableQuests = birthplaceEvent.sideQuests.filter(quest => {
          const ageOk = nextAge >= (quest.requirements.minAge || 0) && 
                       nextAge <= (quest.requirements.maxAge || 100);
          const statsOk = !quest.requirements.minStats || 
                         Object.entries(quest.requirements.minStats).every(
                           ([key, val]) => (playerState.stats[key as keyof typeof playerState.stats] || 0) >= val
                         );
          return ageOk && statsOk;
        });
        
        if (availableQuests.length > 0) {
          setTimeout(() => {
            setSideQuestModal({
              show: true,
              eventTitle: birthplaceEvent.title,
              quests: availableQuests,
              selectedQuest: null
            });
          }, 1000);
        }
      }
      
      // 3秒后自动隐藏
      setTimeout(() => {
        setHistoryToast(prev => ({ ...prev, show: false }));
      }, 5000);
    }

    // 构建完整叙事
    const fullNarrative = result.narrative;

    // 更新叙事显示
    setCurrentNarrative(fullNarrative);

    // 记录年度
    const changeEntries = Object.entries(combinedChanges)
      .filter(([, value]) => value !== undefined && value !== 0)
      .map(([key, value]) => formatStatChangeLabel(key, value as number));
    const statChangeStr = changeEntries.join('，');
    const nextAge = (playerState?.age || 0) + 1;
    const yearHeadline = `${currentYear}年 · ${nextAge}岁 · ${LIFE_STATE_NAMES[result.newLifeState || playerState?.lifeState || 'normal']}`;
    setYearVisualCue(getVisualCueFromEntries(changeEntries));
    setVisualCueToken((prev) => prev + 1);

    setYearRecords(prev => [...prev, {
      age: nextAge,
      year: currentYear,
      headline: yearHeadline,
      narrative: fullNarrative,
      eventTitle: result.eventTitle || (birthplaceEvent ? birthplaceEvent.title : undefined),
      changeEntries
    }]);

    // ===== 随机事件触发 =====
    // 使用 setTimeout 让随机事件在年度记录之后触发，产生连锁感
    setTimeout(() => {
      if (!playerState) return;

      const randomEvent = tryTriggerRandomEvent(playerState);
      if (randomEvent) {
        // 标记事件已触发
        const eventKey = `${randomEvent.id}_${Math.floor(playerState.age / 5)}`;
        playerState.usedEvents.add(eventKey);

        // 生成事件叙事
        const eventNarrative = generateEventNarrative(randomEvent, playerState);

        // 准备事件效果数据
        const eventChangeEntries = Object.entries(randomEvent.effects)
          .filter(([, value]) => value !== undefined && value !== 0)
          .map(([key, value]) => formatStatChangeLabel(key, value as number));

        // 显示突发事件弹窗（使用队列）
        showEventModal({
          title: randomEvent.title,
          description: eventNarrative,
          effects: eventChangeEntries.map(entry => ({
            label: entry.split(/\+|-/)[0],
            value: entry.match(/[+-]\d+/)?.[0] || '',
            isPositive: entry.includes('+')
          }))
        });

        // 应用事件效果到 playerState
        setPlayerState(prev => {
          if (!prev) return null;
          const newState = { ...prev };

          if (randomEvent.effects.money !== undefined) {
            newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + randomEvent.effects.money));
          }
          if (randomEvent.effects.intelligence !== undefined) {
            newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + randomEvent.effects.intelligence));
          }
          if (randomEvent.effects.appearance !== undefined) {
            newState.stats.appearance = Math.max(0, Math.min(100, newState.stats.appearance + randomEvent.effects.appearance));
          }
          if (randomEvent.effects.health !== undefined) {
            newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + randomEvent.effects.health));
          }
          if (randomEvent.effects.happiness !== undefined) {
            newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + randomEvent.effects.happiness));
          }

          // 可能改变人生状态
          if (randomEvent.stateChange && Math.random() < randomEvent.stateChange.probability) {
            newState.lifeState = randomEvent.stateChange.newState;
            newState.lifePath.push(`${newState.age}岁：${randomEvent.title}导致成为${LIFE_STATE_NAMES[randomEvent.stateChange.newState]}`);
          }

          return newState;
        });

        // 更新叙事显示（追加事件）
        setCurrentNarrative(prev => `${prev}\n\n[突发] ${randomEvent.title}\n${eventNarrative}`);

        // 记录事件到年度记录
        setYearVisualCue(getVisualCueFromEntries(eventChangeEntries));
        setVisualCueToken((prev) => prev + 1);

        setYearRecords(prev => {
          const lastRecord = prev[prev.length - 1];
          if (!lastRecord) return prev;

          const mergedEntries = [...(lastRecord.changeEntries || []), ...eventChangeEntries];
          const updatedRecord: YearRecord = {
            ...lastRecord,
            narrative: `${lastRecord.narrative}\n\n[突发] ${randomEvent.title}：${eventNarrative}`,
            eventTitle: randomEvent.title,
            changeEntries: mergedEntries
          };

          return [...prev.slice(0, -1), updatedRecord];
        });
      }
    }, 500); // 延迟500ms，让玩家先看完年度叙事

    // ===== 属性驱动事件触发 =====
    // 在随机事件之后检查属性状态驱动的事件
    setTimeout(() => {
      if (!playerState) return;

      const statEvents = getStatDrivenEvents(playerState);
      if (statEvents.length === 0) return;

      // 计算每个事件的概率并排序
      const eventProbabilities = statEvents.map(event => ({
        event,
        probability: calculateEventProbability(event, playerState),
      })).filter(ep => ep.probability > 0);

      if (eventProbabilities.length === 0) return;

      // 按概率排序，优先检查高概率事件
      eventProbabilities.sort((a, b) => b.probability - a.probability);

      // 尝试触发事件
      for (const { event, probability } of eventProbabilities) {
        // 检查冷却期
        const cooldownKey = `${event.id}_cooldown`;
        const lastTriggered = playerState.usedEvents.has(cooldownKey);
        if (lastTriggered) continue;

        if (Math.random() < probability) {
          // 标记事件已触发（设置冷却期）
          const cooldownYears = event.cooldown || 2;
          for (let i = 0; i < cooldownYears; i++) {
            playerState.usedEvents.add(`${event.id}_cooldown_${playerState.age + i}`);
          }

          // 特殊处理：出道事件让玩家选择
          if (event.id === 'appearance_debut_choice') {
            showEventModal({
              title: event.title,
              description: event.description,
              effects: [],
              hasChoice: true,
              choiceOptions: {
                accept: { 
                  text: '接受邀请，签约出道', 
                  effects: { happiness: 5, money: -5 }
                },
                reject: { 
                  text: '婉拒星探，继续学业/工作', 
                  effects: { happiness: -2 }
                }
              },
              onChoice: (accepted: boolean) => {
                // 应用选择效果
                setPlayerState(prev => {
                  if (!prev) return null;
                  const newState = { ...prev };
                  const effects = accepted 
                    ? { happiness: 5, money: -5 }
                    : { happiness: -2 };
                  
                  if (effects.money) newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + effects.money));
                  if (effects.happiness) newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + effects.happiness));
                  
                  // 记录选择
                  newState.majorChoices.push({
                    age: newState.age,
                    sceneId: 'debut_choice',
                    choiceId: accepted ? 'accept_debut' : 'reject_debut',
                    description: accepted ? '接受星探邀请，签约出道' : '婉拒星探，继续原生活',
                    lifeState: newState.lifeState
                  });
                  
                  return newState;
                });
                
                // 添加叙事
                const narrative = accepted 
                  ? '你决定接受星探的邀请，签了经纪公司。接下来的人生就像开盲盒——可能是星光大道，也可能是骗局深渊。'
                  : '你婉拒了星探的邀请。虽然不知道这条路通向何方，但你选择了更稳妥的人生。多年后回想起来，你会后悔吗？';
                setCurrentNarrative(prev => `${prev}\n\n[抉择] ${narrative}`);
                
                // 如果接受，可能触发后续事件
                if (accepted) {
                  // 50%概率成为练习生，35%概率被骗
                  const rand = Math.random();
                  setTimeout(() => {
                    if (rand < 0.5) {
                      // 成为练习生
                      setPlayerState(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            appearance: Math.min(100, prev.stats.appearance + 5),
                            money: Math.max(-50, prev.stats.money - 10),
                            health: Math.max(0, prev.stats.health - 10),
                            happiness: Math.min(100, prev.stats.happiness + 10)
                          }
                        };
                      });
                      setCurrentNarrative(prev => `${prev}\n\n[后续] 你开始了练习生生涯。每天练舞八小时，节食减肥，还要上表情管理课。虽然辛苦，但你离梦想更近了。`);
                    } else if (rand < 0.85) {
                      // 被骗
                      setPlayerState(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            money: Math.max(-50, prev.stats.money - 30),
                            happiness: Math.max(0, prev.stats.happiness - 15)
                          }
                        };
                      });
                      setCurrentNarrative(prev => `${prev}\n\n[后续] 那家公司让你交培训费、包装费、推广费。你交完钱，对方就消失了。你终于明白，你不是被星探发现了，是被骗子发现了。`);
                    }
                  }, 1000);
                }
                
                // 关闭弹窗
                setEventModal({ show: false, title: '', description: '', effects: [] });
              }
            });
            
            // 只触发一个事件
            break;
          }

          // 准备事件效果数据
          const eventChangeEntries = Object.entries(event.effects)
            .filter(([, value]) => value !== undefined && value !== 0)
            .map(([key, value]) => formatStatChangeLabel(key, value as number));

          // 显示属性驱动事件弹窗（使用队列）
          showEventModal({
            title: event.title,
            description: event.description,
            effects: eventChangeEntries.map(entry => ({
              label: entry.split(/\+|-/)[0],
              value: entry.match(/[+-]\d+/)?.[0] || '',
              isPositive: entry.includes('+')
            }))
          });

          // 应用事件效果到 playerState
          setPlayerState(prev => {
            if (!prev) return null;
            const newState = { ...prev };

            if (event.effects.money !== undefined) {
              newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + event.effects.money));
            }
            if (event.effects.intelligence !== undefined) {
              newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + event.effects.intelligence));
            }
            if (event.effects.appearance !== undefined) {
              newState.stats.appearance = Math.max(0, Math.min(100, newState.stats.appearance + event.effects.appearance));
            }
            if (event.effects.health !== undefined) {
              newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + event.effects.health));
            }
            if (event.effects.happiness !== undefined) {
              newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + event.effects.happiness));
            }

            // 可能改变人生状态
            if (event.stateChange && Math.random() < event.stateChange.probability) {
              newState.lifeState = event.stateChange.newState;
              newState.lifePath.push(`${newState.age}岁：${event.title}导致成为${LIFE_STATE_NAMES[event.stateChange.newState]}`);
            }

            return newState;
          });

          // 更新叙事显示（追加事件）
          setCurrentNarrative(prev => `${prev}\n\n[状态] ${event.title}\n${event.description}`);

          // 更新视觉提示
          setYearVisualCue(getVisualCueFromEntries(eventChangeEntries));
          setVisualCueToken((prev) => prev + 1);

          // 记录事件到年度记录（包含年度标签）
          setYearRecords(prev => {
            const lastRecord = prev[prev.length - 1];
            if (!lastRecord) return prev;

            const mergedEntries = [...(lastRecord.changeEntries || []), ...eventChangeEntries];
            const updatedRecord: YearRecord = {
              ...lastRecord,
              narrative: `${lastRecord.narrative}\n\n[状态] ${event.title}：${event.description}`,
              eventTitle: event.yearTag || event.title,
              changeEntries: mergedEntries
            };

            return [...prev.slice(0, -1), updatedRecord];
          });

          // 只触发一个属性驱动事件（避免同一年触发太多）
          break;
        }
      }
    }, 1000); // 延迟1000ms，在随机事件之后

    // 检查结局（最早60岁才能结束）
    if (result.ending && playerState && playerState.age >= 60) {
      endGame(result.ending.type, result.ending.reason);
    }

    // 手动模式下，显示年度完成，等待用户点击下一年
    if (manualMode) {
      setShowYearComplete(true);
      setWaitingForNextYear(true);
    }

    setPendingNarrative(null);
  };

  // ========== 游戏循环 ==========
  useEffect(() => {
    // 手动模式下不自动进入下一年
    if (manualMode && waitingForNextYear) {
      return;
    }
    
    if (isPlaying && gamePhase === 'living' && !isGeneratingNarrative && !pendingNarrative && !waitingForNextYear) {
      gameLoopRef.current = setTimeout(() => {
        generateYearNarrative();
      }, YEAR_TRANSITION_DURATION);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isPlaying, gamePhase, isGeneratingNarrative, pendingNarrative, generateYearNarrative, manualMode, waitingForNextYear]);

  // 手动进入下一年
  const handleNextYear = () => {
    setWaitingForNextYear(false);
    setShowYearComplete(false);
    generateYearNarrative();
  };
  
  // 选择支线任务
  const handleSelectSideQuest = (quest: import('@/lib/birthplaceSystem').SideQuest) => {
    if (!playerState) return;
    
    // 判定成功或失败
    const isSuccess = Math.random() < quest.successRate;
    
    // 应用效果
    setPlayerState(prev => {
      if (!prev) return null;
      const newState = { ...prev };
      
      if (quest.effects.money !== undefined) {
        newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + quest.effects.money));
      }
      if (quest.effects.intelligence !== undefined) {
        newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + quest.effects.intelligence));
      }
      if (quest.effects.appearance !== undefined) {
        newState.stats.appearance = Math.max(0, Math.min(100, newState.stats.appearance + quest.effects.appearance));
      }
      if (quest.effects.health !== undefined) {
        newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + quest.effects.health));
      }
      if (quest.effects.happiness !== undefined) {
        newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + quest.effects.happiness));
      }
      
      if (quest.lifeStateChange) {
        newState.lifeState = quest.lifeStateChange as any;
        newState.lifePath.push(`${newState.age}岁：${quest.title}`);
      }
      
      return newState;
    });
    
    // 添加叙事
    const narrative = isSuccess ? quest.successNarrative : quest.failureNarrative;
    setCurrentNarrative(prev => `${prev}\n\n[支线：${quest.title}]\n${narrative}`);
    
    // 关闭弹窗
    setSideQuestModal({ show: false, eventTitle: '', quests: [], selectedQuest: null });
  };
  
  // 辅助函数：显示弹窗或加入队列
  const showEventModal = (eventData: {
    title: string;
    description: string;
    effects: { label: string; value: string; isPositive: boolean }[];
    hasChoice?: boolean;
    choiceOptions?: any;
    onChoice?: (accepted: boolean) => void;
  }) => {
    if (eventModal.show) {
      // 如果已有弹窗显示，加入队列
      eventQueueRef.current.push(eventData);
    } else {
      // 直接显示
      setEventModal({ show: true, ...eventData });
    }
  };
  
  // 关闭突发事件弹窗
  const closeEventModal = () => {
    setEventModal({ show: false, title: '', description: '', effects: [] });
    
    // 检查是否还有待显示的事件
    setTimeout(() => {
      if (eventQueueRef.current.length > 0) {
        const nextEvent = eventQueueRef.current.shift();
        if (nextEvent) {
          setEventModal({
            show: true,
            ...nextEvent
          });
        }
      }
    }, 300); // 短暂延迟，让关闭动画完成
  };
  
  // 关闭历史事件 Toast
  const closeHistoryToast = () => {
    setHistoryToast(prev => ({ ...prev, show: false }));
  };
  
  // 切换手动/自动模式
  const toggleManualMode = () => {
    setManualMode(!manualMode);
    if (!manualMode) {
      // 切换到手动模式时，暂停自动播放
      setIsPlaying(false);
      setWaitingForNextYear(true);
    } else {
      // 切换到自动模式时，恢复播放
      setWaitingForNextYear(false);
      setIsPlaying(true);
    }
  };

  // ========== 选择处理 ==========
  const handleChoice = (option: ChoiceOption) => {
    if (!playerState) return;
    
    // 检查是否是启动追求目标的选项
    const pursuitMapping: Record<string, string> = {
      'gaokao': 'gaokao',
      'kaoyan': 'postgrad',
      'civil': 'civil_exam',
      'business': 'startup',
      'work': 'job_hunt'
    };
    
    const pursuitId = pursuitMapping[option.id];
    
    // 获取当前进行中的追求（如果有）
    const ongoingPursuit = playerState.ongoingPursuits?.find(p => p.status === 'ongoing');
    
    // 应用选择效果
    setPlayerState(prev => {
      if (!prev) return null;
      const newState = { ...prev };
      
      if (option.effects?.money !== undefined) {
        newState.stats.money = Math.max(-50, Math.min(100, newState.stats.money + option.effects.money));
      }
      if (option.effects?.intelligence !== undefined) {
        newState.stats.intelligence = Math.max(0, Math.min(100, newState.stats.intelligence + option.effects.intelligence));
      }
      if (option.effects?.appearance !== undefined) {
        newState.stats.appearance = Math.max(0, Math.min(100, newState.stats.appearance + option.effects.appearance));
      }
      if (option.effects?.health !== undefined) {
        newState.stats.health = Math.max(0, Math.min(100, newState.stats.health + option.effects.health));
      }
      if (option.effects?.happiness !== undefined) {
        newState.stats.happiness = Math.max(0, Math.min(100, newState.stats.happiness + option.effects.happiness));
      }
      
      // 处理追求系统的特殊选项
      if (ongoingPursuit) {
        if (option.id === 'gap_year') {
          // 选择gap year
          const result = takeGapYear(newState, ongoingPursuit);
          newState.gapYears += 1;
          newState.lifePath.push(`${newState.age}岁：${ongoingPursuit.name} gap year`);
          setCurrentNarrative(prev => `${prev}\n\n${result.narrative}`);
        } else if (option.id === 'give_up') {
          // 放弃追求
          const narrative = abandonPursuit(ongoingPursuit);
          newState.lifePath.push(`${newState.age}岁：放弃${ongoingPursuit.name}`);
          setCurrentNarrative(prev => `${prev}\n\n${narrative}`);
        } else if (option.id === 'continue') {
          // 继续追求，标记为进行中（实际上在 generatePursuitNarrative 中已经处理了）
          resumePursuit(ongoingPursuit);
        } else if (option.id === 'part_time') {
          // 边工作边准备
          ongoingPursuit.status = 'paused';
          newState.lifeState = 'worker';
          newState.lifePath.push(`${newState.age}岁：边工作边准备${ongoingPursuit.name}`);
        }
      }
      
      if (option.lifeState && option.id !== 'part_time') {
        newState.lifeState = option.lifeState;
        newState.lifePath.push(`${newState.age}岁：选择成为${LIFE_STATE_NAMES[option.lifeState]}`);
      }
      
      // 如果选择了新的追求目标，启动它
      if (pursuitId && !ongoingPursuit) {
        const result = startPursuit(newState, pursuitId);
        if (result.success && result.pursuit) {
          newState.ongoingPursuits.push(result.pursuit);
          newState.lifePath.push(`${newState.age}岁：决定${result.pursuit.name}`);
        }
      }
      
      newState.majorChoices.push({
        age: newState.age,
        sceneId: currentChoice?.id || '',
        choiceId: option.id,
        description: option.text,
        lifeState: option.lifeState || newState.lifeState
      });
      
      return newState;
    });
    
    // 应用待处理的叙事结果（推进年龄、记录叙事）
    if (pendingNarrative) {
      applyNarrativeResult(pendingNarrative);
    }
    
    // 继续游戏
    setCurrentChoice(null);
    setGamePhase('living');
    setIsPlaying(true);
  };

  // ========== 输入处理 ==========
  const handleInputSubmit = () => {
    if (!playerState || !currentInput || !inputText.trim()) return;
    
    const { path } = classifyInput(inputText, currentInput.id);
    const response = generateInputResponse(inputText, path, playerState.stats.money);
    
    // 记录输入
    setPlayerState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        majorChoices: [...prev.majorChoices, {
          age: prev.age,
          sceneId: currentInput.id,
          choiceId: path,
          description: inputText,
          lifeState: prev.lifeState
        }]
      };
    });
    
    // 应用待处理的叙事结果（推进年龄、记录叙事）
    if (pendingNarrative) {
      applyNarrativeResult(pendingNarrative);
    }
    
    setCurrentNarrative(`${inputText}\n\n${response}`);
    setCurrentInput(null);
    setInputText('');
    setGamePhase('living');
    setIsPlaying(true);
  };

  // ========== 游戏结束 ==========
  const endGame = async (type: string, reason: string) => {
    setIsPlaying(false);
    setGamePhase('summary');
    
    if (playerState) {
      const narratives = yearRecords.map(r => r.narrative);
      const summary = await generateLifeSummary(playerState, narratives, yearRecords);
      setLifeSummary(summary);
      
      // 保存档案到数据库
      try {
        const archiveId = await saveArchive(playerState, yearRecords, summary);
        console.log('[Archive] 档案已保存:', archiveId);
      } catch (error) {
        console.error('[Archive] 保存失败:', error);
      }
    }
    
    // 清除当前会话
    await clearGameSession();
  };

  const restartGame = async () => {
    // 清除当前会话
    await clearGameSession();
    
    setGamePhase('intro');
    setPlayerState(null);
    setCurrentNarrative('');
    setYearRecords([]);
    setLifeSummary(null);
    setCurrentChoice(null);
    setCurrentInput(null);
    setInputText('');
    setYearVisualCue('neutral');
    setVisualCueToken(0);
    setWaitingForNextYear(true);
    narrativeQueueRef.current = [];
  };

  // 查看档案列表
  const viewArchives = async () => {
    try {
      const allArchives = await getAllArchives();
      setArchives(allArchives);
      setShowArchives(true);
    } catch (error) {
      console.error('[Archive] 获取失败:', error);
    }
  };

  // 删除档案
  const handleDeleteArchive = async (id: string) => {
    try {
      await deleteArchive(id);
      setArchives(archives.filter(a => a.id !== id));
      if (selectedArchive?.id === id) {
        setSelectedArchive(null);
      }
    } catch (error) {
      console.error('[Archive] 删除失败:', error);
    }
  };

  // ========== 渲染辅助 ==========
  const getMoneyStatus = (money: number): { emoji: string; label: string; color: string } => {
    if (money < 0) return { emoji: '💰', label: '负债累累', color: 'text-red-600' };
    if (money < 20) return { emoji: '💰', label: '捉襟见肘', color: 'text-red-500' };
    if (money < 40) return { emoji: '💰', label: '勉强生活', color: 'text-orange-500' };
    if (money < 60) return { emoji: '💰', label: '还算体面', color: 'text-yellow-600' };
    if (money < 80) return { emoji: '💰', label: '小康水平', color: 'text-blue-500' };
    return { emoji: '💰', label: '财务自由', color: 'text-green-500' };
  };

  const getStatStatus = (
    key: 'intelligence' | 'appearance' | 'health' | 'happiness',
    value: number
  ): { label: string; color: string } => {
    const tier = value < 30 ? 0 : value < 50 ? 1 : value < 70 ? 2 : 3;

    const statusMap: Record<'intelligence' | 'appearance' | 'health' | 'happiness', Array<{ label: string; color: string }>> = {
      intelligence: [
        { label: '有点迷糊', color: 'text-red-500' },
        { label: '思路一般', color: 'text-orange-500' },
        { label: '脑子在线', color: 'text-yellow-600' },
        { label: '聪明绝顶', color: 'text-green-600' }
      ],
      appearance: [
        { label: '路人水平', color: 'text-red-500' },
        { label: '看着顺眼', color: 'text-orange-500' },
        { label: '颜值能打', color: 'text-yellow-600' },
        { label: '回头率高', color: 'text-green-600' }
      ],
      health: [
        { label: '状态告急', color: 'text-red-500' },
        { label: '时好时坏', color: 'text-orange-500' },
        { label: '总体稳定', color: 'text-yellow-600' },
        { label: '活力满格', color: 'text-green-600' }
      ],
      happiness: [
        { label: '有点丧', color: 'text-red-500' },
        { label: '凑合过', color: 'text-orange-500' },
        { label: '心态平稳', color: 'text-yellow-600' },
        { label: '快乐拉满', color: 'text-green-600' }
      ]
    };

    return statusMap[key][tier];
  };

  const formatStatChangeLabel = (key: string, value: number) => {
    const labelMap: Record<string, string> = {
      money: '财力',
      intelligence: '脑子',
      appearance: '颜值',
      health: '健康',
      happiness: '心气'
    };

    return `${labelMap[key] || key}${value > 0 ? '+' : ''}${value}`;
  };

  const getChangeTone = (entry: string) => {
    return entry.includes('-')
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  // ========== 渲染 ==========
  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 档案查看界面
  if (showArchives) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📜 人生档案馆</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchives(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                返回
              </button>
            </div>
          </div>
          
          {selectedArchive ? (
            // 档案详情
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <button
                onClick={() => setSelectedArchive(null)}
                className="mb-4 text-purple-600 hover:text-purple-800"
              >
                ← 返回列表
              </button>
              
              <div className="border-b pb-4 mb-4">
                <h3 className="text-2xl font-bold">{selectedArchive.name} 的人生</h3>
                <p className="text-gray-500">
                  {selectedArchive.birthYear}年生 · {selectedArchive.gender === 'male' ? '男' : '女'} · 
                  享年{selectedArchive.finalAge}岁 · {selectedArchive.lifeState}
                </p>
                <p className="text-sm text-gray-400">
                  存档时间: {new Date(selectedArchive.endTime || selectedArchive.startTime).toLocaleString()}
                </p>
              </div>
              
              {selectedArchive.lifeSummary && (
                <div className="mb-6 bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold mb-2">人生总结</h4>
                  <p className="text-gray-700 mb-3">{selectedArchive.lifeSummary.summary}</p>
                  <p className="text-purple-600 italic">{selectedArchive.lifeSummary.finalComment}</p>
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="font-bold mb-3">重要选择</h4>
                <div className="space-y-2">
                  {selectedArchive.majorChoices.map((choice, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-purple-600 font-mono">{choice.age}岁</span>
                      <span className="text-gray-700">{choice.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteArchive(selectedArchive.id)}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                🗑️ 删除此档案
              </button>
            </div>
          ) : (
            // 档案列表
            <>
              {archives.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow">
                  <p className="text-gray-400 text-lg">暂无存档</p>
                  <p className="text-gray-400 text-sm">完成一局游戏后，你的人生将被记录在这里</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {archives.map((archive) => (
                    <div
                      key={archive.id}
                      onClick={() => setSelectedArchive(archive)}
                      className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{archive.name}</h3>
                          <p className="text-sm text-gray-500">
                            {archive.birthYear}年生 · 享年{archive.finalAge}岁 · {archive.lifeState}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          {new Date(archive.endTime || archive.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            人生重开模拟器
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            AI驱动的吐槽人生体验<br/>
            <span className="text-sm text-gray-400">每一次重开，都是新的故事</span>
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              🎲 开始新人生
            </button>
            <button
              onClick={viewArchives}
              className="px-8 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-xl font-semibold hover:border-purple-400 transition-all"
            >
              📜 查看人生档案
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 角色创建界面
  if (gamePhase === 'create') {
    const era = getEraByBirthYear(birthYear);
    const birthplace = getBirthplaceById(selectedBirthplace);
    const displayName = playerName.trim() || PREVIEW_NAME_FALLBACK;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">命运开户处</p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">先填资料，再看老天给不给面子</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                这不是普通建档，这是给你的人生剧本开盲盒。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="先报上名来"
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1.5">{getNameRoast(playerName)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">性别</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedGender('male')}
                    className={`py-3 rounded-xl border-2 transition-all text-sm ${
                      selectedGender === 'male'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    👦 男生剧本
                  </button>
                  <button
                    onClick={() => setSelectedGender('female')}
                    className={`py-3 rounded-xl border-2 transition-all text-sm ${
                      selectedGender === 'female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                        : 'border-gray-200 hover:border-pink-300 bg-white'
                    }`}
                  >
                    👧 女生剧本
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">出生年份</label>
                  <span className="text-sm font-semibold text-purple-700">{birthYear}</span>
                </div>
                <input
                  type="range"
                  min={START_YEAR}
                  max={END_YEAR}
                  value={birthYear}
                  onChange={(e) => setBirthYear(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1970</span>
                  <span className="text-purple-600 font-medium">{era.name}</span>
                  <span>2020</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">出生地</label>
                <select
                  value={selectedBirthplace}
                  onChange={(e) => setSelectedBirthplace(e.target.value as BirthplaceType)}
                  className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white text-sm"
                >
                  {HUMOR_BIRTHPLACES.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.emoji} {bp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{displayName}</span>，
                  <span className="text-purple-700">{birthYear}年</span>生，
                  落户<span className="text-blue-700">{birthplace.emoji} {birthplace.name}</span>。
                  <span className="text-gray-500">时代和出生地的故事，等你亲身经历。</span>
                </p>
              </div>
            </div>

            <button
              onClick={confirmCharacter}
              className="w-full mt-6 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-base hover:shadow-lg transition-all active:scale-95"
            >
              开始摇号这辈子
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (gamePhase === 'born' && playerState) {
    const era = getEraByBirthYear(playerState.birthYear);
    const birthplace = getBirthplaceById(playerState.birthplace as BirthplaceType);
    const statSummary = [
      formatStatPreview(playerState.stats.money, '财力'),
      formatStatPreview(playerState.stats.intelligence, '脑子'),
      formatStatPreview(playerState.stats.appearance, '颜值'),
      formatStatPreview(playerState.stats.happiness, '心气')
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">👶</div>
            <p className="text-sm font-medium text-purple-600 mb-2">命运揭晓</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{playerState.name}，正式落地</h2>
            <p className="text-gray-600 leading-relaxed">{currentNarrative}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-2xl bg-purple-50 p-5 border border-purple-100">
              <div className="text-sm text-purple-700 font-semibold mb-2">出厂配置</div>
              <div className="text-lg font-bold text-gray-900 mb-1">{FAMILY_NAMES[playerState.birthFamily.type]}</div>
              <p className="text-sm text-gray-700 leading-relaxed">{getFamilyFlavorText(playerState.birthFamily.type)}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-5 border border-blue-100">
              <div className="text-sm text-blue-700 font-semibold mb-2">落地城市</div>
              <div className="text-lg font-bold text-gray-900 mb-1">{birthplace.emoji} {birthplace.name}</div>
              <p className="text-sm text-gray-700 leading-relaxed">{getBirthplacePreviewCommentary(playerState.birthplace as BirthplaceType)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">{playerState.birthYear}年</span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">{era.name}</span>
              <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700">{playerState.gender === 'male' ? '男孩' : '女孩'}</span>
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-2">人生起跑线报告</div>
            <div className="flex flex-wrap gap-2">
              {statSummary.map((item) => (
                <span key={item} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-gray-700">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={proceedToLiving}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg hover:shadow-lg transition-all"
          >
            带着这身配置闯社会
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'choice' && currentChoice) {
    const ageLabel = currentChoice.age ? `${currentChoice.age}岁` : '这一年';
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🎯</span>
            <div>
              <p className="text-sm text-purple-600 font-medium">人生抉择 · {ageLabel}</p>
              <h2 className="text-2xl font-bold">{currentChoice.title}</h2>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 mb-6">
            <p className="text-gray-700 leading-relaxed">{currentChoice.description}</p>
          </div>

          <div className="space-y-3">
            {currentChoice.options.map((option, idx) => {
              const optionTone = [
                { color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:border-blue-400 hover:bg-blue-100' },
                { color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:border-purple-400 hover:bg-purple-100' },
                { color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:border-emerald-400 hover:bg-emerald-100' }
              ][idx % 3];

              return (
                <button
                  key={option.id}
                  onClick={() => handleChoice(option)}
                  className={`w-full p-5 text-left border-2 ${optionTone.border} ${optionTone.bg} rounded-2xl ${optionTone.hover} transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{option.text}</span>
                    <span className={`opacity-0 group-hover:opacity-100 text-sm font-medium bg-gradient-to-r ${optionTone.color} bg-clip-text text-transparent transition-opacity`}>
                      选这个 →
                    </span>
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  )}
                  {option.effects && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(option.effects).map(([k, v]) => {
                        const icons: Record<string, string> = {
                          money: '💰', intelligence: '🧠', appearance: '✨',
                          health: '❤️', happiness: '😊'
                        };
                        const isPositive = (v as number) > 0;
                        return (
                          <span key={k} className={`px-2 py-1 rounded-full text-xs ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {icons[k] || k}{v! > 0 ? '+' : ''}{v}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">选完这条线，后面的人生就按这个剧本走了。</p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'input' && currentInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">✍️</span>
            <div>
              <p className="text-sm text-purple-600 font-medium">自由发挥 · {playerState?.age}岁</p>
              <h2 className="text-2xl font-bold">{currentInput.title}</h2>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100 mb-4">
            <p className="text-gray-700 leading-relaxed">{currentInput.description}</p>
          </div>

          <p className="text-sm text-gray-500 mb-3">提示：{currentInput.hint}</p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="随便写两句，命运系统会看着给你安排后续…"
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none resize-none h-32 transition-colors"
          />

          <button
            onClick={handleInputSubmit}
            disabled={!inputText.trim()}
            className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {inputText.trim() ? '提交，看命运怎么接话' : '先写两句…'}
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'summary' && lifeSummary) {
    const birthplace = playerState ? getBirthplaceById(playerState.birthplace as BirthplaceType) : null;
    const era = playerState ? getEraByBirthYear(playerState.birthYear) : null;
    const lifetimeTagline = [
      '卷过，也摆过，最后还是走到了终点。',
      '没有大起大落的剧情，但每一步都算数。',
      '这辈子剧本不算最好，但演出还算认真。',
      '回头看，那些以为过不去的坎，都变成了回忆里的标点。'
    ][Math.floor(Math.random() * 4)];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
        <div className="max-w-3xl mx-auto">
          {/* 人生封皮 */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-fuchsia-900 text-white rounded-3xl shadow-xl p-8 mb-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]" />
            <div className="relative">
              <div className="text-5xl mb-4">📖</div>
              <h2 className="text-3xl font-bold mb-2">{playerState?.name}</h2>
              <p className="text-white/70 text-sm mb-4">{lifetimeTagline}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-white/15">{playerState?.birthYear}年 - {(playerState?.birthYear || 0) + (playerState?.age || 0)}年</span>
                <span className="px-3 py-1 rounded-full bg-white/15">{birthplace?.emoji} {birthplace?.name}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">{era?.name}</span>
                <span className="px-3 py-1 rounded-full bg-white/15">{LIFE_STATE_NAMES[playerState?.lifeState || 'normal']}</span>
              </div>
            </div>
          </div>

          {/* AI评价 */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-xl p-6 mb-6 text-white">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>🎭</span> 人生评论员点评
            </h3>
            <div className="text-sm leading-relaxed whitespace-pre-line">
              {lifeSummary.aiEvaluation}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-center mb-6">人生结算单</h2>

            <div className="rounded-2xl bg-slate-50 p-6 mb-6 border border-slate-100">
              <p className="text-lg leading-relaxed text-gray-800">{lifeSummary.summary}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100">
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span>🏆</span> 高光时刻
                </h3>
                <ul className="text-sm space-y-2">
                  {lifeSummary.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-orange-50 p-5 border border-orange-100">
                <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <span>💭</span> 意难平
                </h3>
                <ul className="text-sm space-y-2">
                  {lifeSummary.regrets.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">○</span>
                      <span className="text-gray-700">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mb-6 rounded-2xl bg-gradient-to-r from-slate-100 to-gray-100 p-6">
              <p className="text-xl font-medium text-gray-800 italic">
                "{lifeSummary.finalComment || '游戏结束，但你的故事会被记住——至少在这个存档里。'}"
              </p>
            </div>

            <button
              onClick={restartGame}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg hover:shadow-lg transition-all"
            >
              🔄 再开一局，看看有没有更好的命
            </button>
          </div>

          {/* 人生时间线 */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span>📜</span> 完整轨迹
              <span className="text-xs font-normal text-gray-500">({yearRecords.length}年)</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {yearRecords.map((record, i) => (
                <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{record.year}年</span>
                    <span className="font-mono font-bold text-purple-600">{record.age}岁</span>
                    {record.eventTitle && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {record.eventTitle}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{record.narrative.substring(0, 120)}...</p>
                  {record.changeEntries && record.changeEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {record.changeEntries.slice(0, 3).map((entry) => (
                        <span key={entry} className={`px-2 py-0.5 rounded-full border text-xs ${getChangeTone(entry)}`}>
                          {entry}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主游戏界面
  if (!playerState) return null;
  
  const moneyStatus = getMoneyStatus(playerState.stats.money);
  const ageThemeClass = playerState.age < 30
    ? 'from-violet-100 via-blue-50 to-cyan-100'
    : playerState.age < 55
      ? 'from-amber-100 via-rose-50 to-purple-100'
      : 'from-slate-200 via-blue-100 to-indigo-100';
  const livingBgClass = `min-h-screen bg-gradient-to-br ${ageThemeClass} p-4 transition-all duration-700`;
  const currentYearKey = yearRecords[yearRecords.length - 1]?.headline || `age-${playerState.age}`;
  const visualCueClass = yearVisualCue === 'positive'
    ? 'year-flash-positive'
    : yearVisualCue === 'negative'
      ? 'year-flash-negative'
      : 'year-flash-neutral';

  return (
    <div className={livingBgClass}>
      <div className="max-w-4xl mx-auto">
        {/* 顶部状态栏 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl">
                {playerState.gender === 'male' ? '👨' : '👩'} {playerState.age}岁
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                playerState.lifeState === 'worker' ? 'bg-blue-100 text-blue-700' :
                playerState.lifeState === 'business' ? 'bg-green-100 text-green-700' :
                playerState.lifeState === 'beggar' ? 'bg-gray-100 text-gray-700' :
                playerState.lifeState === 'criminal' ? 'bg-red-100 text-red-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {LIFE_STATE_NAMES[playerState.lifeState]}
              </span>
            </div>

          </div>

          {/* 属性条 - 横排布局 + 底部小进度条 */}
          <div className="flex justify-between items-start mt-4 px-2">
            {/* 财力 */}
            <div className="text-center flex-1 min-w-0 px-1">
              <div className="text-xl sm:text-2xl mb-1">{moneyStatus.emoji}</div>
              <div className={`font-bold text-sm sm:text-base truncate ${moneyStatus.color}`}>{moneyStatus.label}</div>
              {/* 底部小进度条 */}
              <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, playerState.stats.money))}%` }}
                />
              </div>
            </div>

            {/* 其他属性 */}
            {[
              { key: 'intelligence', icon: '🧠', label: '智力', color: 'bg-blue-500' },
              { key: 'appearance', icon: '✨', label: '外貌', color: 'bg-purple-500' },
              { key: 'health', icon: '❤️', label: '健康', color: 'bg-red-500' },
              { key: 'happiness', icon: '😊', label: '快乐', color: 'bg-green-500' }
            ].map(({ key, icon, color }) => {
              const value = playerState.stats[key as keyof typeof playerState.stats] ?? 0;
              const status = getStatStatus(key as 'intelligence' | 'appearance' | 'health' | 'happiness', value);
              return (
                <div key={key} className="text-center flex-1 min-w-0 px-1">
                  <div className="text-xl sm:text-2xl mb-1">{icon}</div>
                  <div className={`font-bold text-sm sm:text-base truncate ${status.color}`}>{status.label}</div>
                  {/* 底部小进度条 */}
                  <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* 左侧：叙事显示 - 幻灯片风格 */}
          <div className="md:col-span-2 space-y-4">
            {/* 年度事件卡片 - 只显示事件 */}
            {yearRecords.length > 0 && (
              <div 
                key={`header-${yearRecords[yearRecords.length - 1]?.age}`}
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 rounded-2xl shadow-xl p-4 text-white animate-slide-show-in"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-white/70">
                    {yearRecords[yearRecords.length - 1]?.year}年
                  </div>
                  <div>
                    {yearRecords[yearRecords.length - 1]?.eventTitle ? (
                      <span className="px-4 py-2 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm">
                        {yearRecords[yearRecords.length - 1]?.eventTitle}
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full bg-white/10 text-sm text-white/70">
                        平凡的一年
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 叙事内容卡片 - 幻灯片渐变效果 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[280px] relative overflow-hidden year-card-highlight">
              <div
                key={visualCueToken}
                className={`pointer-events-none absolute inset-0 ${visualCueClass}`}
                aria-hidden="true"
              />
              
              {/* 幻灯片装饰边框 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
              
              {isGeneratingNarrative ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="animate-spin text-5xl mb-3">🤔</div>
                    <p className="text-gray-500 text-lg">正在思考你的人生...</p>
                    <p className="text-gray-400 text-sm mt-2">这可能需要几秒钟</p>
                  </div>
                </div>
              ) : (
                <div key={currentYearKey} className="animate-slide-show-in">
                  {/* 状态标签 */}
                  <div className="flex items-center gap-3 mb-5">
                    {manualMode && waitingForNextYear && (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium animate-pulse">
                        ✓ 年度完成
                      </span>
                    )}
                    {isPlaying && !manualMode && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-pulse">
                        ● 自动播放中
                      </span>
                    )}
                  </div>
                  
                  {/* 叙事文本 - 渐变显示 */}
                  <div className="animate-text-reveal">
                    <p className="text-lg leading-relaxed whitespace-pre-line text-gray-800">
                      {currentNarrative || '等待开始...'}
                    </p>
                  </div>
                  
                  {/* 属性变化 - 更显眼 */}
                  {yearRecords[yearRecords.length - 1]?.changeEntries?.length ? (
                    <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📊</span>
                        <span className="font-semibold text-gray-700">这一年账本公开</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {yearRecords[yearRecords.length - 1].changeEntries?.map((entry, idx) => (
                          <span 
                            key={entry} 
                            className={`px-4 py-2 rounded-full text-sm font-medium ${getChangeTone(entry)} animate-text-reveal`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                          >
                            {entry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                 
                </div>
              )}
            </div>
            
            {/* 控制按钮 */}
            <div className="flex flex-wrap gap-3">
              {/* 模式切换 */}
              <button
                onClick={toggleManualMode}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  manualMode 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {manualMode ? '👆 手动模式' : '▶ 自动模式'}
              </button>
              
              {/* 自动模式：播放/暂停 */}
              {!manualMode && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    isPlaying 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isPlaying ? '⏸ 暂停' : '▶ 继续'}
                </button>
              )}
              
              {/* 手动模式：下一年按钮 */}
              {manualMode && (
                <button
                  onClick={handleNextYear}
                  disabled={!waitingForNextYear}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all next-year-btn ${
                    waitingForNextYear
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {waitingForNextYear 
                    ? (yearRecords.length === 0 ? '🎬 开始人生' : '⏭ 下一年')
                    : '⏳ 年度进行中...'
                  }
                </button>
              )}
              
              <button
                onClick={() => endGame('natural', '手动结束')}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-all"
              >
                🏁 结束
              </button>
            </div>
          </div>
          
          {/* 右侧：年度记录 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              📜 人生轨迹
              <span className="text-xs font-normal text-gray-500">({yearRecords.length} 年)</span>
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {yearRecords.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">人生刚刚开始...</p>
              ) : (
                yearRecords.slice().reverse().map((record, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {record.year}年
                        </span>
                        <span className="font-mono font-bold text-purple-600">{record.age}岁</span>
                      </div>
                    </div>
                    {record.headline && (
                      <div className="text-sm font-semibold text-gray-900 mb-1">{record.headline}</div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{record.narrative}</p>
                    {record.changeEntries && record.changeEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {record.changeEntries.slice(0, 4).map((entry) => (
                          <span key={entry} className={`px-2 py-0.5 rounded-full border text-xs ${getChangeTone(entry)}`}>
                            {entry}
                          </span>
                        ))}
                        {record.changeEntries.length > 4 && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                            +{record.changeEntries.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 突发事件弹窗 */}
      {eventModal.show && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeEventModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-card-flip"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚡</span>
              <h3 className="text-xl font-bold text-gray-900">突发事件</h3>
              <button 
                onClick={closeEventModal}
                className="ml-auto text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* 事件标题 */}
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-amber-800 text-lg">{eventModal.title}</h4>
            </div>
            
            {/* 事件描述 */}
            <p className="text-gray-700 leading-relaxed mb-6">{eventModal.description}</p>
            
            {/* 事件影响 */}
            {eventModal.effects.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500 mb-2">事件影响：</p>
                <div className="flex flex-wrap gap-2">
                  {eventModal.effects.map((effect, idx) => (
                    <span 
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        effect.isPositive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {effect.label} {effect.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 选择按钮或关闭按钮 */}
            {eventModal.hasChoice && eventModal.choiceOptions ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => eventModal.onChoice?.(false)}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  {eventModal.choiceOptions.reject.text}
                </button>
                <button
                  onClick={() => eventModal.onChoice?.(true)}
                  className="py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {eventModal.choiceOptions.accept.text}
                </button>
              </div>
            ) : (
              <button
                onClick={closeEventModal}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                我知道了
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 支线任务选择弹窗 */}
      {sideQuestModal.show && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSideQuestModal({ show: false, eventTitle: '', quests: [], selectedQuest: null })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-card-flip"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎯</span>
              <h3 className="text-xl font-bold text-gray-900">支线任务</h3>
              <span className="ml-auto px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                {sideQuestModal.eventTitle}
              </span>
            </div>
            
            <p className="text-gray-600 mb-6">历史给了你机会，你的选择将改变人生轨迹...</p>
            
            {/* 任务列表 */}
            <div className="space-y-3 mb-6">
              {sideQuestModal.quests.map((quest, idx) => (
                <button
                  key={quest.id}
                  onClick={() => handleSelectSideQuest(quest)}
                  className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{['🎭', '🎪', '🎨', '⚔️', '🏹'][idx % 5]}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-purple-700">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
                      
                      {/* 效果预览 */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quest.effects.money !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-xs ${quest.effects.money > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            财力 {quest.effects.money > 0 ? '+' : ''}{quest.effects.money}
                          </span>
                        )}
                        {quest.effects.health !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-xs ${quest.effects.health > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            健康 {quest.effects.health > 0 ? '+' : ''}{quest.effects.health}
                          </span>
                        )}
                        {quest.effects.happiness !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-xs ${quest.effects.happiness > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            快乐 {quest.effects.happiness > 0 ? '+' : ''}{quest.effects.happiness}
                          </span>
                        )}
                        {quest.lifeStateChange && (
                          <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                            改变人生轨迹
                          </span>
                        )}
                      </div>
                      
                      {/* 成功率 */}
                      <div className="mt-2 text-xs text-gray-500">
                        成功率: {Math.round(quest.successRate * 100)}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* 放弃选项 */}
              <button
                onClick={() => setSideQuestModal({ show: false, eventTitle: '', quests: [], selectedQuest: null })}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚶</span>
                  <div>
                    <h4 className="font-bold text-gray-600">继续平凡生活</h4>
                    <p className="text-sm text-gray-500 mt-1">不冒险，也不改变，就这样继续...</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 历史事件 Toast - 从右侧滑入 */}
      {historyToast.show && (
        <div 
          className={`fixed top-20 right-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-auto ${
            historyToast.show ? 'history-toast-enter' : 'history-toast-exit'
          }`}
        >
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-xl shadow-2xl p-4 relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            {/* 关闭按钮 */}
            <button 
              onClick={closeHistoryToast}
              className="absolute top-2 right-2 text-white/70 hover:text-white text-xl leading-none z-10"
            >
              ×
            </button>
            
            {/* 内容 */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📅</span>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  {historyToast.year}年 历史时刻
                </span>
              </div>
              <h4 className="font-bold text-lg mb-1">{historyToast.title}</h4>
              <p className="text-sm text-white/90 leading-relaxed">{historyToast.description}</p>
            </div>
            
            {/* 底部进度条（自动消失进度） */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-white/60 animate-[shrink_5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
