import { LifeEvent, FamilyType, PlayerStats, LifeStage } from '@/lib/types';
import { HUMOR_EVENTS } from './humorEvents';

// 婴儿期事件 (0-3岁)
const infantEvents: LifeEvent[] = [
  {
    id: 'infant_1',
    title: '呱呱坠地',
    description: '你出生了，哭声洪亮，护士夸你有出息。',
    minAge: 0,
    maxAge: 0,
    effects: { health: 5, happiness: 5 },
    rarity: 'common',
  },
  {
    id: 'infant_2',
    title: '第一次翻身',
    description: '你在婴儿床上成功翻身，妈妈激动得发了朋友圈。',
    minAge: 0,
    maxAge: 1,
    effects: { health: 3 },
    rarity: 'common',
  },
  {
    id: 'infant_3',
    title: '喝奶粉拉肚子',
    description: '奶粉不适应，拉了三天肚子，爸妈急得团团转。',
    minAge: 0,
    maxAge: 2,
    effects: { health: -5, happiness: -3 },
    rarity: 'common',
  },
  {
    id: 'infant_4',
    title: '贵价奶粉',
    description: '家里咬牙买了进口奶粉，你喝得不亦乐乎。',
    minAge: 0,
    maxAge: 2,
    effects: { health: 5, happiness: 3 },
    familyBonus: { RICH: 20, BUSINESS: 10 },
    rarity: 'rare',
  },
  {
    id: 'infant_5',
    title: '早教启蒙',
    description: '家里给你报了早教班，虽然你只会流口水。',
    minAge: 1,
    maxAge: 3,
    effects: { intelligence: 3, happiness: -2 },
    familyBonus: { EDUCATED: 30, RICH: 20, SYSTEM: 15 },
    rarity: 'common',
  },
  {
    id: 'infant_6',
    title: '发高烧',
    description: '半夜发高烧，爸妈抱着你冲去医院。',
    minAge: 0,
    maxAge: 3,
    effects: { health: -8, happiness: -5 },
    familyBonus: { POOR: 10 },
    rarity: 'common',
  },
];

// 童年事件 (4-12岁)
const childEvents: LifeEvent[] = [
  {
    id: 'child_1',
    title: '幼儿园第一天',
    description: '你哭着不肯进教室，老师在门口哄了你半小时。',
    minAge: 3,
    maxAge: 4,
    effects: { happiness: -3, network: 2 },
    rarity: 'common',
  },
  {
    id: 'child_2',
    title: '学会骑单车',
    description: '爸爸扶着后座跑了三圈，你终于学会了。',
    minAge: 5,
    maxAge: 8,
    effects: { happiness: 5, health: 2 },
    rarity: 'common',
  },
  {
    id: 'child_3',
    title: '考试满分',
    description: '数学考了100分，爸妈奖励你去吃了肯德基。',
    minAge: 6,
    maxAge: 12,
    effects: { intelligence: 3, happiness: 5 },
    requiredStats: { intelligence: { min: 50 } },
    familyBonus: { EDUCATED: 20 },
    rarity: 'common',
  },
  {
    id: 'child_4',
    title: '被同学欺负',
    description: '高年级学长抢了你的零花钱，你哭着回家。',
    minAge: 6,
    maxAge: 12,
    effects: { happiness: -8, health: -2 },
    rarity: 'common',
  },
  {
    id: 'child_5',
    title: '课外补习班',
    description: '周末被各种补习班填满，你觉得自己是台学习机器。',
    minAge: 7,
    maxAge: 12,
    effects: { intelligence: 5, happiness: -5 },
    familyBonus: { EDUCATED: 30, RICH: 20, SYSTEM: 15 },
    rarity: 'common',
  },
  {
    id: 'child_6',
    title: '参加奥数竞赛',
    description: '你在奥数班脱颖而出，被老师推荐参加比赛。',
    minAge: 8,
    maxAge: 12,
    effects: { intelligence: 8, network: 3 },
    requiredStats: { intelligence: { min: 60 } },
    familyBonus: { EDUCATED: 25, RICH: 15 },
    rarity: 'rare',
  },
  {
    id: 'child_7',
    title: '暑假出国游',
    description: '爸妈带你去了迪士尼，你见了世面。',
    minAge: 6,
    maxAge: 12,
    effects: { happiness: 10, intelligence: 3 },
    familyBonus: { RICH: 30, BUSINESS: 15 },
    requiredStats: { money: { min: 60 } },
    rarity: 'rare',
  },
  {
    id: 'child_8',
    title: '帮家里看店',
    description: '放学后就在家里小店帮忙，没时间写作业。',
    minAge: 8,
    maxAge: 12,
    effects: { money: 2, intelligence: -3, happiness: -5 },
    familyBonus: { POOR: 20, BUSINESS: 10 },
    rarity: 'common',
  },
  {
    id: 'child_9',
    title: '被夸有天赋',
    description: '音乐老师说你钢琴弹得好，建议走专业路线。',
    minAge: 6,
    maxAge: 12,
    effects: { happiness: 5, network: 2 },
    familyBonus: { RICH: 15 },
    rarity: 'rare',
  },
  {
    id: 'child_10',
    title: '生病缺课',
    description: '流感高发季，你请了一周假，功课落下不少。',
    minAge: 6,
    maxAge: 12,
    effects: { health: -5, intelligence: -2 },
    familyBonus: { POOR: 15 },
    rarity: 'common',
  },
  {
    id: 'child_11',
    title: '三好学生',
    description: '你被评为三好学生，上台领奖时腿都在抖。',
    minAge: 7,
    maxAge: 12,
    effects: { intelligence: 3, happiness: 8, network: 3 },
    requiredStats: { intelligence: { min: 55 } },
    rarity: 'rare',
  },
  {
    id: 'child_12',
    title: '沉迷游戏',
    description: '偷偷去网吧打游戏，被爸妈抓现行。',
    minAge: 10,
    maxAge: 12,
    effects: { intelligence: -3, health: -2, happiness: 3 },
    rarity: 'common',
  },
];

