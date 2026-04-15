/**
 * 随机事件系统 - 生活中的意外与无常
 *
 * 不同年龄段有不同的烦恼：
 * - 青年期（18-30）：失恋、失业、被骗、生病
 * - 中年期（30-50）：裁员、离婚、房贷压力、父母生病
 * - 老年期（50+）：疾病、孤独、退休适应
 */

import { PlayerState, PlayerStats, LifeStateType } from './types';

export interface RandomLifeEvent {
  id: string;
  title: string;
  description: string;
  minAge: number;
  maxAge: number;
  // 基础触发概率（每年）
  baseProbability: number;
  // 触发条件
  conditions?: {
    minStats?: Partial<PlayerStats>;
    maxStats?: Partial<PlayerStats>;
    lifeStates?: LifeStateType[];
    gender?: 'male' | 'female';
  };
  // 属性影响
  effects: Partial<PlayerStats>;
  // 是否可能导致人生状态改变
  stateChange?: {
    newState: LifeStateType;
    probability: number;
  };
  // 后续事件（连锁反应）
  followUpEvents?: string[];
}

// ========== 青年期事件 (18-30岁) ==========
const youthEvents: RandomLifeEvent[] = [
  {
    id: 'breakup_first',
    title: '初恋分手',
    description: '你们以为能走到最后，但毕业季就是分手季。你删掉了所有合照，却也删不掉回忆。',
    minAge: 18,
    maxAge: 24,
    baseProbability: 0.15,
    effects: { happiness: -15, health: -3 },
  },
  {
    id: 'workplace_bullying',
    title: '职场PUA',
    description: '你的上司总是当众贬低你，"这点事都做不好，年轻人还是太嫩"。你开始怀疑自己的能力。',
    minAge: 22,
    maxAge: 28,
    baseProbability: 0.12,
    conditions: { lifeStates: ['worker'] },
    effects: { happiness: -12, health: -5, money: 2 }, // 为了钱忍气吞声
  },
  {
    id: 'startup_fraud',
    title: '被割韭菜',
    description: '你轻信了一个"稳赚不赔"的副业项目，交了几万块加盟费，结果发现是骗局。',
    minAge: 22,
    maxAge: 30,
    baseProbability: 0.08,
    effects: { money: -20, happiness: -10, intelligence: 2 }, // 交了智商税
  },
  {
    id: 'acute_illness',
    title: '急性疾病',
    description: '长期熬夜和不规律饮食终于爆发了，你半夜被送进急诊。医生说你再这么拼会猝死的。',
    minAge: 22,
    maxAge: 35,
    baseProbability: 0.1,
    conditions: { minStats: { health: 30 }, maxStats: { health: 60 } },
    effects: { health: -15, money: -10, happiness: -5 },
  },
  {
    id: 'job_hunt_struggle',
    title: '求职寒冬',
    description: '你投了一百份简历，面试了二十家公司，全都石沉大海。招聘软件上的已读不回让你绝望。',
    minAge: 21,
    maxAge: 28,
    baseProbability: 0.14,
    conditions: { lifeStates: ['normal'] },
    effects: { happiness: -15, money: -8, health: -3 },
  },
  {
    id: 'roommate_drama',
    title: '租房纠纷',
    description: '室友半夜打游戏、不冲厕所、带对象回来过夜。你提了几次无果，只能默默忍受或搬家。',
    minAge: 22,
    maxAge: 30,
    baseProbability: 0.18,
    effects: { happiness: -8, money: -5 },
  },
  {
    id: 'family_pressure',
    title: '家长催婚',
    description: '过年回家，七大姑八大姨围着你问"有对象了吗"。你妈偷偷在你包里塞了相亲对象的照片。',
    minAge: 25,
    maxAge: 30,
    baseProbability: 0.2,
    effects: { happiness: -10, health: -2 },
  },
  {
    id: 'credit_card_debt',
    title: '超前消费',
    description: '为了维持体面，你办了多张信用卡互相倒。还款日那天，你发现窟窿已经填不上了。',
    minAge: 22,
    maxAge: 30,
    baseProbability: 0.12,
    conditions: { maxStats: { money: 40 } },
    effects: { money: -15, happiness: -8, health: -3 },
  },
  {
    id: 'work_overtime_death',
    title: '996暴击',
    description: '连续加班三个月后，你在工位上突然眼前发黑。公司说"年轻人要拼搏"，却只给了你一天病假。',
    minAge: 23,
    maxAge: 32,
    baseProbability: 0.15,
    conditions: { lifeStates: ['worker'] },
    effects: { health: -12, happiness: -10, money: 3 },
  },
  {
    id: 'university_regret',
    title: '专业后悔',
    description: '你发现自己学的专业就业极差，转行又不知道能干什么。四年青春，好像喂了狗。',
    minAge: 22,
    maxAge: 25,
    baseProbability: 0.1,
    effects: { happiness: -12, intelligence: -3 },
  },
];

