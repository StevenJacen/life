import { LifeEvent } from '@/lib/types';

// ============================================
// 中式幽默事件集 - 基于传统段子的本土化幽默
// ============================================

// 一、自嘲与职业调侃 (青年到中年)
const selfDeprecatingEvents: LifeEvent[] = [
  {
    id: 'humor_face_vs_clean',
    title: '面子工程',
    description: '虽然不爱收拾屋子，但你把"要脸"这件事贯彻得很彻底。朋友来访前，你用了三分钟完成了从狗窝到样板房的魔术。',
    minAge: 22,
    maxAge: 45,
    rarity: 'common',
    effects: { happiness: 2 },
  },
  {
    id: 'humor_job_switch_audience',
    title: '职场换客',
    description: '你终于悟了：工作不用换，换批同事就能重新开始。可惜新来的很快也知道了你的底细。',
    minAge: 25,
    maxAge: 50,
    rarity: 'common',
    effects: { happiness: -1, network: 2 },
    lifeStateTriggers: ['worker', 'business', 'freelancer'],
  },
  {
    id: 'humor_ever_normal',
    title: '曾经正经',
    description: '干这行之前，大家都说你是个正经人。现在回想起来，那大概是对你最客气的评价了。',
    minAge: 24,
    maxAge: 55,
    rarity: 'common',
    effects: { happiness: 3 },
  },
  {
    id: 'humor_bad_reviews',
    title: '网评修行',
    description: '你以为最大的挑战是业务能力，结果发现最难的是如何心平气和地看待网友的评价。',
    minAge: 20,
    maxAge: 50,
    rarity: 'rare',
    effects: { happiness: -2, intelligence: 2 },
    lifeStateTriggers: ['worker', 'freelancer', 'business'],
  },
  {
    id: 'humor_seal_fee',
    title: '风口封口',
    description: '以前以为站在风口上猪都能飞，现在发现每个月领的是"封口费"——不说话，就能安稳过。',
    minAge: 28,
    maxAge: 55,
    rarity: 'rare',
    effects: { money: 5, happiness: -3 },
    lifeStateTriggers: ['worker'],
  },
];

// 二、人际关系与社交幽默
const socialEvents: LifeEvent[] = [
  {
    id: 'humor_shelf_value',
    title: '上架下架',
    description: '讲道理那叫"上架子"，不讲道理才叫"情绪价值"。你在这个问题上反复横跳，终于两边不是人。',
    minAge: 25,
    maxAge: 60,
    rarity: 'common',
    effects: { happiness: -2, network: -1 },
  },
  {
    id: 'humor_delete_friend',
    title: '生死之交',
    description: '朋友好久没联系，你误以为人家"走了"，于是默默删了微信。结果人家只是换了头像，现在见面很是尴尬。',
    minAge: 30,
    maxAge: 70,
    rarity: 'rare',
    effects: { network: -3, happiness: -1 },
  },
  {
    id: 'humor_insult_monetize',
    title: '骂声变现',
    description: '有人在网上骂你，你不生气，反而在评论区开起了广告。这叫"以德服人"，服的是广告商。',
    minAge: 20,
    maxAge: 50,
    rarity: 'epic',
    effects: { money: 8, happiness: 5 },
    lifeStateTriggers: ['freelancer', 'business'],
  },
  {
    id: 'humor_eq_test',
    title: '情商测验',
    description: '你的情商其实没那么高，主要是对方没接住话。这叫"棋逢对手"，对手没动。',
    minAge: 22,
    maxAge: 60,
    rarity: 'common',
    effects: { happiness: 2 },
  },
  {
    id: 'humor_triple_negative',
    title: '否定之否定',
    description: '双重否定表示肯定，三重否定那就是嘴硬。你在家庭会议上完美演绎了这一语法现象。',
    minAge: 28,
    maxAge: 65,
    rarity: 'common',
    effects: { happiness: -2 },
  },
  {
    id: 'humor_not_fighting',
    title: '人情世故',
    description: '世间不是打打杀杀，而是人情世故。你深谙此道，所以在打游戏时也能给对手发"辛苦了"。',
    minAge: 20,
    maxAge: 80,
    rarity: 'rare',
    effects: { network: 3, happiness: 2 },
  },
];