// 青春期事件 (13-18岁)
const teenEvents: LifeEvent[] = [
  {
    id: 'teen_1',
    title: '中考压力',
    description: '每天刷题到半夜，你开始怀疑人生。',
    minAge: 14,
    maxAge: 15,
    effects: { intelligence: 5, happiness: -5, health: -3 },
    rarity: 'common',
  },
  {
    id: 'teen_2',
    title: '暗恋对象',
    description: '你暗恋隔壁班的同学，但只敢远远看着。',
    minAge: 13,
    maxAge: 17,
    effects: { happiness: 3, health: 2 },
    rarity: 'common',
  },
  {
    id: 'teen_3',
    title: '重点高中',
    description: '你考上了重点高中，全家举杯庆祝。',
    minAge: 15,
    maxAge: 16,
    effects: { intelligence: 5, happiness: 8, network: 5 },
    requiredStats: { intelligence: { min: 60 } },
    familyBonus: { EDUCATED: 20, SYSTEM: 10 },
    rarity: 'rare',
  },
  {
    id: 'teen_4',
    title: '高考失利',
    description: '高考分数不理想，你把自己关在房间三天。',
    minAge: 17,
    maxAge: 18,
    effects: { intelligence: -2, happiness: -10, health: -5 },
    requiredStats: { intelligence: { max: 55 } },
    rarity: 'common',
  },
  {
    id: 'teen_5',
    title: '考入名校',
    description: '你考上了985大学，成了全村的骄傲。',
    minAge: 17,
    maxAge: 18,
    effects: { intelligence: 8, happiness: 10, network: 10 },
    requiredStats: { intelligence: { min: 70 } },
    familyBonus: { EDUCATED: 25, RICH: 15, SYSTEM: 10 },
    rarity: 'epic',
  },
  {
    id: 'teen_6',
    title: '艺考之路',
    description: '你选择了艺考，每天画画到深夜。',
    minAge: 15,
    maxAge: 18,
    effects: { intelligence: 2, happiness: 2, money: -10 },
    familyBonus: { RICH: 20 },
    rarity: 'rare',
  },
  {
    id: 'teen_7',
    title: '出国留学',
    description: '家里决定送你出国读高中，你既兴奋又忐忑。',
    minAge: 15,
    maxAge: 17,
    effects: { intelligence: 5, happiness: 5, network: 8, money: -20 },
    familyBonus: { RICH: 30, BUSINESS: 10 },
    requiredStats: { money: { min: 80 } },
    rarity: 'epic',
  },
  {
    id: 'teen_8',
    title: '早恋被抓',
    description: '班主任通知了家长，你回家挨了一顿骂。',
    minAge: 15,
    maxAge: 18,
    effects: { happiness: -5, network: -2 },
    rarity: 'common',
  },
  {
    id: 'teen_9',
    title: '辍学打工',
    description: '家里供不起学费，你决定辍学去打工。',
    minAge: 16,
    maxAge: 18,
    effects: { money: 10, intelligence: -10, happiness: -8 },
    familyBonus: { POOR: 30 },
    rarity: 'common',
  },
  {
    id: 'teen_10',
    title: '编程天才',
    description: '你在编程比赛中获奖，被大厂提前关注。',
    minAge: 15,
    maxAge: 18,
    effects: { intelligence: 10, network: 5, happiness: 8 },
    requiredStats: { intelligence: { min: 75 } },
    familyBonus: { EDUCATED: 20, RICH: 15 },
    rarity: 'legendary',
  },
  {
    id: 'teen_11',
    title: '网红之路',
    description: '你的短视频意外爆红，开始接广告。',
    minAge: 15,
    maxAge: 18,
    effects: { money: 15, happiness: 5, network: 8 },
    rarity: 'rare',
  },
  {
    id: 'teen_12',
    title: '准备考公',
    description: '家里已经开始给你灌输考公思想，你开始关注时事政治。',
    minAge: 16,
    maxAge: 18,
    effects: { intelligence: 3, network: 3 },
    familyBonus: { SYSTEM: 40 },
    rarity: 'common',
  },
];

