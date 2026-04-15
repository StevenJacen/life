/**
 * 输入处理器 - 处理半开放输入节点
 */

import { InputScene, PlayerStats, MoneyStatus } from './types';

// 人生路线类型
export type LifePathType = 
  | 'study'      // 深造
  | 'civil'      // 体制内
  | 'work'       // 打工
  | 'business'   // 创业
  | 'freelance'  // 自由职业
  | 'lie_flat'   // 躺平
  | 'love'       // 爱情
  | 'reality'    // 现实
  | 'family'     // 家庭
  | 'career';    // 事业

// 输入场景定义
export const INPUT_SCENES: InputScene[] = [
  {
    id: 'graduation',
    title: '毕业抉择',
    description: '大学四年转瞬即逝，你站在人生的十字路口。',
    ageRange: [22, 22],
    hint: '比如：考研深造 / 考公务员 / 进大厂打工 / 创业 / 躺平...',
    keywords: {
      '考研': { path: 'study', weight: 1 },
      '读书': { path: 'study', weight: 1 },
      '深造': { path: 'study', weight: 1 },
      '读研': { path: 'study', weight: 1 },
      '考公': { path: 'civil', weight: 1 },
      '公务员': { path: 'civil', weight: 1 },
      '体制内': { path: 'civil', weight: 1 },
      '编制': { path: 'civil', weight: 1 },
      '工作': { path: 'work', weight: 1 },
      '打工': { path: 'work', weight: 1 },
      '上班': { path: 'work', weight: 1 },
      '大厂': { path: 'work', weight: 1 },
      '公司': { path: 'work', weight: 1 },
      '创业': { path: 'business', weight: 1 },
      '开店': { path: 'business', weight: 1 },
      '做生意': { path: 'business', weight: 1 },
      '自由': { path: 'freelance', weight: 1 },
      '接活': { path: 'freelance', weight: 1 },
      '躺': { path: 'lie_flat', weight: 1 },
      '休息': { path: 'lie_flat', weight: 1 },
      '摆烂': { path: 'lie_flat', weight: 1 },
      'gap': { path: 'lie_flat', weight: 1 },
    }
  },
  {
    id: 'marriage_pressure',
    title: '婚恋压力',
    description: '到了适婚年龄，周围人都在催婚，你怎么想？',
    ageRange: [28, 28],
    hint: '比如：嫁给爱情 / 现实一点 / 保持单身 / 先忙事业...',
    keywords: {
      '爱情': { path: 'love', weight: 1 },
      '喜欢': { path: 'love', weight: 1 },
      '爱': { path: 'love', weight: 1 },
      '心动': { path: 'love', weight: 1 },
      '现实': { path: 'reality', weight: 1 },
      '条件': { path: 'reality', weight: 1 },
      '钱': { path: 'reality', weight: 1 },
      '房子': { path: 'reality', weight: 1 },
      '单身': { path: 'lie_flat', weight: 1 },
      '不结': { path: 'lie_flat', weight: 1 },
      '一个人': { path: 'lie_flat', weight: 1 },
      '等等': { path: 'career', weight: 1 },
      '事业': { path: 'career', weight: 1 },
      '先忙': { path: 'career', weight: 1 },
    }
  },
  {
    id: 'midlife_crisis',
    title: '中年危机',
    description: '35岁了，职场开始卡年龄，你开始怀疑人生。',
    ageRange: [35, 35],
    hint: '比如：继续卷 / 换赛道 / 认命躺平 / 创业搏一把...',
    keywords: {
      '卷': { path: 'career', weight: 1 },
      '拼': { path: 'career', weight: 1 },
      '努力': { path: 'career', weight: 1 },
      '升职': { path: 'career', weight: 1 },
      '换': { path: 'work', weight: 1 },
      '跳槽': { path: 'work', weight: 1 },
      '转行': { path: 'work', weight: 1 },
      '新': { path: 'work', weight: 1 },
      '躺': { path: 'lie_flat', weight: 1 },
      '平': { path: 'lie_flat', weight: 1 },
      '认命': { path: 'lie_flat', weight: 1 },
      '接受': { path: 'lie_flat', weight: 1 },
      '创业': { path: 'business', weight: 1 },
      '搏': { path: 'business', weight: 1 },
      '赌': { path: 'business', weight: 1 },
      '做生意': { path: 'business', weight: 1 },
      '家庭': { path: 'family', weight: 1 },
      '孩子': { path: 'family', weight: 1 },
      '父母': { path: 'family', weight: 1 },
    }
  }
];