// 三、生活与消费琐事
const dailyLifeEvents: LifeEvent[] = [
  {
    id: 'humor_aunt_sweeps',
    title: '颜面扫地',
    description: '阿姨来打扫，扫的是地，但你感觉她在用你的颜面扫地。 especially when she finds that sock.',
    minAge: 25,
    maxAge: 50,
    rarity: 'common',
    effects: { happiness: -2, money: -2 },
  },
  {
    id: 'humor_drunk_closet',
    title: '衣柜醉酒',
    description: '你说衣柜不是乱，是它喝醉了吐了一地衣服。这个解释让来访的朋友对你的生活态度肃然起敬。',
    minAge: 22,
    maxAge: 45,
    rarity: 'common',
    effects: { happiness: 3 },
  },
  {
    id: 'humor_best_age_housing',
    title: '最好的年纪',
    description: '在你最好的年纪，追上了最贵的房价。这叫"生逢其时"，只是这个"时"是时运不济的时。',
    minAge: 28,
    maxAge: 45,
    rarity: 'rare',
    effects: { happiness: -5, money: -10 },
    requiredStats: { money: { max: 60 } },
  },
  {
    id: 'humor_minimalist_rental',
    title: '极简风水',
    description: '你想装修成极简风，结果装成了"出租风"。朋友说你这叫"侘寂美学"，你说是"钱包美学"。',
    minAge: 25,
    maxAge: 40,
    rarity: 'common',
    effects: { money: -5, happiness: 2 },
  },
  {
    id: 'humor_fascist_set_meal',
    title: '法餐西做',
    description: '在高档餐厅点了法式套餐，发现厨子姓周。78块钱的软蛋饼，拆开来卖叫"解构主义"。',
    minAge: 25,
    maxAge: 60,
    rarity: 'rare',
    effects: { money: -8, happiness: -2, intelligence: 1 },
  },
  {
    id: 'humor_kindergarten_law',
    title: '学前普法',
    description: '朋友说要学刀法去攻打幼儿园，你建议他先学刑法。这叫"未雨绸缪"，也是"保命要紧"。',
    minAge: 20,
    maxAge: 50,
    rarity: 'epic',
    effects: { intelligence: 3, network: 2 },
  },
];

// 四、家庭与金钱观
const familyMoneyEvents: LifeEvent[] = [
  {
    id: 'humor_bo_ya_zi_qi',
    title: '高山流水',
    description: '爸欠债如高山，妈取钱如流水，他俩真是伯牙子期，一个愿借一个愿花，合奏出家里独特的经济交响曲。',
    minAge: 18,
    maxAge: 50,
    rarity: 'rare',
    effects: { money: -5, happiness: 3 },
    familyBonus: { NORMAL: 10, POOR: 20 },
  },
  {
    id: 'humor_bailout_dad',
    title: '补仓',
    description: '给爸打钱还债，你说这不是负担，是在给自己"补仓"。毕竟他欠的也是你的童年。',
    minAge: 25,
    maxAge: 55,
    rarity: 'rare',
    effects: { money: -10, happiness: 2, network: 3 },
  },
  {
    id: 'humor_daycare_not_prison',
    title: '托管之名',
    description: '你告诉孩子，上的是托管班，不叫少管所。虽然你内心深处觉得两者的区别主要在于接送时间。',
    minAge: 28,
    maxAge: 50,
    rarity: 'common',
    effects: { happiness: 2, money: -5 },
  },
  {
    id: 'humor_reward_laziness',
    title: '闲者奖励',
    description: '哪怕今天什么都没干，也得花点钱奖励下自己闲着。这叫"劳逸结合"，虽然只做到了后两个字。',
    minAge: 22,
    maxAge: 60,
    rarity: 'common',
    effects: { money: -5, happiness: 5 },
  },
  {
    id: 'humor_lottery_temple',
    title: '对冲基因',
    description: '为了对冲家里的亏钱基因，你在财神庙前现场刮彩票。这叫"因地制宜"，也是"心诚则灵"。',
    minAge: 25,
    maxAge: 70,
    rarity: 'epic',
    effects: { money: -3, happiness: 4 },
  },
];

// 五、职场与时尚观察
const workFashionEvents: LifeEvent[] = [
  {
    id: 'humor_pork_return',
    title: '洋为中用',
    description: '餐厅菜单上写着"猪后豚煎肉切片搭配青椒与碳水"，其实就是回锅肉盖饭。你一边吃一边感叹文化自信的重要性。',
    minAge: 22,
    maxAge: 55,
    rarity: 'common',
    effects: { money: -3, happiness: 2, intelligence: 1 },
  },
  {
    id: 'humor_nightclub_decimal',
    title: '小数点之谜',
    description: '夜店的1.5不是150块，是一万五。你听得想回他0.0个亿，然后默默走出了店门。',
    minAge: 25,
    maxAge: 45,
    rarity: 'rare',
    effects: { money: 5, happiness: -1 },
  },
  {
    id: 'humor_eq_scapegoat',
    title: '高情商时刻',
    description: '只要有人把天聊死了，大家都会看向那个"高情商"的你。你明白了，高情商就是用来收拾烂摊子的。',
    minAge: 25,
    maxAge: 60,
    rarity: 'common',
    effects: { network: 3, happiness: -2 },
  },
  {
    id: 'humor_pants_rolling',
    title: '裤脚大将',
    description: '在时尚杂志社工作，你的梦想是成为"地表最强手卷裤脚大将"。毕竟卷裤脚比写文章容易出成绩。',
    minAge: 22,
    maxAge: 40,
    rarity: 'rare',
    effects: { appearance: 3, happiness: 2 },
  },
  {
    id: 'humor_body_anxiety',
    title: '身材冥想',
    description: '你说身材焦虑不是身体焦虑，你这身体是治不好的，只能等它自己好起来做梦。这叫"顺其自然"，也是"听天由命"。',
    minAge: 25,
    maxAge: 55,
    rarity: 'common',
    effects: { happiness: 3, health: -1 },
  },
];