// 青年期事件 (19-30岁)
const youngAdultEvents: LifeEvent[] = [
  {
    id: 'young_1',
    title: '大学毕业',
    description: '你拿到了毕业证，正式成为社会人。',
    minAge: 21,
    maxAge: 24,
    effects: { intelligence: 3, network: 5 },
    rarity: 'common',
  },
  {
    id: 'young_2',
    title: '第一份工作',
    description: '你入职了一家普通公司，月薪四千五。',
    minAge: 20,
    maxAge: 25,
    effects: { money: 10, happiness: -2, network: 3 },
    rarity: 'common',
  },
  {
    id: 'young_3',
    title: '被裁员',
    description: '公司裁员，你成了被优化的对象。',
    minAge: 22,
    maxAge: 30,
    effects: { money: -10, happiness: -8, network: -3 },
    rarity: 'common',
  },
  {
    id: 'young_4',
    title: '考上公务员',
    description: '你成功上岸，成为了一名基层公务员。',
    minAge: 22,
    maxAge: 30,
    effects: { money: 15, happiness: 5, network: 10, health: 3 },
    requiredStats: { intelligence: { min: 55 } },
    familyBonus: { SYSTEM: 30, EDUCATED: 10 },
    rarity: 'rare',
  },
  {
    id: 'young_5',
    title: '创业失败',
    description: '你的第一次创业血本无归，负债累累。',
    minAge: 22,
    maxAge: 30,
    effects: { money: -30, happiness: -10, health: -5 },
    requiredStats: { money: { min: 20 } },
    rarity: 'common',
  },
  {
    id: 'young_6',
    title: '创业成功',
    description: '你的公司拿到了天使投资，估值翻倍。',
    minAge: 22,
    maxAge: 30,
    effects: { money: 50, happiness: 10, network: 15 },
    requiredStats: { intelligence: { min: 60 }, network: { min: 50 } },
    familyBonus: { BUSINESS: 25, RICH: 15 },
    rarity: 'epic',
  },
  {
    id: 'young_7',
    title: '家里介绍对象',
    description: '爸妈安排了相亲，对方条件不错但你没感觉。',
    minAge: 24,
    maxAge: 30,
    effects: { happiness: -3, network: 5 },
    familyBonus: { SYSTEM: 20, RICH: 15 },
    rarity: 'common',
  },
  {
    id: 'young_8',
    title: '自由恋爱',
    description: '你在工作中认识了另一半，开始甜蜜恋爱。',
    minAge: 20,
    maxAge: 30,
    effects: { happiness: 10, health: 3 },
    rarity: 'common',
  },
  {
    id: 'young_9',
    title: '家里支持买房',
    description: '家里给你凑了首付，你终于有了自己的房子。',
    minAge: 25,
    maxAge: 30,
    effects: { money: -20, happiness: 5 },
    familyBonus: { RICH: 30, SYSTEM: 15, BUSINESS: 15 },
    requiredStats: { money: { min: 40 } },
    rarity: 'rare',
  },
  {
    id: 'young_10',
    title: '租房漂泊',
    description: '你在城中村里搬了五次家，房东又涨租了。',
    minAge: 20,
    maxAge: 30,
    effects: { money: -5, happiness: -5, health: -2 },
    familyBonus: { POOR: 20 },
    rarity: 'common',
  },
  {
    id: 'young_11',
    title: '读研读博',
    description: '你选择了继续深造，成为科研狗。',
    minAge: 21,
    maxAge: 28,
    effects: { intelligence: 10, money: -10, happiness: -3 },
    requiredStats: { intelligence: { min: 65 } },
    familyBonus: { EDUCATED: 25, SYSTEM: 15, RICH: 10 },
    rarity: 'rare',
  },
  {
    id: 'young_12',
    title: '大厂Offer',
    description: '你拿到了互联网大厂的offer，年薪几十万。',
    minAge: 22,
    maxAge: 28,
    effects: { money: 30, happiness: 5, network: 5 },
    requiredStats: { intelligence: { min: 70 } },
    rarity: 'rare',
  },
  {
    id: 'young_13',
    title: '996加班',
    description: '每天加班到凌晨，你开始脱发。',
    minAge: 22,
    maxAge: 30,
    effects: { money: 10, health: -10, happiness: -5 },
    rarity: 'common',
  },
  {
    id: 'young_14',
    title: '家里安排工作',
    description: '通过家里的关系，你进了一家不错的单位。',
    minAge: 21,
    maxAge: 28,
    effects: { money: 15, network: 5 },
    familyBonus: { SYSTEM: 35, RICH: 25, BUSINESS: 20 },
    requiredStats: { network: { min: 40 } },
    rarity: 'rare',
  },
  {
    id: 'young_15',
    title: '炒股亏损',
    description: '你跟风炒股，结果被套牢。',
    minAge: 23,
    maxAge: 30,
    effects: { money: -15, happiness: -5 },
    rarity: 'common',
  },
  {
    id: 'young_16',
    title: '中彩票',
    description: '你中了五百万彩票，一夜暴富。',
    minAge: 20,
    maxAge: 30,
    effects: { money: 80, happiness: 15 },
    rarity: 'legendary',
  },
];

