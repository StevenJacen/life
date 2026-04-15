/**
 * 出身家庭系统
 * 定义6种标准家庭类型 + 1种隐藏家庭
 */

import { FamilyType, BirthFamily } from './types';

// 家庭类型名称映射
export const FAMILY_NAMES: Record<FamilyType, string> = {
  RICH: '富裕家庭',
  SYSTEM: '体制内家庭',
  EDUCATED: '书香门第',
  NORMAL: '普通家庭',
  POOR: '贫困家庭',
  BUSINESS: '经商家庭',
  WINNER: '拆迁户家庭'
};

// 家庭类型详细定义
export const FAMILY_TYPES: Record<FamilyType, BirthFamily> = {
  RICH: {
    type: 'RICH',
    description: '含着金汤匙出生，从小衣食无忧，但父母的期望也更高。',
    initialMoney: 80,
    intelligenceBonus: 10,
    appearanceBonus: 15,
    healthBonus: 10,
    specialEvents: ['rich_childhood', 'private_school', 'overseas_trip', 'family_expectation']
  },
  SYSTEM: {
    type: 'SYSTEM',
    description: '父母都是体制内工作者，生活稳定但缺乏激情。',
    initialMoney: 50,
    intelligenceBonus: 5,
    appearanceBonus: 0,
    healthBonus: 5,
    specialEvents: ['stable_childhood', 'civil_service_talk', 'political_education', 'network_building']
  },
  EDUCATED: {
    type: 'EDUCATED',
    description: '家里摆满了书，父母都是知识分子，望子成龙心切。',
    initialMoney: 45,
    intelligenceBonus: 20,
    appearanceBonus: 0,
    healthBonus: 0,
    specialEvents: ['early_reading', 'tutoring', 'academic_pressure', 'cultural_activities']
  },
  NORMAL: {
    type: 'NORMAL',
    description: '万千普通家庭的缩影，平平淡淡才是真。',
    initialMoney: 35,
    intelligenceBonus: 0,
    appearanceBonus: 0,
    healthBonus: 0,
    specialEvents: ['ordinary_day', 'family_dinner', 'school_life', 'summer_vacation']
  },
  POOR: {
    type: 'POOR',
    description: '家境贫寒，从小就知道钱的重要性。',
    initialMoney: 10,
    intelligenceBonus: -5,
    appearanceBonus: -5,
    healthBonus: -10,
    specialEvents: ['hunger_memory', 'part_time_work', 'scholarship_hope', 'class_gap']
  },
  BUSINESS: {
    type: 'BUSINESS',
    description: '父母是生意人，耳濡目染学会了不少人情世故。',
    initialMoney: 55,
    intelligenceBonus: 5,
    appearanceBonus: 5,
    healthBonus: 0,
    specialEvents: ['shop_childhood', 'business_talk', 'calculation_skill', 'risk_awareness']
  },
  WINNER: {
    type: 'WINNER',
    description: '天降横财！家里老房子拆迁，一夜之间财务自由。',
    initialMoney: 95,
    intelligenceBonus: 0,
    appearanceBonus: 0,
    healthBonus: 5,
    specialEvents: ['sudden_wealth', 'relatives_visit', 'money_management', 'new_lifestyle']
  }
};

/**
 * 随机生成出身家庭
 * WINNER类型有5%概率出现
 */
export function generateBirthFamily(): BirthFamily {
  const random = Math.random();
  
  // 5%概率触发隐藏家庭：拆迁户
  if (random < 0.05) {
    return { ...FAMILY_TYPES.WINNER };
  }
  
  // 其他家庭类型平均分布
  const standardTypes: FamilyType[] = ['RICH', 'SYSTEM', 'EDUCATED', 'NORMAL', 'POOR', 'BUSINESS'];
  const selectedType = standardTypes[Math.floor(Math.random() * standardTypes.length)];
  
  return { ...FAMILY_TYPES[selectedType] };
}

/**
 * 根据家庭类型获取推荐人生路线
 */
export function getRecommendedPath(familyType: FamilyType): string {
  const recommendations: Record<FamilyType, string> = {
    RICH: '继承家业或创业',
    SYSTEM: '考公或考研',
    EDUCATED: '学术或专业路线',
    NORMAL: '多种选择皆可',
    POOR: '打工攒钱或技能学习',
    BUSINESS: '经商或销售',
    WINNER: '理财或享受人生'
  };
  return recommendations[familyType];
}

/**
 * 获取家庭类型描述（带图标）
 */
export function getFamilyFlavorText(familyType: FamilyType): string {
  const flavor: Record<FamilyType, string> = {
    RICH: '起跑线领先一点，但家里对“不能输”这件事也会格外认真。',
    SYSTEM: '稳定感从小就有，很多决定看起来不刺激，但长辈会觉得很踏实。',
    EDUCATED: '书架和期待一样高，夸你聪明的同时，也默认你不能随便摆烂。',
    NORMAL: '这类剧本看着普通，其实最考验后天操作，主打一个全靠自己慢慢盘。',
    POOR: '资源少一点，懂事会早一点，笑点也常常是被生活逼出来的。',
    BUSINESS: '耳濡目染的人情世故不少，胆子和算盘都容易比同龄人早熟。',
    WINNER: '命运突然发红包，接下来是躺赢还是乱花，就看家庭有没有后续操作。'
  };

  return flavor[familyType];
}

export function getFamilyDescription(familyType: FamilyType): string {
  const icons: Record<FamilyType, string> = {
    RICH: '💎',
    SYSTEM: '🏛️',
    EDUCATED: '📚',
    NORMAL: '🏠',
    POOR: '💪',
    BUSINESS: '💼',
    WINNER: '🎰'
  };
  return `${icons[familyType]} ${FAMILY_NAMES[familyType]}`;
}
