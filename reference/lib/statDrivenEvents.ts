/**
 * 属性驱动事件系统 - 你的属性决定你的人生
 * 
 * 设计原则：
 * - 每个属性都有高/低两种状态触发不同事件
 * - 事件会连锁反应（生病→看病→负债）
 * - 复合属性条件（又穷又丑→特殊事件）
 */

import { PlayerState, PlayerStats, LifeStateType } from './types';

export interface StatDrivenEvent {
  id: string;
  title: string;
  description: string;
  // 触发条件
  conditions: {
    // 属性范围要求
    minStats?: Partial<PlayerStats>;
    maxStats?: Partial<PlayerStats>;
    // 多个属性同时满足（AND关系）
    combinedStats?: Array<{
      stat: keyof PlayerStats;
      min?: number;
      max?: number;
    }>;
    // 年龄范围
    minAge?: number;
    maxAge?: number;
    // 人生状态
    lifeStates?: LifeStateType[];
    // 前置事件（必须触发过）
    requiredEvents?: string[];
    // 前置事件（必须未触发）
    notEvents?: string[];
  };
  // 触发概率（基础概率，会根据属性严重程度调整）
  baseProbability: number;
  // 属性影响
  effects: Partial<PlayerStats>;
  // 年度标签（显示在年度记录中）
  yearTag?: string;
  yearTagColor?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
  // 是否改变人生状态
  stateChange?: {
    newState: LifeStateType;
    probability: number;
  };
  // 后续事件ID（形成事件链）
  followUpEvents?: string[];
  // 是否可重复触发
  repeatable?: boolean;
  // 冷却年限（触发后多少年内不再触发）
  cooldown?: number;
}

// ========== 健康相关事件 ==========
const healthEvents: StatDrivenEvent[] = [
  // 健康值低 - 亚健康状态
  {
    id: 'health_subhealthy',
    title: '亚健康警告',
    description: '你总觉得疲惫，睡不醒，去医院检查各项指标都正常，医生说这是亚健康。你开始怀疑亚健康是不是现代版的中邪。',
    conditions: {
      minStats: { health: 30 },
      maxStats: { health: 50 },
      minAge: 18,
    },
    baseProbability: 0.2,
    effects: { happiness: -3 },
    yearTag: '亚健康',
    yearTagColor: 'yellow',
    cooldown: 2,
  },
  // 健康值很低 - 生病
  {
    id: 'health_sick',
    title: '积劳成疾',
    description: '你终于倒下了。医生说你的身体在抗议，给你开了长长的病假条。你躺在床上，第一次觉得健康比什么都重要。',
    conditions: {
      maxStats: { health: 30 },
      minAge: 18,
    },
    baseProbability: 0.3,
    effects: { money: -10, happiness: -5, health: -5 },
    yearTag: '生病',
    yearTagColor: 'orange',
    followUpEvents: ['health_medical_debt', 'health_recovery'],
    cooldown: 3,
  },
  // 健康值极低 - 重病
  {
    id: 'health_serious_illness',
    title: '重病住院',
    description: '你被推进了手术室。麻醉前你想，要是能重来，一定不熬夜了。可惜人生没有存档点。',
    conditions: {
      maxStats: { health: 15 },
      minAge: 18,
    },
    baseProbability: 0.4,
    effects: { money: -30, happiness: -15, health: -10 },
    yearTag: '重病',
    yearTagColor: 'red',
    stateChange: { newState: 'normal', probability: 0.5 },
    cooldown: 5,
  },
  // 医疗负债（生病后的连锁事件）
  {
    id: 'health_medical_debt',
    title: '医疗账单',
    description: '出院结算单上的数字让你眼前一黑。你突然理解了什么叫"病不起"。为了治病，你借遍了所有能借的人。',
    conditions: {
      maxStats: { money: 30, health: 40 },
      requiredEvents: ['health_sick', 'health_serious_illness'],
      minAge: 18,
    },
    baseProbability: 0.5,
    effects: { money: -20, happiness: -10 },
    yearTag: '医疗负债',
    yearTagColor: 'red',
    cooldown: 2,
  },
  // 康复（生病后的好结局）
  {
    id: 'health_recovery',
    title: '大病初愈',
    description: '你终于康复了。这场病让你明白，什么KPI、什么加班费，在健康面前都不值一提。你开始养生了——虽然不知道能坚持多久。',
    conditions: {
      minStats: { health: 40 },
      requiredEvents: ['health_sick'],
      minAge: 18,
    },
    baseProbability: 0.3,
    effects: { happiness: 5, health: 10 },
    yearTag: '康复',
    yearTagColor: 'green',
  },
  // 健康值高 - 精力充沛
  {
    id: 'health_energetic',
    title: '精力充沛',
    description: '你感觉浑身有使不完的劲。加班到凌晨还能早起健身，同事都怀疑你是不是偷偷打了鸡血。',
    conditions: {
      minStats: { health: 80 },
      minAge: 18,
    },
    baseProbability: 0.15,
    effects: { happiness: 3, intelligence: 2 },
    yearTag: '活力满满',
    yearTagColor: 'green',
    cooldown: 2,
  },
];