// ========== 中年危机事件 (30-50岁) ==========
const midlifeEvents: RandomLifeEvent[] = [
  {
    id: 'layoff_35',
    title: '35岁裁员',
    description: 'HR把你叫进会议室，说"公司战略调整"。你看着赔偿协议，知道这不是你的问题，是年龄的问题。',
    minAge: 32,
    maxAge: 45,
    baseProbability: 0.12,
    conditions: { lifeStates: ['worker'] },
    effects: { money: -20, happiness: -20, health: -5 },
    stateChange: { newState: 'normal', probability: 1 },
  },
  {
    id: 'divorce_crisis',
    title: '婚姻破裂',
    description: '你们从无话不说到无话可说。财产分割、抚养权争夺，曾经最亲密的人变成了对手。',
    minAge: 30,
    maxAge: 50,
    baseProbability: 0.08,
    effects: { happiness: -25, money: -15, health: -8 },
  },
  {
    id: 'mortgage_pressure',
    title: '房贷压顶',
    description: '房价跌了，但月供一分不能少。你看着房产APP上缩水的资产，觉得这辈子都给银行打工了。',
    minAge: 28,
    maxAge: 50,
    baseProbability: 0.15,
    conditions: { maxStats: { money: 50 } },
    effects: { happiness: -12, money: -8, health: -3 },
  },
  {
    id: 'parent_illness',
    title: '父母重病',
    description: '爸爸查出癌症晚期。你请了长假陪护，看着化疗掉光的头发，第一次真切感受到死亡的气息。',
    minAge: 30,
    maxAge: 55,
    baseProbability: 0.1,
    effects: { money: -25, happiness: -20, health: -10 },
  },
  {
    id: 'child_education',
    title: '教育焦虑',
    description: '为了学区房，你们掏空六个钱包。孩子上了重点小学，但作业比你当年还难，你根本不会辅导。',
    minAge: 30,
    maxAge: 50,
    baseProbability: 0.14,
    effects: { money: -20, happiness: -8, health: -5 },
  },
  {
    id: 'career_bottleneck',
    title: '升职无望',
    description: '比你晚来的小年轻成了你上司。你知道不是能力问题，是你"性价比不够高"。',
    minAge: 32,
    maxAge: 50,
    baseProbability: 0.18,
    conditions: { lifeStates: ['worker'] },
    effects: { happiness: -15, health: -3 },
  },
  {
    id: 'business_failure',
    title: '创业失败',
    description: '你抵押房子开的店倒闭了。看着堆积如山的库存，你知道不仅钱没了，家也可能保不住。',
    minAge: 30,
    maxAge: 50,
    baseProbability: 0.25, // 创业失败率本来就高
    conditions: { lifeStates: ['business'] },
    effects: { money: -40, happiness: -25, health: -10 },
    stateChange: { newState: 'debt', probability: 0.7 },
  },
  {
    id: 'affair_discovered',
    title: '出轨暴露',
    description: '你的秘密被发现了。无论选择家庭还是第三者，你都要付出代价——名誉、财产、孩子的信任。',
    minAge: 32,
    maxAge: 55,
    baseProbability: 0.05,
    effects: { happiness: -20, money: -20, health: -8 },
  },
  {
    id: 'chronic_disease',
    title: '慢性病来袭',
    description: '体检报告上多了高血压、脂肪肝、尿酸高。医生说你再不改变生活方式，下半辈子都要吃药。',
    minAge: 35,
    maxAge: 60,
    baseProbability: 0.2,
    effects: { health: -15, happiness: -8, money: -5 },
  },
  {
    id: 'investment_loss',
    title: '投资踩雷',
    description: '你跟着"专家"买的基金股票暴跌，几年的积蓄蒸发了一半。理财理着理着，财没了。',
    minAge: 28,
    maxAge: 60,
    baseProbability: 0.15,
    conditions: { minStats: { money: 40 } },
    effects: { money: -25, happiness: -15, health: -3 },
  },
  {
    id: 'workplace_politics',
    title: '站队失败',
    description: '公司内部派系斗争，你站错了队。新领导上任后，你成了被边缘化的"前朝余孽"。',
    minAge: 30,
    maxAge: 55,
    baseProbability: 0.12,
    conditions: { lifeStates: ['worker', 'civil'] },
    effects: { happiness: -15, money: -5 },
  },
  {
    id: 'child_rebellion',
    title: '青春期对抗',
    description: '孩子开始顶嘴、锁门、成绩暴跌。你想起自己当年也是这样，报应来了。',
    minAge: 38,
    maxAge: 55,
    baseProbability: 0.16,
    effects: { happiness: -12, health: -5 },
  },
];