// 成年期事件 (31-45岁)
const adultEvents: LifeEvent[] = [
  {
    id: 'adult_1',
    title: '结婚生子',
    description: '你组建了家庭，有了自己的孩子。',
    minAge: 28,
    maxAge: 40,
    effects: { happiness: 10, money: -15 },
    rarity: 'common',
  },
  {
    id: 'adult_2',
    title: '职位晋升',
    description: '你升职为部门经理，工资涨了但压力更大了。',
    minAge: 30,
    maxAge: 45,
    effects: { money: 20, happiness: 5, network: 5 },
    requiredStats: { intelligence: { min: 60 } },
    rarity: 'common',
  },
  {
    id: 'adult_3',
    title: '中年危机',
    description: '你开始怀疑人生的意义，觉得自己一事无成。',
    minAge: 35,
    maxAge: 45,
    effects: { happiness: -10, health: -3 },
    rarity: 'common',
  },
  {
    id: 'adult_4',
    title: '孩子教育压力',
    description: '孩子上了重点学校，学费和各种补习班让你喘不过气。',
    minAge: 32,
    maxAge: 45,
    effects: { money: -20, happiness: -5 },
    familyBonus: { EDUCATED: 15, RICH: 10 },
    rarity: 'common',
  },
  {
    id: 'adult_5',
    title: '父母生病',
    description: '父母身体不好，你需要花时间照顾他们。',
    minAge: 35,
    maxAge: 45,
    effects: { money: -15, happiness: -5, health: -3 },
    rarity: 'common',
  },
  {
    id: 'adult_6',
    title: '买房换车',
    description: '你换了更大的房子和更好的车，生活品质提升。',
    minAge: 32,
    maxAge: 45,
    effects: { money: -30, happiness: 8 },
    requiredStats: { money: { min: 60 } },
    rarity: 'rare',
  },
  {
    id: 'adult_7',
    title: '公司上市',
    description: '你加入的创业公司成功上市，股权变现。',
    minAge: 30,
    maxAge: 45,
    effects: { money: 100, happiness: 15, network: 10 },
    requiredStats: { intelligence: { min: 70 }, network: { min: 50 } },
    rarity: 'legendary',
  },
  {
    id: 'adult_8',
    title: '离婚',
    description: '感情破裂，你们选择了离婚。',
    minAge: 32,
    maxAge: 45,
    effects: { happiness: -15, money: -20, health: -5 },
    rarity: 'common',
  },
  {
    id: 'adult_9',
    title: '考公上岸',
    description: '你辞去了私企工作，成功考上公务员。',
    minAge: 30,
    maxAge: 40,
    effects: { money: 5, happiness: 5, health: 3 },
    familyBonus: { SYSTEM: 25 },
    rarity: 'rare',
  },
  {
    id: 'adult_10',
    title: '中年创业',
    description: '你不甘心打工，决定中年创业。',
    minAge: 35,
    maxAge: 45,
    effects: { money: -20, happiness: 3 },
    familyBonus: { BUSINESS: 20, RICH: 15 },
    rarity: 'rare',
  },
];