// ========== 快乐/心理健康事件 ==========
const happinessEvents: StatDrivenEvent[] = [
  // 快乐值低 - 情绪低落
  {
    id: 'mood_low',
    title: '情绪低落',
    description: '你最近总是开心不起来，对什么都提不起兴趣。朋友约你出去玩，你说"算了，没意思"。',
    conditions: {
      minStats: { happiness: 30 },
      maxStats: { happiness: 50 },
      minAge: 16,
    },
    baseProbability: 0.2,
    effects: { health: -2 },
    yearTag: '心情不佳',
    yearTagColor: 'gray',
    cooldown: 1,
  },
  // 快乐值很低 - 抑郁倾向
  {
    id: 'depression_early',
    title: '抑郁倾向',
    description: '你开始失眠，开始无故哭泣，开始觉得活着没意思。你上网查了抑郁症的症状，发现几乎全中，但你不敢去医院确诊。',
    conditions: {
      maxStats: { happiness: 30 },
      minAge: 16,
    },
    baseProbability: 0.25,
    effects: { health: -5, intelligence: -3 },
    yearTag: '抑郁',
    yearTagColor: 'orange',
    followUpEvents: ['depression_treatment', 'depression_worsen'],
    cooldown: 2,
  },
  // 抑郁治疗（好结局）
  {
    id: 'depression_treatment',
    title: '寻求治疗',
    description: '你终于鼓起勇气去了医院。医生说你这是中度抑郁，给你开了药，建议你休学/休假。你开始慢慢好起来，虽然过程很艰难。',
    conditions: {
      maxStats: { happiness: 30 },
      minStats: { money: 20 },
      requiredEvents: ['depression_early'],
      minAge: 16,
    },
    baseProbability: 0.4,
    effects: { money: -15, happiness: 15, health: 5 },
    yearTag: '治疗中',
    yearTagColor: 'blue',
  },
  // 抑郁恶化（坏结局）
  {
    id: 'depression_worsen',
    title: '病情恶化',
    description: '你没有及时治疗，抑郁越来越严重。你开始逃避社交，逃避工作，把自己关在房间里。世界对你来说是灰色的。',
    conditions: {
      maxStats: { happiness: 15 },
      requiredEvents: ['depression_early'],
      minAge: 16,
    },
    baseProbability: 0.3,
    effects: { health: -10, intelligence: -5, money: -10 },
    yearTag: '重度抑郁',
    yearTagColor: 'red',
    stateChange: { newState: 'normal', probability: 0.3 },
  },
  // 快乐值高 - 幸福感爆棚
  {
    id: 'happiness_peak',
    title: '幸福时刻',
    description: '你觉得自己是世界上最幸福的人。工作顺利，家庭和睦，身体健康。你甚至觉得这种幸福有点不真实，担心会不会乐极生悲。',
    conditions: {
      minStats: { happiness: 85 },
      minAge: 18,
    },
    baseProbability: 0.1,
    effects: { health: 5 },
    yearTag: '幸福满满',
    yearTagColor: 'green',
    cooldown: 2,
  },
  // 穷+不快乐 - 绝望组合
  {
    id: 'despair_poor_sad',
    title: '人生低谷',
    description: '你又穷又不快乐，感觉自己像个失败者。每天醒来第一件事就是发愁，晚上最后一件事是哭泣。你开始怀疑人生意义。',
    conditions: {
      combinedStats: [
        { stat: 'money', max: 20 },
        { stat: 'happiness', max: 30 },
      ],
      minAge: 18,
    },
    baseProbability: 0.35,
    effects: { health: -8, intelligence: -5 },
    yearTag: '人生低谷',
    yearTagColor: 'red',
    cooldown: 2,
  },
];