// ========== 老年期事件 (50岁+) ==========
const elderlyEvents: RandomLifeEvent[] = [
  {
    id: 'retirement_depression',
    title: '退休失落',
    description: '你终于退休了，却发现没有晨会、没有KPI的日子空虚得可怕。你怀念那种被需要的感觉。',
    minAge: 55,
    maxAge: 70,
    baseProbability: 0.2,
    conditions: { lifeStates: ['worker', 'civil'] },
    effects: { happiness: -15, health: -5 },
    stateChange: { newState: 'retired', probability: 1 },
  },
  {
    id: 'serious_illness',
    title: '大病来袭',
    description: '医生拿着片子告诉你坏消息。你第一反应不是害怕死亡，是担心治疗费用会拖垮孩子。',
    minAge: 50,
    maxAge: 100,
    baseProbability: 0.15,
    effects: { health: -25, money: -30, happiness: -15 },
  },
  {
    id: 'spouse_loss',
    title: '老伴离世',
    description: '你们约好要一起看孙子上大学，ta却先走了。那个陪你吃了几十年饭的人，再也回不来了。',
    minAge: 55,
    maxAge: 100,
    baseProbability: 0.08,
    effects: { happiness: -35, health: -15, money: -5 },
  },
  {
    id: 'pension_fraud',
    title: '养老诈骗',
    description: '推销员嘴比蜜甜，说投资养老公寓能翻倍。你转了账，再打电话已是空号。',
    minAge: 55,
    maxAge: 100,
    baseProbability: 0.1,
    effects: { money: -30, happiness: -20, health: -8 },
  },
  {
    id: 'loneliness',
    title: '空巢孤独',
    description: '孩子们在外地忙，电话从每天一个变成每周一个。你对着电视发呆，不知道明天要干嘛。',
    minAge: 55,
    maxAge: 100,
    baseProbability: 0.18,
    effects: { happiness: -15, health: -8 },
  },
  {
    id: 'chronic_pain',
    title: '浑身是病',
    description: '膝盖疼、腰疼、血压高。你成了医院的常客，药盒比饭盒还大。',
    minAge: 60,
    maxAge: 100,
    baseProbability: 0.25,
    effects: { health: -20, happiness: -12, money: -10 },
  },
  {
    id: 'children_unfilial',
    title: '子女不孝',
    description: '你倾尽所有供孩子出国，现在他们连电话都懒得打。你才明白，养儿防老是个笑话。',
    minAge: 60,
    maxAge: 100,
    baseProbability: 0.08,
    effects: { happiness: -25, health: -10 },
  },
];

// ========== 全年龄段通用事件 ==========
const universalEvents: RandomLifeEvent[] = [
  {
    id: 'traffic_accident',
    title: '交通事故',
    description: '一个走神，追尾了。幸好人都没事，但修车费和误工费让你心疼。',
    minAge: 18,
    maxAge: 100,
    baseProbability: 0.06,
    effects: { money: -15, health: -5, happiness: -5 },
  },
  {
    id: 'phone_broken',
    title: '手机报废',
    description: '手机突然黑屏，所有数据没备份。你被迫花大价钱买了新手机，还丢了三年照片。',
    minAge: 18,
    maxAge: 100,
    baseProbability: 0.08,
    effects: { money: -8, happiness: -6 },
  },
  {
    id: 'friend_betrayal',
    title: '朋友背叛',
    description: '你信任的兄弟/闺蜜，在关键时刻捅了你一刀。你终于明白，成年人的友谊都是利益。',
    minAge: 20,
    maxAge: 60,
    baseProbability: 0.07,
    effects: { happiness: -12, network: -10 },
  },
  {
    id: 'good_luck_small',
    title: '小确幸',
    description: '你在旧外套口袋里发现了几百块钱，或者刮彩票中了五十块。虽然不多，但开心了一整天。',
    minAge: 18,
    maxAge: 100,
    baseProbability: 0.1,
    effects: { money: 3, happiness: 8 },
  },
  {
    id: 'skill_breakthrough',
    title: '技能顿悟',
    description: '困扰你很久的问题突然想通了，或者学会了新技能。这种成长的感觉很棒。',
    minAge: 18,
    maxAge: 100,
    baseProbability: 0.08,
    effects: { intelligence: 3, happiness: 5 },
  },
];