// 中年期事件 (46-60岁)
const middleAgeEvents: LifeEvent[] = [
  {
    id: 'middle_1',
    title: '孩子上大学',
    description: '孩子考上了大学，你感到欣慰又有些失落。',
    minAge: 45,
    maxAge: 55,
    effects: { happiness: 5, money: -15 },
    rarity: 'common',
  },
  {
    id: 'middle_2',
    title: '身体报警',
    description: '体检报告多项指标异常，你开始注重养生。',
    minAge: 45,
    maxAge: 60,
    effects: { health: -10, happiness: -3 },
    rarity: 'common',
  },
  {
    id: 'middle_3',
    title: '财务自由',
    description: '你的投资获得了丰厚回报，可以提前退休了。',
    minAge: 50,
    maxAge: 60,
    effects: { money: 50, happiness: 10 },
    requiredStats: { money: { min: 80 } },
    rarity: 'epic',
  },
  {
    id: 'middle_4',
    title: '失业危机',
    description: '公司优化，你这个年龄已经很难找到新工作。',
    minAge: 48,
    maxAge: 60,
    effects: { money: -10, happiness: -10, health: -5 },
    rarity: 'common',
  },
  {
    id: 'middle_5',
    title: '晋升高管',
    description: '你成为了公司高管，功成名就。',
    minAge: 45,
    maxAge: 60,
    effects: { money: 40, happiness: 10, network: 10 },
    requiredStats: { intelligence: { min: 65 }, network: { min: 60 } },
    rarity: 'rare',
  },
  {
    id: 'middle_6',
    title: '父母离世',
    description: '父母相继离世，你感到人生无常。',
    minAge: 50,
    maxAge: 60,
    effects: { happiness: -15, health: -5 },
    rarity: 'common',
  },
  {
    id: 'middle_7',
    title: '环游世界',
    description: '你开始实现年轻时的梦想，环游世界。',
    minAge: 50,
    maxAge: 60,
    effects: { happiness: 10, money: -20 },
    requiredStats: { money: { min: 70 } },
    rarity: 'rare',
  },
  {
    id: 'middle_8',
    title: '带孙子',
    description: '你开始帮忙带孙子，享受天伦之乐。',
    minAge: 50,
    maxAge: 60,
    effects: { happiness: 5, health: -3 },
    rarity: 'common',
  },
];

// 老年期事件 (61岁+)
const elderlyEvents: LifeEvent[] = [
  {
    id: 'elderly_1',
    title: '退休生活',
    description: '你正式退休，开始领养老金。',
    minAge: 60,
    maxAge: 100,
    effects: { money: 5, happiness: 3 },
    rarity: 'common',
  },
  {
    id: 'elderly_2',
    title: '安享晚年',
    description: '身体健康，儿女孝顺，你安享晚年。',
    minAge: 65,
    maxAge: 100,
    effects: { happiness: 10, health: 2 },
    requiredStats: { money: { min: 50 }, health: { min: 50 } },
    rarity: 'common',
  },
  {
    id: 'elderly_3',
    title: '疾病缠身',
    description: '各种老年疾病找上你，生活质量下降。',
    minAge: 65,
    maxAge: 100,
    effects: { health: -15, happiness: -10 },
    rarity: 'common',
  },
  {
    id: 'elderly_4',
    title: '金婚纪念',
    description: '你和爱人走过了50年婚姻，举办了金婚庆典。',
    minAge: 70,
    maxAge: 100,
    effects: { happiness: 15 },
    rarity: 'rare',
  },
  {
    id: 'elderly_5',
    title: '孙辈成才',
    description: '你的孙子考上了名校，你感到骄傲。',
    minAge: 65,
    maxAge: 100,
    effects: { happiness: 10 },
    rarity: 'rare',
  },
  {
    id: 'elderly_6',
    title: '平淡离世',
    description: '你在睡梦中安详离世，结束了这一生。',
    minAge: 70,
    maxAge: 100,
    effects: {},
    rarity: 'common',
  },
  {
    id: 'elderly_7',
    title: '传奇人生',
    description: '你的一生充满传奇色彩，成为家族的美谈。',
    minAge: 80,
    maxAge: 100,
    effects: {},
    requiredStats: { money: { min: 80 }, network: { min: 70 } },
    rarity: 'legendary',
  },
];

