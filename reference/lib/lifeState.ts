/**
 * 人生状态管理
 * 定义状态转换、状态效果和状态描述
 */

import { LifeStateType, PlayerState, PlayerStats } from './types';

// 人生状态名称
export const LIFE_STATE_NAMES: Record<LifeStateType, string> = {
  normal: '普通',
  student: '学生',
  worker: '打工人',
  business: '创业者',
  freelancer: '自由职业',
  civil: '体制内',
  hermit: '隐居',
  beggar: '乞讨者',
  criminal: '边缘人',
  addict: '成瘾者',
  delinquent: '问题少年',
  retired: '退休',
  elder: '暮年',
  debt: '负债者',
  bankrupt: '破产'
};

// 人生状态描述
export const LIFE_STATE_DESCRIPTIONS: Record<LifeStateType, string> = {
  normal: '平凡而普通的生活',
  student: '寒窗苦读，为前途奋斗',
  worker: '朝九晚五，为生活奔波',
  business: '创业维艰，九死一生',
  freelancer: '自由不羁，收入不稳',
  civil: '稳定安逸，一眼到头',
  hermit: '远离尘嚣，淡泊名利',
  beggar: '流落街头，苟延残喘',
  criminal: '铤而走险，刀口舔血',
  addict: '沉迷虚幻，无法自拔',
  delinquent: '叛逆不羁，游荡街头',
  retired: '含饴弄孙，颐养天年',
  elder: '日薄西山，回忆往昔',
  debt: '债台高筑，艰难度日',
  bankrupt: '一无所有，从头再来'
};

// 状态被动效果（每年自动应用）
export const STATE_EFFECTS: Record<LifeStateType, Partial<PlayerStats>> = {
  normal: {},
  student: { intelligence: 2, money: -1 },
  worker: { money: 3, health: -1, happiness: -1 },
  business: { money: 5, happiness: 2, health: -1 },
  freelancer: { money: 2, happiness: 2 },
  civil: { money: 2, happiness: 1 },
  hermit: { money: -3, happiness: 5, health: 2 },
  beggar: { money: 1, happiness: -3, health: -2 },
  criminal: { money: 8, happiness: -5, health: -3 },
  addict: { money: -5, happiness: 3, health: -5, intelligence: -2 },
  delinquent: { happiness: 3, intelligence: -1, money: -1, appearance: 2 },
  retired: { money: -2, happiness: 3, health: -1 },
  elder: { money: -1, health: -2 },
  debt: { happiness: -5, health: -2, money: -2 },
  bankrupt: { happiness: -3, money: 1 }
};

/**
 * 根据玩家状态确定当前人生状态
 */
export function determineLifeState(player: PlayerState): LifeStateType {
  const { money, happiness, health } = player.stats;
  const age = player.age;
  const currentState = player.lifeState;
  
  // 死亡检查
  if (health <= 0) return currentState;
  
  // 破产检查
  if (money < -30) return 'bankrupt';
  
  // 负债检查
  if (money < -10 && money >= -30) return 'debt';
  
  // 犯罪边缘（极度贫困 + 不快乐）
  if (money < -20 && happiness < 20) return 'criminal';
  
  // 乞讨
  if (money < 0 && money >= -10) return 'beggar';
  
  // 成瘾
  if (happiness < 10 && currentState !== 'addict') return 'addict';
  
  // 隐居（不快乐 + 中年 + 不穷）
  if (happiness < 30 && money >= 0 && age > 30 && age < 70) return 'hermit';
  
  // 老年（70+）
  if (age >= 70) return 'elder';
  
  // 退休（60-70岁且原本是打工人/体制内/创业者）
  if (age >= 60 && ['worker', 'civil', 'business'].includes(currentState)) {
    return 'retired';
  }
  
  return currentState;
}

/**
 * 获取状态转换描述
 */