// ========== 金钱相关事件 ==========
const moneyEvents: StatDrivenEvent[] = [
  // 金钱极低 - 贫困潦倒
  {
    id: 'money_broke',
    title: '身无分文',
    description: '你的银行卡余额是个位数。你开始在拼多多上买最便宜的泡面，开始计算每顿饭不能超过多少钱。你明白了什么叫"贫穷限制想象"。',
    conditions: {
      maxStats: { money: 10 },
      minAge: 18,
    },
    baseProbability: 0.3,
    effects: { happiness: -10, health: -5 },
    yearTag: '贫困潦倒',
    yearTagColor: 'red',
    stateChange: { newState: 'beggar', probability: 0.2 },
    followUpEvents: ['money_borrow', 'money_side_hustle'],
    cooldown: 2,
  },
  // 金钱少 - 搬砖打工
  {
    id: 'money_poor_worker',
    title: '搬砖日常',
    description: '为了维持生计，你开始打多份工。白天上班，晚上送外卖，周末做代驾。你觉得自己是台赚钱机器，唯一的功能就是运转。',
    conditions: {
      minStats: { money: 10 },
      maxStats: { money: 30 },
      minAge: 18,
    },
    baseProbability: 0.25,
    effects: { money: 15, health: -10, happiness: -8 },
    yearTag: '拼命搬砖',
    yearTagColor: 'orange',
    stateChange: { newState: 'worker', probability: 0.3 },
    cooldown: 2,
  },
  // 借钱度日
  {
    id: 'money_borrow',
    title: '借钱度日',
    description: '你厚着脸皮向朋友借钱，承诺下个月一定还。但你心里清楚，下个月可能还要再借。你开始理解为什么古人说要"君子之交淡如水"。',
    conditions: {
      maxStats: { money: 15 },
      requiredEvents: ['money_broke'],
      minAge: 18,
    },
    baseProbability: 0.5,
    effects: { money: 10, happiness: -5, network: -10 },
    yearTag: '负债累累',
    yearTagColor: 'red',
  },
  // 副业求生
  {
    id: 'money_side_hustle',
    title: '副业求生',
    description: '你开始疯狂研究各种副业：摆摊、代购、写网文、剪视频。虽然大部分都没赚到钱，但至少你觉得自己在努力改变命运。',
    conditions: {
      maxStats: { money: 30 },
      minAge: 18,
    },
    baseProbability: 0.3,
    effects: { money: 8, happiness: -3, health: -3 },
    yearTag: '副业探索',
    yearTagColor: 'yellow',
  },
  // 金钱多 - 财务自由
  {
    id: 'money_rich',
    title: '财务自由',
    description: '你的存款数字让你很有安全感。你可以对不喜欢的工作说不，可以去想去的餐厅吃饭，可以不用担心下个月的房租。这就是自由的感觉。',
    conditions: {
      minStats: { money: 80 },
      minAge: 25,
    },
    baseProbability: 0.15,
    effects: { happiness: 10 },
    yearTag: '财务自由',
    yearTagColor: 'green',
    cooldown: 3,
  },
  // 金钱多+颜值高 - 被借钱
  {
    id: 'money_rich_borrowed',
    title: '人情债',
    description: '远房亲戚/多年不联系的同学突然找你，说孩子上学/家里急病，要借一大笔钱。你陷入两难：借了怕不还，不借怕伤感情。',
    conditions: {
      combinedStats: [
        { stat: 'money', min: 70 },
        { stat: 'appearance', min: 60 },
      ],
      minAge: 25,
    },
    baseProbability: 0.2,
    effects: { money: -15, happiness: -5, network: 5 },
    yearTag: '被借钱',
    yearTagColor: 'yellow',
  },
];