// 金钱驱动的特殊事件 - 制造压力和冲突
const moneyDrivenEvents: LifeEvent[] = [
  // 贫穷相关事件
  {
    id: 'money_broke_1',
    title: '被房租压垮',
    description: '房租到期了，你翻遍口袋凑不齐钱。房东已经催了三次。',
    minAge: 20,
    maxAge: 60,
    effects: { happiness: -15, health: -5 },
    requiredStats: { money: { max: 10 } },
    rarity: 'common',
  },
  {
    id: 'money_broke_2',
    title: '开始打两份工',
    description: '为了维持生计，你开始白天上班晚上送外卖。',
    minAge: 20,
    maxAge: 50,
    effects: { money: 15, health: -10, happiness: -8 },
    requiredStats: { money: { max: 15 } },
    rarity: 'common',
  },
  {
    id: 'money_broke_3',
    title: '生病硬扛',
    description: '你生病了，但去医院要花钱。你选择硬扛，结果病情加重。',
    minAge: 20,
    maxAge: 60,
    effects: { health: -15, happiness: -10 },
    requiredStats: { money: { max: 20 } },
    rarity: 'rare',
  },
  {
    id: 'money_broke_4',
    title: '蹭饭日常',
    description: '为了省饭钱，你开始频繁"顺路"去朋友家做客。',
    minAge: 20,
    maxAge: 40,
    effects: { happiness: -5, network: -5 },
    requiredStats: { money: { max: 15 } },
    rarity: 'common',
  },
  // 负债事件
  {
    id: 'money_debt_1',
    title: '负债人生',
    description: '你的积蓄归零，开始负债生活。每个电话都可能是催债的。',
    minAge: 25,
    maxAge: 60,
    effects: { happiness: -20, health: -10 },
    requiredStats: { money: { max: 0 } },
    rarity: 'epic',
  },
  {
    id: 'money_debt_2',
    title: '被迫打工',
    description: '身无分文的你，被迫接受任何能赚钱的工作。',
    minAge: 20,
    maxAge: 60,
    effects: { money: 20, happiness: -15, health: -10 },
    requiredStats: { money: { max: 0 } },
    rarity: 'common',
  },
  // 富裕相关事件
  {
    id: 'money_rich_1',
    title: '开始投资',
    description: '有了闲钱，你开始研究股票基金，准备让钱生钱。',
    minAge: 25,
    maxAge: 60,
    effects: { money: 20, happiness: 5 },
    requiredStats: { money: { min: 70 } },
    rarity: 'common',
  },
  {
    id: 'money_rich_2',
    title: '被亲戚借钱',
    description: '远房亲戚找上门，说孩子上学急用钱。你陷入两难。',
    minAge: 30,
    maxAge: 60,
    effects: { money: -15, happiness: -5, network: 5 },
    requiredStats: { money: { min: 70 } },
    rarity: 'rare',
  },
  {
    id: 'money_rich_3',
    title: '消费升级',
    description: '你开始买以前不敢买的东西，享受生活。',
    minAge: 25,
    maxAge: 60,
    effects: { money: -20, happiness: 15 },
    requiredStats: { money: { min: 80 } },
    rarity: 'common',
  },
  // 中产焦虑事件
  {
    id: 'money_mid_1',
    title: '中产焦虑',
    description: '收入尚可，但房贷车贷让你喘不过气。你不敢停下来。',
    minAge: 30,
    maxAge: 55,
    effects: { happiness: -8, health: -5 },
    requiredStats: { money: { min: 40, max: 70 } },
    rarity: 'common',
  },
  {
    id: 'money_mid_2',
    title: '副业焦虑',
    description: '主业收入不够，你开始疯狂研究各种副业。',
    minAge: 25,
    maxAge: 50,
    effects: { money: 10, happiness: -5, health: -5 },
    requiredStats: { money: { min: 30, max: 60 } },
    rarity: 'common',
  },
];

