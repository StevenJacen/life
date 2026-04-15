import { LifeEvent, ChoiceOption, FamilyType } from '@/lib/types';

// 辅助函数：创建选择选项
function createOption(
  id: string,
  text: string,
  description: string,
  effects: ChoiceOption['effects'],
  narrative: string,
  followUpEvents?: string[]
): ChoiceOption {
  return { id, text, description, effects, narrative, followUpEvents };
}

// 1. 高考后的选择 (18岁)
const gaokaoChoice: LifeEvent = {
  id: 'choice_gaokao',
  title: '人生分水岭',
  description: '高考成绩出来了，你需要做出人生的重要选择。',
  minAge: 18,
  maxAge: 18,
  isChoice: true,
  rarity: 'epic',
  choices: [
    createOption(
      'university',
      '读985/211大学',
      '进入名校深造，为将来打好基础',
      { intelligence: 15, money: -10, happiness: 5 },
      '你选择了读大学，虽然学费不菲，但你相信知识改变命运。',
      ['young_11', 'young_12']
    ),
    createOption(
      'ordinary_college',
      '读普通本科',
      '平平淡淡读完大学，拿个文凭',
      { intelligence: 8, money: -5, happiness: 3 },
      '你选择了一所普通大学，虽然名气不大，但你决定靠自己努力。'
    ),
    createOption(
      'vocational',
      '读职业技术学院',
      '学一门手艺，早点出来工作',
      { intelligence: 3, money: -2, happiness: 0 },
      '你选择了职业技术学院，你觉得有一技之长比什么都强。'
    ),
    createOption(
      'work_directly',
      '直接打工',
      '不读书了，早点赚钱养家',
      { money: 10, happiness: -5 },
      '你决定辍学打工，虽然辛苦，但至少能早点赚钱。',
      ['young_2', 'young_10']
    ),
    createOption(
      'abroad',
      '出国留学',
      '家里有条件，出国见世面',
      { intelligence: 10, network: 15, money: -30, happiness: 10 },
      '家里咬咬牙送你出国，你既兴奋又忐忑。',
      ['young_6', 'young_14']
    ),
  ],
};

// 2. 大学毕业后的选择 (22岁)
const graduationChoice: LifeEvent = {
  id: 'choice_graduation',
  title: '毕业抉择',
  description: '大学四年转瞬即逝，你站在人生的十字路口。',
  minAge: 22,
  maxAge: 24,
  isChoice: true,
  rarity: 'epic',
  requiredStats: { intelligence: { min: 30 } },
  choices: [
    createOption(
      'postgrad',
      '考研深造',
      '继续读书，提升学历',
      { intelligence: 20, money: -15, happiness: -3 },
      '你决定考研，虽然要再熬三年，但你觉得值得。',
      ['adult_11']
    ),
    createOption(
      'civil_service',
      '考公务员',
      '追求稳定，进入体制内',
      { money: 15, happiness: 5, network: 10 },
      '你决定考公，"宇宙的尽头是编制"。',
      ['young_4', 'adult_9']
    ),
    createOption(
      'big_company',
      '进大厂打工',
      '高薪高压，996福报',
      { money: 25, happiness: -8, health: -5, network: 5 },
      '你拿到了大厂offer，年薪可观，但你隐约觉得要付出代价。',
      ['young_13', 'adult_2']
    ),
    createOption(
      'small_company',
      '进小公司',
      '相对稳定，工资一般',
      { money: 12, happiness: 2 },
      '你选择了一家小公司，虽然工资不高，但工作压力小。'
    ),
    createOption(
      'startup',
      '创业公司',
      '加入创业公司，搏一把',
      { money: 15, happiness: 5, network: 10 },
      '你加入了一家创业公司，期权画饼很诱人。',
      ['adult_7', 'adult_10']
    ),
    createOption(
      'freelance',
      '自由职业',
      '不想被束缚，自己接活',
      { money: 5, happiness: 8, network: -3 },
      '你决定做自由职业，虽然收入不稳定，但你享受自由。'
    ),
  ],
};