// ========== 颜值相关事件 ==========
const appearanceEvents: StatDrivenEvent[] = [
  // 颜值高 - 被星探发现（可选择）
  {
    id: 'appearance_debut_choice',
    title: '星探发掘',
    description: '你在商场被星探拦住，说你有当偶像的潜质。名片上印着某娱乐公司的logo。你心动了，但也知道这行水很深。',
    conditions: {
      minStats: { appearance: 80 },
      minAge: 16,
      maxAge: 25,
    },
    baseProbability: 0.2,
    effects: {}, // 选择后再应用效果
    yearTag: '出道抉择',
    yearTagColor: 'purple',
    cooldown: 5,
  },
  // 颜值高 - 职场便利
  {
    id: 'appearance_work_advantage',
    title: '颜值红利',
    description: '你发现长得好看真的有特权。客户对你更友善，领导对你更宽容，连食堂阿姨给你打的菜都更多。你开始理解"颜值即正义"。',
    conditions: {
      minStats: { appearance: 75 },
      minAge: 20,
      maxAge: 35,
    },
    baseProbability: 0.2,
    effects: { happiness: 5, network: 10 },
    yearTag: '颜值红利',
    yearTagColor: 'green',
    cooldown: 2,
  },
  // 颜值低 - 颜值焦虑
  {
    id: 'appearance_anxiety',
    title: '颜值焦虑',
    description: '你看着镜子里的自己，开始嫌弃。为什么眼睛不够大？为什么鼻子不够挺？你下载了美颜相机，发现活在滤镜里也挺好的。',
    conditions: {
      maxStats: { appearance: 40 },
      minAge: 15,
    },
    baseProbability: 0.2,
    effects: { happiness: -5 },
    yearTag: '颜值焦虑',
    yearTagColor: 'gray',
    cooldown: 2,
  },
  // 颜值低+穷 - 双重困境
  {
    id: 'appearance_poor_struggle',
    title: '双重困境',
    description: '你又不好看又没钱，感觉自己被这个世界双重抛弃。相亲对象见一面就没下文，面试官看你的眼神都不对。你开始相信"投胎是门技术活"。',
    conditions: {
      combinedStats: [
        { stat: 'appearance', max: 35 },
        { stat: 'money', max: 30 },
      ],
      minAge: 20,
    },
    baseProbability: 0.25,
    effects: { happiness: -10 },
    yearTag: 'hard模式',
    yearTagColor: 'red',
  },
  // 选择出道 - 接受星探邀请（自动触发后续）
  {
    id: 'debut_accepted',
    title: '出道之路',
    description: '你决定接受星探的邀请，签了经纪公司。接下来的人生就像开盲盒——可能是星光大道，也可能是骗局深渊。',
    conditions: {
      requiredEvents: ['appearance_debut_choice'],
      minAge: 16,
      maxAge: 25,
    },
    baseProbability: 0.6, // 60%概率选择出道
    effects: { happiness: 5, money: -5 },
    yearTag: '出道之路',
    yearTagColor: 'purple',
    followUpEvents: ['debut_training_success', 'debut_scam_fail'],
    cooldown: 2,
  },
  // 出道成功 - 成为练习生
  {
    id: 'debut_training_success',
    title: '练习生生涯',
    description: '你开始了练习生生涯。每天练舞八小时，节食减肥，还要上表情管理课。虽然辛苦，但你离梦想更近了。',
    conditions: {
      requiredEvents: ['debut_accepted'],
      minAge: 16,
      maxAge: 25,
    },
    baseProbability: 0.5, // 50%概率成功成为练习生
    effects: { appearance: 5, money: -10, health: -10, happiness: 10 },
    yearTag: '练习生',
    yearTagColor: 'purple',
  },
  // 出道失败 - 被骗
  {
    id: 'debut_scam_fail',
    title: '出道骗局',
    description: '那家公司让你交培训费、包装费、推广费。你交完钱，对方就消失了。你终于明白，你不是被星探发现了，是被骗子发现了。',
    conditions: {
      requiredEvents: ['debut_accepted'],
      minAge: 16,
      maxAge: 25,
    },
    baseProbability: 0.35, // 35%概率被骗
    effects: { money: -30, happiness: -15 },
    yearTag: '被骗',
    yearTagColor: 'red',
  },
  // 拒绝出道 - 错过机会
  {
    id: 'debut_rejected',
    title: '错过出道',
    description: '你婉拒了星探的邀请。虽然不知道这条路通向何方，但你选择了更稳妥的人生。多年后回想起来，你会后悔吗？',
    conditions: {
      requiredEvents: ['appearance_debut_choice'],
      minAge: 16,
      maxAge: 25,
    },
    baseProbability: 0.3, // 30%概率选择不出道
    effects: { happiness: -2 },
    yearTag: '婉拒星探',
    yearTagColor: 'gray',
  },
];