export function getStateTransitionNarrative(
  oldState: LifeStateType, 
  newState: LifeStateType
): string {
  const transitions: Record<string, Record<string, string>> = {
    worker: {
      beggar: '失业后你一直找不到工作，积蓄耗尽，最终流落街头。',
      debt: '你欠下了巨额债务，每个月都在还债中度过。',
      business: '你决定辞职创业，开始了一段未知的旅程。',
      retired: '终于到了退休年龄，你告别了职场。',
      hermit: '厌倦了职场，你决定归隐山林。',
      criminal: '走投无路的你开始铤而走险。',
    },
    business: {
      bankrupt: '创业失败，你破产了，一切从零开始。',
      debt: '公司资金链断裂，你背上了沉重的债务。',
      criminal: '走投无路的你开始铤而走险。',
      worker: '创业失败后，你重新找了一份工作。',
    },
    normal: {
      hermit: '你决定远离尘嚣，开始隐居生活。',
      beggar: '生活所迫，你开始街头乞讨。',
      student: '你开始了求学之路。',
    },
    student: {
      worker: '毕业后的你成为了一名打工人。',
      business: '刚毕业你就决定创业。',
      civil: '你考上了公务员。',
    },
    retired: {
      elder: '岁月不饶人，你进入了暮年。',
    },
    beggar: {
      worker: '你决定重新找工作，告别街头。',
      criminal: '乞讨不够糊口，你开始铤而走险。',
    },
    debt: {
      worker: '你努力工作，终于还清了债务。',
      bankrupt: '债务越滚越大，你最终破产了。',
    },
    bankrupt: {
      worker: '破产后你重新开始，找了一份工作。',
      beggar: '一无所有后，你只能流落街头。',
    },
  };
  
  return transitions[oldState]?.[newState] 
    || `你从${LIFE_STATE_NAMES[oldState]}变成了${LIFE_STATE_NAMES[newState]}。`;
}

/**
 * 检查是否应该触发结局
 */
export function checkEndCondition(player: PlayerState): { 
  shouldEnd: boolean; 
  endType: 'death' | 'enlightenment' | 'breakdown' | 'natural' | null;
  reason: string;
} {
  const { stats, age } = player;
  
  // 1. 健康归零 - 死亡
  if (stats.health <= 0) {
    return { 
      shouldEnd: true, 
      endType: 'death', 
      reason: age > 70 ? '寿终正寝' : '积劳成疾' 
    };
  }
  
  // 2. 极端幸福 - 顿悟（年龄限制，至少30岁）
  if (stats.happiness >= 100 && age >= 30) {
    return { 
      shouldEnd: true, 
      endType: 'enlightenment', 
      reason: '大彻大悟，超凡入圣' 
    };
  }
  
  // 3. 极端崩溃 - 精神崩溃（年龄限制，至少25岁）
  if (stats.happiness <= 0 && age >= 25) {
    return { 
      shouldEnd: true, 
      endType: 'breakdown', 
      reason: '精神崩溃' 
    };
  }
  
  // 4. 年龄软限制 - 自然结束
  if (age > 80) {
    const rand = Math.random();
    if (rand > 0.7) {
      return { 
        shouldEnd: true, 
        endType: 'natural', 
        reason: '安详离世' 
      };
    }
  }
  if (age > 90) {
    return { 
      shouldEnd: true, 
      endType: 'natural', 
      reason: '活到了生命的终点' 
    };
  }
  
  return { shouldEnd: false, endType: null, reason: '' };
}

/**
 * 获取状态特定事件
 */
export function getStateSpecificEvents(state: LifeStateType): string[] {
  const events: Record<LifeStateType, string[]> = {
    normal: ['平淡的一天', '例行公事'],
    student: ['考试周', '论文deadline', '校园恋爱'],
    worker: ['996加班', 'KPI压力', '职场PUA'],
    business: ['融资失败', '合伙人撕逼', '突然爆红'],
    freelancer: ['接不到活', '客户跑路', '自由真好'],
    civil: ['体制内八卦', '升职无望', '稳定压倒一切'],
    hermit: ['山中岁月', '冥想悟道', '种菜养花'],
    beggar: ['今天收成不错', '被驱赶', '遇到好心人'],
    criminal: ['第一次作案', '差点被抓', '金盆洗手'],
    addict: ['戒断反应', '又一次复吸', '彻底堕落'],
    delinquent: ['逃学被抓', '打架斗殴', '网吧通宵'],
    retired: ['带孙子', '跳广场舞', '老年大学'],
    elder: ['回忆往事', '等待死亡', '看破红尘'],
    debt: ['催债电话', '东躲西藏', '咬牙还债'],
    bankrupt: ['从零开始', '打工还债', '东山再起'],
  };
  
  return events[state] || events.normal;
}

/**
 * 获取人生状态描述
 */
export function getLifeStateDescription(state: LifeStateType): string {
  return LIFE_STATE_DESCRIPTIONS[state];
}