/**
 * 根据输入分类路线
 */
export function classifyInput(input: string, sceneId: string): { path: LifePathType; confidence: number } {
  const scene = INPUT_SCENES.find(s => s.id === sceneId);
  if (!scene) return { path: 'work', confidence: 0 };
  
  const normalizedInput = input.toLowerCase().trim();
  
  for (const [keyword, mapping] of Object.entries(scene.keywords)) {
    if (normalizedInput.includes(keyword.toLowerCase())) {
      return { path: mapping.path as LifePathType, confidence: mapping.weight };
    }
  }
  
  return { path: 'work', confidence: 0 };
}

/**
 * 根据金钱状态获取状态描述
 */
export function getMoneyStatus(money: number): MoneyStatus {
  if (money < 0) return 'broke';
  if (money < 20) return 'struggling';
  if (money < 40) return 'decent';
  if (money < 60) return 'comfortable';
  return 'rich';
}

/**
 * 生成AI吐槽回应
 */
export function generateInputResponse(
  input: string,
  path: LifePathType,
  money: number
): string {
  const moneyStatus = getMoneyStatus(money);
  
  const responses: Record<MoneyStatus, Partial<Record<LifePathType, string[]>>> = {
    broke: {
      study: ['穷还能坚持读书，你比大多数人有毅力。', '知识能脱贫吗？试试就知道了。'],
      civil: ['考公是穷人翻身的捷径，你选对了。'],
      work: ['穷就要多打工，这是现实。'],
      business: ['穷还创业？你这是赌博。'],
      lie_flat: ['穷还躺平？你是真敢啊。'],
      love: ['穷还能追求爱情，你是真的勇敢。'],
      career: ['穷还拼事业？你是真不怕死。']
    },
    struggling: {
      study: ['勉强生活还要读书，压力不小啊。'],
      civil: ['考公是摆脱"勉强生活"的好路子。'],
      work: ['打工维持生计，这就是生活。'],
      business: ['勉强生活还要创业？你是真敢赌。'],
      lie_flat: ['勉强生活还躺平？你要喝西北风了。'],
      love: ['勉强生活还想谈爱情？先想想房租吧。'],
      career: ['为了摆脱勉强生活，拼一把也值得。']
    },
    decent: {
      study: ['生活还算体面，有底气深造了。'],
      work: ['体面地打工，也是一种境界。'],
      business: ['有本钱创业了，祝你成功。'],
      lie_flat: ['生活体面了，确实可以慢下来。'],
      love: ['经济基础有了，可以追求爱情了。'],
      career: ['事业更上一层楼，加油。']
    },
    comfortable: {
      study: ['小康生活还读书？你是真热爱学习。'],
      work: ['小康了还打工？你是真喜欢被虐。'],
      business: ['小康是创业的好起点。'],
      lie_flat: ['小康了躺平，这才是生活。'],
      love: ['小康了，爱情可以纯粹一点了。'],
      career: ['小康了还要拼？你是个事业狂。']
    },
    rich: {
      study: ['财务自由还读书？你是真学者。'],
      work: ['有钱了还打工？你是真热爱工作。'],
      business: ['有钱人的游戏，祝你玩得开心。'],
      lie_flat: ['财务自由，躺平是天经地义的。'],
      love: ['财务自由了，爱情可以纯粹了。'],
      career: ['有钱了还拼？你是真停不下来。']
    }
  };
  
  const statusResponses = responses[moneyStatus];
  const pathResponses = statusResponses[path] || ['这是个有趣的选择。'];
  return pathResponses[Math.floor(Math.random() * pathResponses.length)];
}

/**
 * 获取场景
 */
export function getSceneById(sceneId: string): InputScene | undefined {
  return INPUT_SCENES.find(s => s.id === sceneId);
}

/**
 * 获取指定年龄的场景
 */
export function getSceneForAge(age: number): InputScene | undefined {
  return INPUT_SCENES.find(s => s.ageRange[0] <= age && s.ageRange[1] >= age);
}
