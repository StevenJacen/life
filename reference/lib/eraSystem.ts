/**
 * 时代背景系统 - 根据出生年份确定时代背景
 */

import { PlayerStats } from './types';

export const START_YEAR = 1970;
export const END_YEAR = 2020;

export interface EraEvent {
  age: number;
  year: number;
  title: string;
  description: string;
  impact: string;
  statChanges?: Partial<PlayerStats>;
}

export interface EraOpportunity {
  name: string;
  triggerAge: number;
  description: string;
  successRate: number;
  successEffects: Partial<PlayerStats>;
}

export interface EraPeriod {
  name: string;
  description: string;
  startYear: number;
  endYear: number;
  statModifiers: Partial<PlayerStats>;
  events: EraEvent[];
  opportunities: EraOpportunity[];
}

// 70后 (1970-1979)
export const ERA_70S: EraPeriod = {
  name: '70后',
  description: '改革开放初期出生，经历经济腾飞，享受时代红利最多的一代',
  startYear: 1970,
  endYear: 1979,
  statModifiers: { money: 5, happiness: 0 },
  events: [
    { age: 8, year: 1978, title: '改革开放', description: '你上小学时，改革开放开始了', impact: '未来充满机遇' }
  ],
  opportunities: [
    { name: '下海经商', triggerAge: 25, description: '90年代下海潮，你敢不敢放弃铁饭碗？', successRate: 0.3, successEffects: { money: 50, happiness: 10 } },
    { name: ' early买房', triggerAge: 28, description: '2000年前房价极低，你能预见未来吗？', successRate: 0.6, successEffects: { money: 80, happiness: 5 } }
  ]
};

// 80后 (1980-1989)
export const ERA_80S: EraPeriod = {
  name: '80后',
  description: '计划生育第一代，独享宠爱也独扛压力',
  startYear: 1980,
  endYear: 1989,
  statModifiers: { intelligence: 5, happiness: -2 },
  events: [
    { age: 10, year: 1990, title: '上海浦东开发', description: '你的童年伴随着经济高速发展', impact: '见识了繁华世界' },
    { age: 18, year: 1998, title: '大学扩招', description: '你高考时大学开始扩招，更多人能上大学了', impact: '学历贬值的开始' },
    { age: 20, year: 2000, title: '千禧年', description: '新千年的到来，互联网开始兴起', impact: '站在了互联网风口' }
  ],
  opportunities: [
    { name: '炒房', triggerAge: 25, description: '2005年左右房价开始上涨，你抓住机会了吗？', successRate: 0.5, successEffects: { money: 60 } },
    { name: '互联网创业', triggerAge: 28, description: '2010年移动互联网爆发，你敢创业吗？', successRate: 0.2, successEffects: { money: 100, happiness: 20 } }
  ]
};

// 90后 (1990-1999)
export const ERA_90S: EraPeriod = {
  name: '90后',
  description: '互联网时代原住民，内卷时代的亲历者',
  startYear: 1990,
  endYear: 1999,
  statModifiers: { intelligence: 10, happiness: -5 },
  events: [
    { age: 10, year: 2000, title: '互联网泡沫', description: '千禧年互联网泡沫破裂，但你还小不懂这些', impact: '冥冥中注定要跟互联网纠缠' },
    { age: 18, year: 2008, title: '北京奥运会', description: '你成年那年，中国举办了奥运会', impact: '民族自豪感爆棚' },
    { age: 20, year: 2010, title: '移动互联网元年', description: 'iPhone4发布，移动互联网时代到来', impact: '你是互联网原住民' }
  ],
  opportunities: [
    { name: '短视频风口', triggerAge: 25, description: '2015年短视频爆发，你成为网红了吗？', successRate: 0.15, successEffects: { money: 50, happiness: 15 } },
    { name: '加密数字货币', triggerAge: 27, description: '2017年比特币暴涨，你入场了吗？', successRate: 0.1, successEffects: { money: 200 } }
  ]
};

// 00后 (2000-2009)
export const ERA_00S: EraPeriod = {
  name: '00后',
  description: '生于盛世，长于互联网，面对最卷的时代',
  startYear: 2000,
  endYear: 2009,
  statModifiers: { intelligence: 15, happiness: -8 },
  events: [
    { age: 8, year: 2008, title: '北京奥运会', description: '你的童年记忆里有着奥运的烟花', impact: '盛世记忆' },
    { age: 10, year: 2010, title: '移动互联网', description: '你小学时就开始玩智能手机', impact: '数字原住民' },
    { age: 18, year: 2018, title: '贸易战', description: '你成年时，中美关系紧张', impact: '未来充满不确定性' }
  ],
  opportunities: [
    { name: 'AI风口', triggerAge: 23, description: '2023年ChatGPT爆火，AI时代到来', successRate: 0.2, successEffects: { money: 80, intelligence: 20 } }
  ]
};