// 3. 职业发展的选择 (28岁)
const careerChoice: LifeEvent = {
  id: 'choice_career',
  title: '职业转折',
  description: '工作几年了，你开始思考未来的方向。',
  minAge: 27,
  maxAge: 32,
  isChoice: true,
  rarity: 'rare',
  choices: [
    createOption(
      'climb_ladder',
      '努力升职',
      '拼命工作，争取晋升',
      { money: 20, happiness: -5, health: -5, network: 10 },
      '你决定拼命工作，为了升职加薪不惜一切。',
      ['middle_5']
    ),
    createOption(
      'change_job',
      '跳槽涨薪',
      '换一家公司，寻求更好待遇',
      { money: 15, happiness: 3 },
      '你选择了跳槽，新东家给了不错的涨幅。'
    ),
    createOption(
      'start_business',
      '辞职创业',
      '自己当老板，搏一把大的',
      { money: -30, happiness: 5, network: 15 },
      '你辞职创业了，虽然风险很大，但你不想留下遗憾。',
      ['young_6', 'adult_10']
    ),
    createOption(
      'work_life_balance',
      '追求平衡',
      '不卷了，健康最重要',
      { money: 5, happiness: 10, health: 8 },
      '你决定不再内卷，work-life balance才是你想要的。'
    ),
    createOption(
      'side_hustle',
      '搞副业',
      '主业保底，副业赚钱',
      { money: 15, happiness: -3 },
      '你开始搞副业，虽然累点，但多一份收入。'
    ),
  ],
};

// 4. 婚恋选择 (28岁)
const marriageChoice: LifeEvent = {
  id: 'choice_marriage',
  title: '婚恋抉择',
  description: '到了适婚年龄，你需要做出选择。',
  minAge: 26,
  maxAge: 35,
  isChoice: true,
  rarity: 'rare',
  choices: [
    createOption(
      'marry_love',
      '嫁给爱情',
      '和爱的人结婚，不管条件',
      { happiness: 15, money: -10 },
      '你选择了爱情，虽然对方条件一般，但你觉得很幸福。',
      ['adult_1']
    ),
    createOption(
      'marry_rich',
      '现实一点',
      '找个条件好的，少奋斗十年',
      { money: 30, happiness: 5, network: 15 },
      '你选择了现实，嫁给了条件不错的人。',
      ['adult_1', 'adult_6']
    ),
    createOption(
      'stay_single',
      '保持单身',
      '不结婚，一个人过也挺好',
      { happiness: 5, money: 10, network: -5 },
      '你决定不结婚，享受单身的自由。'
    ),
    createOption(
      'delayed',
      '再等等',
      '先忙事业，婚姻不急',
      { money: 15, happiness: -3 },
      '你决定先忙事业，婚姻的事情以后再说。'
    ),
  ],
};

// 5. 中年危机应对 (35岁)
const midlifeCrisisChoice: LifeEvent = {
  id: 'choice_midlife',
  title: '中年危机',
  description: '35岁了，你开始怀疑人生，该何去何从？',
  minAge: 34,
  maxAge: 40,
  isChoice: true,
  rarity: 'epic',
  choices: [
    createOption(
      'keep_fighting',
      '继续卷',
      '不服老，继续打拼',
      { money: 15, happiness: -10, health: -10 },
      '你决定继续卷，不想被年轻人淘汰。',
      ['middle_2', 'middle_4']
    ),
    createOption(
      'find_meaning',
      '寻找意义',
      '思考人生，寻找真正的价值',
      { happiness: 10, money: -5 },
      '你开始思考人生的意义，不再只追求金钱。'
    ),
    createOption(
      'start_over',
      '重新开始',
      '换个行业，从头再来',
      { money: -20, happiness: 8, intelligence: 10 },
      '你决定换个赛道重新开始，虽然风险大但不后悔。'
    ),
    createOption(
      'accept_fate',
      '认命躺平',
      '接受现状，不再折腾',
      { happiness: 3, money: 5 },
      '你选择了认命，不再折腾，接受平凡的生活。'
    ),
    createOption(
      'second_startup',
      '二次创业',
      '不甘心，再搏一把',
      { money: -40, happiness: 15, network: 10 },
      '你不甘心，决定中年创业再搏一把。',
      ['middle_3']
    ),
  ],
};