// 六、额外补充的中式幽默段子
const extraChineseHumorEvents: LifeEvent[] = [
  {
    id: 'humor_confucius_math',
    title: '孔孟算法',
    description: '子曰：三十而立，四十不惑，五十知天命，六十还要还房贷。你觉得自己可能读了一本假论语。',
    minAge: 30,
    maxAge: 70,
    rarity: 'rare',
    effects: { happiness: -2, intelligence: 2 },
  },
  {
    id: 'humor_relative_comparison',
    title: '别人家的孩子',
    description: '你妈又在说别人家的孩子。你想了想，决定成为"别人家的中年人"——毕竟孩子不好当，中年更不好当。',
    minAge: 35,
    maxAge: 60,
    rarity: 'common',
    effects: { happiness: -3 },
  },
  {
    id: 'humor_wechat_steps',
    title: '步数政治',
    description: '你今天的微信步数是0，但你告诉自己这是在"节能减排"。晚上十一点，你偷偷摇了五百步，以示对健康的尊重。',
    minAge: 25,
    maxAge: 60,
    rarity: 'common',
    effects: { health: -1, happiness: 2 },
  },
  {
    id: 'humor_dress_code',
    title: '穿衣自由',
    description: '你说今天是"商务休闲"，老板说这是"休闲过头"。你们对"休闲"的理解差了一个辞职的距离。',
    minAge: 23,
    maxAge: 50,
    rarity: 'rare',
    effects: { appearance: -2, happiness: 3 },
  },
  {
    id: 'humor_new_year_resolution',
    title: '新年旧愿',
    description: '你的新年愿望和去年一样：减肥、存钱、脱单。这叫"不忘初心"，也是"重蹈覆辙"。',
    minAge: 22,
    maxAge: 65,
    rarity: 'common',
    effects: { happiness: 2 },
  },
  {
    id: 'humor_takeout_karma',
    title: '外卖因果',
    description: '你点外卖时备注"不要葱不要蒜"，店家给你塞了两头生蒜。这叫"塞翁失马"，焉知非福——至少没塞葱。',
    minAge: 20,
    maxAge: 50,
    rarity: 'common',
    effects: { happiness: 3, money: -2 },
  },
  {
    id: 'humor_salary_transparency',
    title: '薪资透明',
    description: '同事问你工资多少，你说了个数字。他说不可能，他比你高五百。现在你们都知道老板说的"薪资保密"是什么意思了。',
    minAge: 25,
    maxAge: 55,
    rarity: 'rare',
    effects: { happiness: -5, network: -2 },
  },
  {
    id: 'humor_gym_membership',
    title: '健身信仰',
    description: '你办了健身卡但没去，你说这是"精神健身"。毕竟意念到，肌肉自然到——虽然三年过去了还没到。',
    minAge: 22,
    maxAge: 50,
    rarity: 'common',
    effects: { money: -3, happiness: 1 },
  },
  {
    id: 'humor_parking_wisdom',
    title: '停车哲学',
    description: '找了半小时车位，你悟了：人生的意义不在于目的地，而在于寻找过程中的心平气和。',
    minAge: 28,
    maxAge: 60,
    rarity: 'rare',
    effects: { happiness: 2, health: -1 },
  },
  {
    id: 'humor_group_chat',
    title: '群聊礼仪',
    description: '家族群里长辈发了养生文章，你认真辟谣，结果被踢出群聊。这叫"忠言逆耳"，也是"不识抬举"。',
    minAge: 25,
    maxAge: 70,
    rarity: 'rare',
    effects: { network: -3, happiness: 2, intelligence: 1 },
  },
];

// 合并所有中式幽默事件
export const HUMOR_EVENTS: LifeEvent[] = [
  ...selfDeprecatingEvents,
  ...socialEvents,
  ...dailyLifeEvents,
  ...familyMoneyEvents,
  ...workFashionEvents,
  ...extraChineseHumorEvents,
];

// 按稀有度分类导出
export const COMMON_HUMOR_EVENTS = HUMOR_EVENTS.filter(e => e.rarity === 'common');
export const RARE_HUMOR_EVENTS = HUMOR_EVENTS.filter(e => e.rarity === 'rare');
export const EPIC_HUMOR_EVENTS = HUMOR_EVENTS.filter(e => e.rarity === 'epic');
export const LEGENDARY_HUMOR_EVENTS = HUMOR_EVENTS.filter(e => e.rarity === 'legendary');

// 按年龄段分类
export function getHumorEventsByAge(age: number): LifeEvent[] {
  return HUMOR_EVENTS.filter(e => age >= e.minAge && age <= e.maxAge);
}

// 按人生状态分类
export function getHumorEventsByLifeState(state: string): LifeEvent[] {
  return HUMOR_EVENTS.filter(e => 
    !e.lifeStateTriggers || e.lifeStateTriggers.includes(state as any)
  );
}