// ========== 智力相关事件 ==========
const intelligenceEvents: StatDrivenEvent[] = [
  // 智力高 - 天才少年
  {
    id: 'intelligence_genius',
    title: '天才觉醒',
    description: '你突然领悟了某个困扰学界多年的难题。虽然没人相信是你独立解决的，但你内心知道自己是个天才。你开始看周围人觉得他们都在"低速运转"。',
    conditions: {
      minStats: { intelligence: 90 },
      minAge: 12,
      maxAge: 25,
    },
    baseProbability: 0.1,
    effects: { happiness: 5, network: -5 },
    yearTag: '天才模式',
    yearTagColor: 'purple',
    cooldown: 3,
  },
  // 智力高 - 学术之路
  {
    id: 'intelligence_academia',
    title: '学术邀请',
    description: '你的研究成果引起了学界关注，有教授邀请你加入课题组。你面临着选择：继续走学术这条路，还是去大厂拿高薪？',
    conditions: {
      minStats: { intelligence: 85, money: 40 },
      minAge: 22,
    },
    baseProbability: 0.15,
    effects: { happiness: 5, money: -5 },
    yearTag: '学术之路',
    yearTagColor: 'blue',
  },
  // 智力低 - 学习困难
  {
    id: 'intelligence_struggle',
    title: '学习障碍',
    description: '你就是学不会。别人听一遍就懂的东西，你要听十遍。你开始怀疑自己是不是脑子有问题，虽然去医院检查一切正常。',
    conditions: {
      maxStats: { intelligence: 40 },
      minAge: 6,
      maxAge: 22,
    },
    baseProbability: 0.2,
    effects: { happiness: -5 },
    yearTag: '学习困难',
    yearTagColor: 'gray',
    cooldown: 2,
  },
  // 智力低+颜值低 - 双重debuff
  {
    id: 'intelligence_appearance_struggle',
    title: 'hard模式开局',
    description: '你既不好看也不聪明，感觉自己被上帝关上了所有的门，连窗户都没留。但你还活着，这就是最大的胜利。',
    conditions: {
      combinedStats: [
        { stat: 'intelligence', max: 40 },
        { stat: 'appearance', max: 40 },
      ],
      minAge: 12,
    },
    baseProbability: 0.15,
    effects: { happiness: -8 },
    yearTag: '地狱难度',
    yearTagColor: 'red',
  },
];

// ========== 复合属性特殊事件 ==========
const compoundEvents: StatDrivenEvent[] = [
  // 高智商+低颜值 - 死宅科学家
  {
    id: 'compound_nerd',
    title: '技术宅的日常',
    description: '你智商很高但长得普通，社交技能更是为零。你沉迷于代码/实验/模型，对外界的评价充耳不闻。你找到了属于自己的世界。',
    conditions: {
      combinedStats: [
        { stat: 'intelligence', min: 80 },
        { stat: 'appearance', max: 50 },
      ],
      minAge: 18,
    },
    baseProbability: 0.2,
    effects: { happiness: 3, network: -5 },
    yearTag: '技术宅',
    yearTagColor: 'blue',
  },
  // 高颜值+高情商（network）- 社交女王/男神
  {
    id: 'compound_social_butterfly',
    title: '社交中心',
    description: '你长得好看又会来事，走到哪里都是焦点。派对缺了你就没意思，聚会你是永远的C位。你掌握了这个世界运行的潜规则。',
    conditions: {
      combinedStats: [
        { stat: 'appearance', min: 75 },
      ],
      minAge: 18,
    },
    baseProbability: 0.15,
    effects: { happiness: 8, network: 15 },
    yearTag: '社交达人',
    yearTagColor: 'green',
  },
  // 穷+健康差+不快乐 - 绝境
  {
    id: 'compound_despair',
    title: '绝境求生',
    description: '你又穷又病又不快乐，感觉自己被整个世界抛弃。每一天醒来都是煎熬，但你还在坚持。也许明天会好一点？',
    conditions: {
      combinedStats: [
        { stat: 'money', max: 20 },
        { stat: 'health', max: 30 },
        { stat: 'happiness', max: 30 },
      ],
      minAge: 18,
    },
    baseProbability: 0.4,
    effects: { health: -5 },
    yearTag: '绝境',
    yearTagColor: 'red',
  },
  // 全属性高 - 人生赢家
  {
    id: 'compound_winner',
    title: '人生赢家',
    description: '你有钱有颜有智商，身体倍儿棒心情倍儿好。你就是那种"别人家的孩子"，是社交媒体的完美主角。但偶尔你也会感到空虚，觉得一切都来得太容易。',
    conditions: {
      combinedStats: [
        { stat: 'money', min: 75 },
        { stat: 'appearance', min: 75 },
        { stat: 'intelligence', min: 75 },
        { stat: 'health', min: 75 },
        { stat: 'happiness', min: 75 },
      ],
      minAge: 25,
    },
    baseProbability: 0.1,
    effects: { happiness: 5 },
    yearTag: '人生赢家',
    yearTagColor: 'green',
  },
];