// 极端人生路径事件
const extremePathEvents: LifeEvent[] = [
  // 隐居路线
  {
    id: 'hermit_1',
    title: '山中独居',
    description: '你搬到山里，开始了与世隔绝的生活。',
    minAge: 30,
    maxAge: 100,
    effects: { money: -5, happiness: 10, health: 5 },
    rarity: 'rare',
  },
  {
    id: 'hermit_2',
    title: '冥想悟道',
    description: '每天打坐冥想，你开始看透人生的本质。',
    minAge: 30,
    maxAge: 100,
    effects: { happiness: 15, intelligence: 5 },
    rarity: 'rare',
  },
  {
    id: 'hermit_3',
    title: '种菜养花',
    description: '自给自足的生活让你感到前所未有的平静。',
    minAge: 30,
    maxAge: 100,
    effects: { happiness: 8, health: 5 },
    rarity: 'common',
  },
  
  // 乞讨路线
  {
    id: 'beggar_1',
    title: '街头第一夜',
    description: '你在桥洞下度过了第一个夜晚，寒风刺骨。',
    minAge: 18,
    maxAge: 100,
    effects: { happiness: -10, health: -10 },
    rarity: 'common',
  },
  {
    id: 'beggar_2',
    title: '今天收成不错',
    description: '遇到好心人，你吃到了一周来的第一顿热饭。',
    minAge: 18,
    maxAge: 100,
    effects: { money: 5, happiness: 5 },
    rarity: 'rare',
  },
  {
    id: 'beggar_3',
    title: '被驱赶',
    description: '城管来了，你不得不换个地方。',
    minAge: 18,
    maxAge: 100,
    effects: { happiness: -5, health: -3 },
    rarity: 'common',
  },
  
  // 犯罪边缘
  {
    id: 'criminal_1',
    title: '第一次铤而走险',
    description: ' desperation让你做出了平时不敢想的事。',
    minAge: 20,
    maxAge: 60,
    effects: { money: 20, happiness: -10, health: -5 },
    rarity: 'epic',
  },
  {
    id: 'criminal_2',
    title: '差点被抓',
    description: '好险，差一点就进局子了。',
    minAge: 20,
    maxAge: 60,
    effects: { happiness: -15, health: -10 },
    rarity: 'rare',
  },
  {
    id: 'criminal_3',
    title: '金盆洗手',
    description: '你决定收手，重新做人。',
    minAge: 25,
    maxAge: 60,
    effects: { happiness: 10 },
    rarity: 'legendary',
  },
  
  // 成瘾路线
  {
    id: 'addict_1',
    title: '第一次尝试',
    description: '为了逃避现实，你接触了不该接触的东西。',
    minAge: 18,
    maxAge: 60,
    effects: { happiness: 10, health: -10, money: -10 },
    rarity: 'epic',
  },
  {
    id: 'addict_2',
    title: '戒断反应',
    description: '没有它，你感觉生不如死。',
    minAge: 18,
    maxAge: 60,
    effects: { happiness: -20, health: -15 },
    rarity: 'common',
  },
  {
    id: 'addict_3',
    title: '彻底堕落',
    description: '你已经无法回头了。',
    minAge: 20,
    maxAge: 60,
    effects: { happiness: -30, health: -20, money: -20 },
    rarity: 'epic',
  },
  
  // 老年逆袭
  {
    id: 'elder_comeback_1',
    title: '60岁创业',
    description: '不服老的你决定再搏一把。',
    minAge: 60,
    maxAge: 80,
    effects: { money: -10, happiness: 15 },
    rarity: 'legendary',
  },
  {
    id: 'elder_comeback_2',
    title: '突然翻红',
    description: '你的某个作品意外走红，人生第二春。',
    minAge: 60,
    maxAge: 85,
    effects: { money: 50, happiness: 20 },
    rarity: 'legendary',
  },
  {
    id: 'elder_comeback_3',
    title: '老年网红',
    description: '你成了短视频平台上的老年网红。',
    minAge: 65,
    maxAge: 90,
    effects: { money: 20, happiness: 15 },
    rarity: 'epic',
  },
];