// 6. 买房选择 (30岁)
const houseChoice: LifeEvent = {
  id: 'choice_house',
  title: '买房抉择',
  description: '房价这么高，你该怎么办？',
  minAge: 28,
  maxAge: 35,
  isChoice: true,
  rarity: 'rare',
  choices: [
    createOption(
      'buy_house',
      '咬牙买房',
      '背上三十年房贷，成为房奴',
      { money: -50, happiness: -5 },
      '你咬牙买了房，从此成为房奴，但至少有家了。'
    ),
    createOption(
      'rent_forever',
      '一直租房',
      '不买，租房也挺好',
      { money: 10, happiness: 5 },
      '你决定不买房，租房住更自由。'
    ),
    createOption(
      'move_home',
      '回老家',
      '离开大城市，回老家发展',
      { money: 20, happiness: 8, network: -10 },
      '你决定离开大城市，回老家过安稳日子。'
    ),
    createOption(
      'family_help',
      '靠家里',
      '让父母出首付',
      { money: -20, happiness: 3 },
      '家里帮你出了首付，你终于有了自己的房子。',
      ['young_9']
    ),
  ],
};

// 7. 子女教育选择 (35岁)
const educationChoice: LifeEvent = {
  id: 'choice_education',
  title: '教育理念',
  description: '孩子上学了，你怎么教育TA？',
  minAge: 32,
  maxAge: 45,
  isChoice: true,
  rarity: 'rare',
  familyBonus: { EDUCATED: 20 },
  choices: [
    createOption(
      'tiger_parent',
      '鸡娃',
      '各种补习班，必须成才',
      { money: -25, happiness: -5 },
      '你开始了鸡娃之路，孩子每天在各种班之间奔波。'
    ),
    createOption(
      'happy_education',
      '快乐教育',
      '不逼孩子，快乐成长',
      { money: -10, happiness: 10 },
      '你选择了快乐教育，让孩子自由成长。'
    ),
    createOption(
      'alternative',
      '另类教育',
      '国际学校/ homeschool',
      { money: -40, happiness: 5, network: 5 },
      '你选择了另类教育，虽然花费不菲，但你认为值得。'
    ),
    createOption(
      'let_it_be',
      '顺其自然',
      '孩子自己的路自己走',
      { happiness: 8 },
      '你决定顺其自然，孩子的路让孩子自己选。'
    ),
  ],
};

// 8. 父母养老选择 (45岁)
const parentsCareChoice: LifeEvent = {
  id: 'choice_parents',
  title: '父母养老',
  description: '父母年纪大了，需要你的照顾。',
  minAge: 42,
  maxAge: 55,
  isChoice: true,
  rarity: 'rare',
  choices: [
    createOption(
      'care_personally',
      '亲自照顾',
      '把父母接到身边',
      { happiness: 5, money: -10, health: -5 },
      '你把父母接到身边照顾，虽然辛苦但心里踏实。'
    ),
    createOption(
      'nursing_home',
      '送养老院',
      '专业的事交给专业的人',
      { money: -20, happiness: -5 },
      '你把父母送到了条件不错的养老院。'
    ),
    createOption(
      'hire_nurse',
      '请护工',
      '花钱请人照顾',
      { money: -15, happiness: 3 },
      '你请了护工照顾父母，虽然花钱但省心。'
    ),
    createOption(
      'siblings_share',
      '兄弟姐妹分摊',
      '和兄弟姐妹商量着来',
      { money: -8, happiness: 5 },
      '你和兄弟姐妹商量好，轮流照顾父母。'
    ),
  ],
};

// 所有抉择事件
export const CHOICE_EVENTS: LifeEvent[] = [
  gaokaoChoice,
  graduationChoice,
  careerChoice,
  marriageChoice,
  midlifeCrisisChoice,
  houseChoice,
  educationChoice,
  parentsCareChoice,
];

// 获取特定年龄的抉择事件
export function getChoiceEventForAge(age: number): LifeEvent | null {
  return CHOICE_EVENTS.find(event => age >= event.minAge && age <= event.maxAge) || null;
}

// 根据选择ID获取选项
export function getChoiceOption(eventId: string, choiceId: string): ChoiceOption | null {
  const event = CHOICE_EVENTS.find(e => e.id === eventId);
  if (!event || !event.choices) return null;
  return event.choices.find(c => c.id === choiceId) || null;
}