// 所有事件汇总
export const ALL_RANDOM_EVENTS: RandomLifeEvent[] = [
  ...youthEvents,
  ...midlifeEvents,
  ...elderlyEvents,
  ...universalEvents,
];

/**
 * 获取当前年龄可能触发的事件
 */
export function getEventsForAge(age: number): RandomLifeEvent[] {
  return ALL_RANDOM_EVENTS.filter(e => age >= e.minAge && age <= e.maxAge);
}

/**
 * 计算事件触发概率（考虑玩家状态）
 */
function calculateEventProbability(
  event: RandomLifeEvent,
  player: PlayerState
): number {
  let probability = event.baseProbability;

  // 检查条件
  if (event.conditions) {
    // 人生状态限制
    if (event.conditions.lifeStates &&
        !event.conditions.lifeStates.includes(player.lifeState)) {
      return 0;
    }

    // 性别限制
    if (event.conditions.gender && event.conditions.gender !== player.gender) {
      return 0;
    }

    // 最低属性要求
    if (event.conditions.minStats) {
      for (const [stat, min] of Object.entries(event.conditions.minStats)) {
        const value = player.stats[stat as keyof PlayerStats];
        if (value === undefined || value < min!) {
          return 0;
        }
      }
    }

    // 最高属性限制
    if (event.conditions.maxStats) {
      for (const [stat, max] of Object.entries(event.conditions.maxStats)) {
        const value = player.stats[stat as keyof PlayerStats];
        if (value === undefined || value > max!) {
          return 0;
        }
      }
    }
  }

  // 根据玩家状态调整概率

  // 健康差更容易生病
  if (event.id.includes('illness') || event.id.includes('disease')) {
    if (player.stats.health < 40) probability *= 2;
    else if (player.stats.health > 70) probability *= 0.5;
  }

  // 钱少更容易失业焦虑
  if (event.id === 'layoff_35' || event.id === 'job_hunt_struggle') {
    if (player.stats.money < 30) probability *= 1.5;
  }

  // 心情不好更容易出意外
  if (event.id === 'traffic_accident' || event.id.includes('conflict')) {
    if (player.stats.happiness < 40) probability *= 1.3;
  }

  // 高快乐降低负面事件概率
  if (player.stats.happiness > 70 && event.effects.happiness && event.effects.happiness < 0) {
    probability *= 0.8;
  }

  // 体制内工作降低失业风险
  if (event.id === 'layoff_35' && player.lifeState === 'civil') {
    probability *= 0.3; // 体制内裁员概率大幅降低
  }

  return Math.min(0.5, Math.max(0, probability)); // 最高50%概率
}

/**
 * 尝试触发随机事件
 * @returns 触发的事件，如果没有触发则返回null
 */
export function tryTriggerRandomEvent(player: PlayerState): RandomLifeEvent | null {
  // 获取当前年龄段的所有事件
  const possibleEvents = getEventsForAge(player.age);

  if (possibleEvents.length === 0) return null;

  // 计算每个事件的实际概率
  const eventProbabilities = possibleEvents.map(event => ({
    event,
    probability: calculateEventProbability(event, player),
  })).filter(ep => ep.probability > 0);

  if (eventProbabilities.length === 0) return null;

  // 按概率排序，优先检查高概率事件
  eventProbabilities.sort((a, b) => b.probability - a.probability);

  // 依次尝试触发（每个事件独立判定）
  for (const { event, probability } of eventProbabilities) {
    // 检查是否已触发过（同一年龄段不重复触发同一事件）
    const eventKey = `${event.id}_${Math.floor(player.age / 5)}`; // 每5年只能触发一次同一事件
    if (player.usedEvents.has(eventKey)) continue;

    if (Math.random() < probability) {
      return event;
    }
  }

  return null;
}

/**
 * 生成事件叙事文本
 */
export function generateEventNarrative(
  event: RandomLifeEvent,
  player: PlayerState
): string {
  let narrative = event.description;

  // 根据玩家状态追加描述
  if (event.effects.money && event.effects.money < -20 && player.stats.money < 30) {
    narrative += ' 这对本不富裕的你来说更是雪上加霜。';
  }

  if (event.effects.health && event.effects.health < -10 && player.stats.health < 50) {
    narrative += ' 你的身体本来就不好，这次打击让你元气大伤。';
  }

  return narrative;
}