// 所有事件合并
export const ALL_EVENTS: LifeEvent[] = [
  ...infantEvents,
  ...childEvents,
  ...teenEvents,
  ...youngAdultEvents,
  ...adultEvents,
  ...middleAgeEvents,
  ...elderlyEvents,
  ...moneyDrivenEvents,
  ...extremePathEvents,
  ...HUMOR_EVENTS, // 中式幽默事件
];

// 根据年龄获取对应的人生阶段
export function getLifeStage(age: number): LifeStage {
  if (age < 3) return 'infant';
  if (age < 13) return 'child';
  if (age < 19) return 'teen';
  if (age < 31) return 'youngAdult';
  if (age < 46) return 'adult';
  if (age < 61) return 'middleAge';
  return 'elderly';
}

// 根据年龄和状态获取可用事件
export function getAvailableEvents(
  age: number,
  stats: PlayerStats,
  familyType: FamilyType,
  usedEventIds: string[]
): LifeEvent[] {
  const available = ALL_EVENTS.filter(event => {
    // 年龄检查
    if (age < event.minAge || age > event.maxAge) return false;
    
    // 已使用事件不再触发
    if (usedEventIds.includes(event.id)) return false;
    
    // 属性要求检查
    if (event.requiredStats) {
      if (event.requiredStats.money) {
        if (event.requiredStats.money.min !== undefined && stats.money < event.requiredStats.money.min) return false;
        if (event.requiredStats.money.max !== undefined && stats.money > event.requiredStats.money.max) return false;
      }
      if (event.requiredStats.intelligence) {
        if (event.requiredStats.intelligence.min !== undefined && stats.intelligence < event.requiredStats.intelligence.min) return false;
        if (event.requiredStats.intelligence.max !== undefined && stats.intelligence > event.requiredStats.intelligence.max) return false;
      }
      if (event.requiredStats.network) {
        const network = stats.network ?? 0;
        if (event.requiredStats.network.min !== undefined && network < event.requiredStats.network.min) return false;
        if (event.requiredStats.network.max !== undefined && network > event.requiredStats.network.max) return false;
      }
      if (event.requiredStats.health) {
        if (event.requiredStats.health.min !== undefined && stats.health < event.requiredStats.health.min) return false;
        if (event.requiredStats.health.max !== undefined && stats.health > event.requiredStats.health.max) return false;
      }
      if (event.requiredStats.happiness) {
        if (event.requiredStats.happiness.min !== undefined && stats.happiness < event.requiredStats.happiness.min) return false;
        if (event.requiredStats.happiness.max !== undefined && stats.happiness > event.requiredStats.happiness.max) return false;
      }
    }
    
    return true;
  });
  
  return available;
}

// 加权随机选择事件
export function selectEvent(
  events: LifeEvent[],
  familyType: FamilyType,
  stats?: PlayerStats
): LifeEvent | null {
  if (events.length === 0) return null;
  
  // 计算权重
  const weights = events.map(event => {
    let weight = 1;
    
    // 根据稀有度调整权重
    switch (event.rarity) {
      case 'legendary': weight = 1; break;
      case 'epic': weight = 3; break;
      case 'rare': weight = 5; break;
      case 'common': weight = 10; break;
    }
    
    // 家庭加成
    if (event.familyBonus && event.familyBonus[familyType]) {
      weight += event.familyBonus[familyType]! / 10;
    }
    
    // 金钱驱动事件加成 - 根据金钱状态调整概率
    if (stats) {
      const money = stats.money;
      
      // 贫穷事件在钱少时更容易触发
      if (event.id.startsWith('money_broke') || event.id.startsWith('money_debt')) {
        if (money < 20) weight *= 3; // 穷的时候更容易触发贫穷事件
        else if (money > 50) weight = 0; // 有钱时不触发
      }
      
      // 富裕事件在钱多时才触发
      if (event.id.startsWith('money_rich')) {
        if (money > 70) weight *= 2;
        else weight = 0;
      }
      
      // 中产焦虑事件在中等收入时触发
      if (event.id.startsWith('money_mid')) {
        if (money >= 30 && money <= 70) weight *= 2;
        else weight *= 0.5;
      }
    }
    
    return weight;
  });
  
  // 加权随机选择
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < events.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return events[i];
    }
  }
  
  return events[events.length - 1];
}
