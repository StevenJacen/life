/**
 * 档案数据库 - 使用 IndexedDB 存储游戏记录
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PlayerState, YearRecord } from './types';

// 档案记录接口
export interface ArchiveRecord {
  id: string;                    // 唯一ID
  name: string;                  // 玩家姓名
  birthYear: number;             // 出生年份
  birthplace: string;            // 出生地
  gender: 'male' | 'female';     // 性别
  startTime: number;             // 开始时间
  endTime?: number;              // 结束时间
  finalAge: number;              // 最终年龄
  lifeState: string;             // 最终状态
  majorChoices: {                // 重要选择记录
    age: number;
    sceneId: string;
    choiceId: string;
    description: string;
  }[];
  yearRecords: YearRecord[];     // 年度记录
  playerStats: {                 // 最终属性
    money: number;
    intelligence: number;
    appearance: number;
    health: number;
    happiness: number;
  };
  lifeSummary?: {                // 人生总结
    summary: string;
    achievements: string[];
    regrets: string[];
    finalComment: string;
    aiEvaluation: string;
  };
}

// 当前游戏状态（用于页面刷新恢复）
export interface GameSession {
  id: string;
  playerState: PlayerState | null;
  currentNarrative: string;
  yearRecords: YearRecord[];
  gamePhase: string;
  currentChoice: any;
  currentInput: any;
  inputText: string;
  lastUpdated: number;
}

// 数据库名称和版本
const DB_NAME = 'LifeSimulatorDB';
const DB_VERSION = 1;

// 数据库接口定义
interface LifeSimulatorDB extends DBSchema {
  archives: {
    key: string;
    value: ArchiveRecord;
    indexes: {
      'by-start-time': number;
      'by-name': string;
    };
  };
  sessions: {
    key: string;
    value: GameSession;
  };
}

let db: IDBPDatabase<LifeSimulatorDB> | null = null;

// 初始化数据库
export async function initDatabase(): Promise<IDBPDatabase<LifeSimulatorDB>> {
  if (db) return db;
  
  db = await openDB<LifeSimulatorDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // 创建档案表
      const archiveStore = database.createObjectStore('archives', { keyPath: 'id' });
      archiveStore.createIndex('by-start-time', 'startTime', { unique: false });
      archiveStore.createIndex('by-name', 'name', { unique: false });
      
      // 创建会话表（用于页面刷新恢复）
      database.createObjectStore('sessions', { keyPath: 'id' });
    },
  });
  
  return db;
}

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 保存游戏档案
export async function saveArchive(
  playerState: PlayerState,
  yearRecords: YearRecord[],
  lifeSummary?: ArchiveRecord['lifeSummary']
): Promise<string> {
  const database = await initDatabase();
  
  const archive: ArchiveRecord = {
    id: generateId(),
    name: (playerState as any).name || '无名氏',
    birthYear: playerState.birthYear,
    birthplace: playerState.birthplace,
    gender: playerState.gender,
    startTime: Date.now() - (playerState.age * 365 * 24 * 60 * 60 * 1000), // 估算开始时间
    endTime: Date.now(),
    finalAge: playerState.age,
    lifeState: playerState.lifeState,
    majorChoices: playerState.majorChoices,
    yearRecords: yearRecords,
    playerStats: { ...playerState.stats },
    lifeSummary,
  };
  
  await database.put('archives', archive);
  return archive.id;
}

// 获取所有档案
export async function getAllArchives(): Promise<ArchiveRecord[]> {
  const database = await initDatabase();
  const archives = await database.getAllFromIndex('archives', 'by-start-time');
  return archives.reverse(); // 最新的在前
}

// 获取单个档案
export async function getArchive(id: string): Promise<ArchiveRecord | undefined> {
  const database = await initDatabase();
  return database.get('archives', id);
}

// 删除档案
export async function deleteArchive(id: string): Promise<void> {
  const database = await initDatabase();
  await database.delete('archives', id);
}

// 保存当前游戏会话（用于页面刷新恢复）
export async function saveGameSession(
  session: Omit<GameSession, 'id' | 'lastUpdated'>
): Promise<void> {
  const database = await initDatabase();
  
  const sessionData: GameSession = {
    ...session,
    id: 'current-session',
    lastUpdated: Date.now(),
  };
  
  await database.put('sessions', sessionData);
}

// 获取当前游戏会话
export async function getGameSession(): Promise<GameSession | undefined> {
  const database = await initDatabase();
  return database.get('sessions', 'current-session');
}

// 清除游戏会话
export async function clearGameSession(): Promise<void> {
  const database = await initDatabase();
  await database.delete('sessions', 'current-session');
}

// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = 5000; // 5秒

let autoSaveTimer: NodeJS.Timeout | null = null;

// 开始自动保存
export function startAutoSave(
  getSession: () => Omit<GameSession, 'id' | 'lastUpdated'>
): void {
  stopAutoSave();
  
  autoSaveTimer = setInterval(async () => {
    try {
      const session = getSession();
      if (session.playerState && session.gamePhase !== 'intro') {
        await saveGameSession(session);
        console.log('[AutoSave] 游戏状态已保存');
      }
    } catch (error) {
      console.error('[AutoSave] 保存失败:', error);
    }
  }, AUTO_SAVE_INTERVAL);
}

// 停止自动保存
export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

// 导出档案为JSON
export function exportArchiveToJSON(archive: ArchiveRecord): string {
  return JSON.stringify(archive, null, 2);
}

// 计算档案统计信息
export function calculateArchiveStats(archives: ArchiveRecord[]) {
  const total = archives.length;
  const avgAge = total > 0 
    ? archives.reduce((sum, a) => sum + a.finalAge, 0) / total 
    : 0;
  
  const stateDistribution: Record<string, number> = {};
  archives.forEach(a => {
    stateDistribution[a.lifeState] = (stateDistribution[a.lifeState] || 0) + 1;
  });
  
  return {
    total,
    avgAge: Math.round(avgAge),
    stateDistribution,
  };
}