// 10后 (2010-2020)
export const ERA_10S: EraPeriod = {
  name: '10后',
  description: '生于内卷，长于焦虑，面对未知的世界',
  startYear: 2010,
  endYear: 2020,
  statModifiers: { intelligence: 20, health: -5, happiness: -10 },
  events: [
    { age: 2, year: 2012, title: '世界末日预言', description: '你2岁时，有人预言世界末日', impact: '虚惊一场' },
    { age: 10, year: 2020, title: '新冠疫情', description: '你的童年被疫情笼罩', impact: '网课一代' }
  ],
  opportunities: [
    { name: '未知机遇', triggerAge: 25, description: '未来会发生什么？谁也不知道', successRate: 0.5, successEffects: { money: 50 } }
  ]
};

// 所有时代
export const ALL_ERAS: EraPeriod[] = [ERA_70S, ERA_80S, ERA_90S, ERA_00S, ERA_10S];

// 获取出生年份对应的时代
export function getEraByBirthYear(year: number): EraPeriod {
  const era = ALL_ERAS.find(e => year >= e.startYear && year <= e.endYear);
  return era || ERA_90S; // 默认90后
}

// 获取当年的重大事件
export function getEraEvent(birthYear: number, age: number): EraEvent | null {
  const era = getEraByBirthYear(birthYear);
  const actualYear = birthYear + age;
  return era.events.find(e => e.age === age) || null;
}

// 获取时代红利机会
export function getEraOpportunity(birthYear: number, age: number): EraOpportunity | null {
  const era = getEraByBirthYear(birthYear);
  return era.opportunities.find(o => o.triggerAge === age) || null;
}

// 生成时代背景描述
export function generateEraDescription(birthYear: number, gender: 'male' | 'female'): string {
  const era = getEraByBirthYear(birthYear);
  const genderText = gender === 'male' ? '男孩' : '女孩';
  return `${birthYear}年出生的${genderText}，卡进了${era.name}剧本。${era.description}`;
}

export function getEraPreviewCommentary(birthYear: number): string {
  const era = getEraByBirthYear(birthYear);

  if (era.name === '70后') {
    return '这代人主打一个敢闯敢拼，运气好时能赶上风口，运气一般也得先学会吃苦。';
  }
  if (era.name === '80后') {
    return '独生子女光环和现实压力一起打包到货，小时候被宠，长大后被房贷教育。';
  }
  if (era.name === '90后') {
    return '互联网和内卷同时到场，见过机会，也见过“努力不一定追得上房价”的名场面。';
  }
  if (era.name === '00后') {
    return '从小会用智能设备，也从小习惯竞争，嘴上整顿职场，心里也会为 offer 发愁。';
  }

  return '生在更新更快的年代，信息很多，答案很少，主线任务叫“在焦虑里保持清醒”。';
}

// 获取特定年份的房价倍数（相对1990年）
export function getHousingPriceMultiplier(year: number): number {
  // 简化的房价指数（以1990年为1倍）
  const priceIndex: Record<number, number> = {
    1990: 1,
    1995: 2,
    2000: 3,
    2005: 6,
    2010: 12,
    2015: 20,
    2020: 35,
    2024: 40
  };
  
  // 找到最近的年份
  const years = Object.keys(priceIndex).map(Number).sort((a, b) => a - b);
  let closestYear = years[0];
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(closestYear - year)) {
      closestYear = y;
    }
  }
  
  return priceIndex[closestYear] || 1;
}

// 计算买房卖房的收益
export function calculateRealEstateProfit(buyYear: number, sellYear: number, investment: number): number {
  const buyPrice = getHousingPriceMultiplier(buyYear);
  const sellPrice = getHousingPriceMultiplier(sellYear);
  return Math.floor(investment * (sellPrice / buyPrice));
}

// 获取时代特有的吐槽文案
export function getEraSpecificRoast(birthYear: number, age: number): string | null {
  const era = getEraByBirthYear(birthYear);
  
  // 90后特有吐槽
  if (era.name === '90后') {
    if (age === 25) return '25岁，眼看同龄人有人上车有人上岸，你还在和房价互相装作不认识。';
    if (age === 30) return '30岁，卷又卷不赢，躺又躺不平，只能一边嘴硬一边继续打卡上班。';
  }

  // 80后特有吐槽
  if (era.name === '80后') {
    if (age === 30) return '30岁，差一点就赶上房价起飞前的末班车。人生最怕的不是没机会，是机会从你工位旁边经过。';
  }

  // 00后特有吐槽
  if (era.name === '00后') {
    if (age === 18) return '18岁，高考刚结束，你以为终于自由了，结果现实马上告诉你：选择题才刚开始。';
  }
  
  return null;
}