// 合并所有属性驱动事件
export const STAT_DRIVEN_EVENTS: StatDrivenEvent[] = [
  ...healthEvents,
  ...happinessEvents,
  ...moneyEvents,
  ...appearanceEvents,
  ...intelligenceEvents,
  ...compoundEvents,
];

// 根据玩家状态获取可触发的事件
export function getStatDrivenEvents(player: PlayerState): StatDrivenEvent[] {
  return STAT_DRIVEN_EVENTS.filter(event => {
    const cond = event.conditions;
    
    // 年龄检查
    if (cond.minAge !== undefined && player.age < cond.minAge) return false;
    if (cond.maxAge !== undefined && player.age > cond.maxAge) return false;
    
    // 人生状态检查
    if (cond.lifeStates && !cond.lifeStates.includes(player.lifeState)) return false;
    
    // 最小属性检查
    if (cond.minStats) {
      for (const [stat, min] of Object.entries(cond.minStats)) {
        const value = player.stats[stat as keyof PlayerStats];
        if (value === undefined || value < min!) return false;
      }
    }
    
    // 最大属性检查
    if (cond.maxStats) {
      for (const [stat, max] of Object.entries(cond.maxStats)) {
        const value = player.stats[stat as keyof PlayerStats];
        if (value === undefined || value > max!) return false;
      }
    }
    
    // 复合属性检查（多个属性同时满足）
    if (cond.combinedStats) {
      for (const req of cond.combinedStats) {
        const value = player.stats[req.stat];
        if (req.min !== undefined && (value === undefined || value < req.min)) return false;
        if (req.max !== undefined && (value === undefined || value > req.max)) return false;
      }
    }
    
    return true;
  });
}

// 计算事件的实际触发概率（根据属性严重程度调整）
export function calculateEventProbability(
  event: StatDrivenEvent, 
  player: PlayerState
): number {
  let probability = event.baseProbability;
  
  // 健康越低，健康相关事件概率越高
  if (event.id.startsWith('health_')) {
    if (player.stats.health < 20) probability *= 2;
    else if (player.stats.health < 40) probability *= 1.5;
    else if (player.stats.health > 70) probability *= 0.3;
  }
  
  // 快乐越低，心理相关事件概率越高
  if (event.id.startsWith('mood_') || event.id.startsWith('depression_')) {
    if (player.stats.happiness < 20) probability *= 2;
    else if (player.stats.happiness < 40) probability *= 1.5;
    else if (player.stats.happiness > 70) probability = 0;
  }
  
  // 金钱越少，贫困相关事件概率越高
  if (event.id.startsWith('money_') && event.id !== 'money_rich') {
    if (player.stats.money < 10) probability *= 1.8;
    else if (player.stats.money < 30) probability *= 1.3;
  }
  
  // 复合事件的特殊调整
  if (event.id.startsWith('compound_')) {
    // 绝境事件在绝境时更容易触发
    if (event.id === 'compound_despair') {
      const badStats = ['money', 'health', 'happiness'].filter(
        s => (player.stats[s as keyof PlayerStats] || 0) < 30
      ).length;
      probability *= (1 + badStats * 0.3);
    }
  }
  
  return Math.min(0.8, Math.max(0, probability));
}
