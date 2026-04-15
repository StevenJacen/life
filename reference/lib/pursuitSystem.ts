/**
 * 人生重开模拟器 - 多阶段追求目标系统
 * 
 * 考公三战、考研二战、gap year...人生不是每次都能一战上岸
 */

import { PlayerState, OngoingPursuit, ChoiceOption } from './types';

// 追求目标定义
export interface PursuitDefinition {
  id: string;
  name: string;
  description: string;
  minAge: number;
  maxAge: number;
  baseSuccessRate: number;  // 基础成功率
  successRatePerAttempt: number;  // 每次尝试后的成功率变化（通常是负数，因为疲惫）
  statRequirements: {
    intelligence?: number;
    money?: number;
    health?: number;
    happiness?: number;
  };
  statEffects: {
    onAttempt: {
      money: number;      // 每次尝试消耗/变化
      happiness: number;  // 压力带来的心情变化
      health: number;     // 熬夜备考的健康损耗
    };
    onSuccess: {
      money: number;
      happiness: number;
      lifeState: string;
    };
    onFailure: {
      money: number;
      happiness: number;
    };
  };
  narratives: {
    start: string[];
    attempt: string[];
    success: string[];
    failure: string[];
    giveUp: string[];
    gapYear: string[];
  };
}

// 追求目标库
export const PURSUITS: Record<string, PursuitDefinition> = {
  civil_exam: {
    id: 'civil_exam',
    name: '考公上岸',
    description: '进入体制内，寻求一份稳定的工作',
    minAge: 22,
    maxAge: 35,
    baseSuccessRate: 0.15,  // 百里挑一的残酷现实
    successRatePerAttempt: -0.02,  // 每次失败心态崩一点
    statRequirements: {
      intelligence: 50,
      money: 20,  // 需要一定经济支撑备考
    },
    statEffects: {
      onAttempt: {
        money: -10,      // 报班、资料、考试费
        happiness: -8,   // 备考压力
        health: -3,      // 熬夜刷题
      },
      onSuccess: {
        money: 15,
        happiness: 20,
        lifeState: 'civil',
      },
      onFailure: {
        money: -5,
        happiness: -12,  // 落榜的打击
      },
    },
    narratives: {
      start: [
        '你决定加入考公大军，买了行测申论资料，开始了漫长的备考之路。',
        '家里人说"体制内稳定"，你咬咬牙报了名，准备冲击铁饭碗。',
        '看着身边同学纷纷上岸，你也下载了粉笔APP，开始了刷题生涯。',
      ],
      attempt: [
        '这是你第{attempt}次走进考场，题目好像比上次还难...',
        '又是熟悉的考场，熟悉的铃声，不知道这次能不能打破魔咒。',
        '你告诉自己这是最后一次，但心里也没底。',
        '备考的日子里，你卸载了游戏，朋友圈也不刷了，只为这一次。',
      ],
      success: [
        '笔试成绩出来那天，你盯着屏幕哭了——终于进面了！三个月后，你正式成为体制内一员。',
        '历经{attempt}次考试，你终于以最后一名踩线进面，逆袭成功！政审通过那天，全家松了一口气。',
        '功夫不负有心人，你以笔试第一的成绩强势上岸，选岗时终于有了话语权。',
      ],
      failure: [
        '成绩出来了，差0.5分进面。你盯着那个数字，不知道该不该再来一次。',
        '面试被逆袭。你准备了那么多时政热点，偏偏考了没看过的。',
        '申论写跑题了。走出考场的那一刻，你知道又要再来一年了。',
        '体检被刷。你没想到倒在最后一步，那种落差让人窒息。',
      ],
      giveUp: [
        '第{attempt}次失败后，你看着镜子里憔悴的自己，决定放过自己。体制内有体制内的安稳，体制外也有体制外的天空。',
        '年龄快到了，你黯然离场。那些没做完的真题，就当作青春的注脚吧。',
        '家里急需用钱，你不能再脱产备考了。考公这条路，走到这里为止。',
      ],
      gapYear: [
        '考试失利后，你没有马上投入下一场，而是选择gap一年，去西藏走了走，思考自己到底想要什么。',
        '你一边打零工一边备考，虽然进度慢了点，但至少不再手心向上要钱了。',
        '焦虑到失眠后，你决定暂停一年。这一年你去学了烘焙，意外发现了自己的另一面。',
      ],
    },
  },

  postgrad: {
    id: 'postgrad',
    name: '考研上岸',
    description: '继续深造，提升学历',
    minAge: 21,
    maxAge: 30,
    baseSuccessRate: 0.25,  // 考研成功率相对高一点
    successRatePerAttempt: -0.05,  // 但二战三战心态更容易崩
    statRequirements: {
      intelligence: 60,
      money: 30,  // 考研报班更贵
    },
    statEffects: {
      onAttempt: {
        money: -15,      // 考研班更贵
        happiness: -5,
        health: -5,      // 考研更熬人
      },
      onSuccess: {
        money: -10,      // 读研还要花钱
        happiness: 25,
        lifeState: 'student',
      },
      onFailure: {
        money: -8,
        happiness: -15,
      },
    },
    narratives: {
      start: [
        '本科毕业在即，你决定考研。图书馆的座位预约，成了你每天的必修课。',
        '看着招聘会上3000块的offer，你决定再读三年书缓冲一下。',
        '你对某个领域产生了浓厚兴趣，想继续深造，虽然知道这条路不好走。',
      ],
      attempt: [
        '政治背到第三遍，英语真题做到第{attempt}套，数学还是看到题就懵。',
        '考研教室里，你看着身边换了一波又一波面孔，有人放弃了，有人还在坚持。',
        '倒计时30天，你每天只睡5个小时，咖啡成了最好的朋友。',
        '这是第{attempt}次报名，你已经不敢告诉家里了，只说是"在职备考"。',
      ],
      success: [
        '拟录取名单公布，你的名字赫然在列！二战终于上岸，你比应届生更珍惜这个机会。',
        '调剂成功。虽然不是第一志愿，但能上岸已经是万幸。',
        '以专业第一的成绩被录取，导师主动发邮件联系你。那些苦，都值了。',
      ],
      failure: [
        '国家线都没过。你看到分数的那一刻，脑子一片空白——这一年的努力算什么？',
        '复试被刷。那个本校生明明表现不如你，但你懂的...',
        '专业课压分，你的分数低到离谱。调剂无望，你成了分母。',
        '考前一周阳了，高烧40度走进考场。成绩出来，差3分。',
      ],
      giveUp: [
        '三战失败后，你终于接受了自己不是读书的料。找工作去吧，至少能养活自己。',
        '看着同龄人已经工作三年，你不想再读一年书了。学历重要，但时间更贵。',
        '家里人说"算了，女孩子不用读那么多书"。你沉默地撕掉了准考证。',
      ],
      gapYear: [
        '落榜后你没有马上二战，而是先去工作了一年。这一年让你更清楚自己为什么要读研。',
        '你申请了延期毕业，用这一年时间实习、攒钱，为下一次做更充分的准备。',
        '考试失利后，你gap了一年去旅行。在洱海边，你想通了很多事。',
      ],
    },
  },

  job_hunt: {
    id: 'job_hunt',
    name: '求职就业',
    description: '在就业市场中寻找机会',
    minAge: 20,
    maxAge: 45,
    baseSuccessRate: 0.40,  // 找工作相对容易，但好工作难
    successRatePerAttempt: -0.03,  // 失业越久越难找
    statRequirements: {
      intelligence: 40,
    },
    statEffects: {
      onAttempt: {
        money: -5,       // 面试交通、置装
        happiness: -5,
        health: -2,
      },
      onSuccess: {
        money: 20,
        happiness: 10,
        lifeState: 'worker',
      },
      onFailure: {
        money: -2,
        happiness: -8,
      },
    },
    narratives: {
      start: [
        '你更新了简历，在各大招聘网站投递，开始了求职之旅。',
        '毕业典礼后，你正式成为失业青年。投出去的简历石沉大海。',
        '裸辞三个月后，你开始慌了。存款在减少，面试却一个没有。',
      ],
      attempt: [
        '第{attempt}次面试，又是"回去等通知"。你知道这是礼貌的拒绝。',
        'HR看着你的空窗期，眼神里写满了质疑。你解释说"我在提升自己"，但对方显然不信。',
        '你降低预期，投了一些原本看不上的岗位。没想到连这些也竞争激烈。',
        '失业第{attempt}个月，你开始考虑要不要转行做销售...',
      ],
      success: [
        '终于拿到offer！虽然薪资比上家低，但你已经 grateful 了。',
        '一个偶然的机会，朋友内推了你。面试很顺利，你重新回到了职场。',
        '你接受了一份自由职业的工作，虽然不稳定，但至少有收入了。',
      ],
      failure: [
        '终面被刷，输给了一个应届生。HR说"你能力可以，但我们想要更有潜力的"。',
        '背调出了问题，offer被撤。你才知道上家领导说了你坏话。',
        '行业寒冬，你投的岗位全都冻结招聘了。运气不好，也是实力的一部分。',
      ],
      giveUp: [
        '找不到工作，你决定先送外卖过渡。至少要先活下去。',
        '你彻底放弃了找工作，开始尝试做自媒体。虽然收入不稳定，但自由。',
        '失业一年后，你选择了回老家。大城市容不下肉身，小城市容不下灵魂。',
      ],
      gapYear: [
        '被裁员后，你没有急着找工作，而是用积蓄gap了半年。这段时间你重新思考了职业方向。',
        '你利用失业期考了一个证书，虽然暂时没工作，但你觉得投资自己是值得的。',
        '失业后你选择做志愿者，边做边找。至少这样不会与社会脱节。',
      ],
    },
  },

  startup: {
    id: 'startup',
    name: '创业致富',
    description: '辞职创业，追求财富自由',
    minAge: 25,
    maxAge: 50,
    baseSuccessRate: 0.08,  // 创业九死一生
    successRatePerAttempt: 0.01,  // 但每次失败积累经验，成功率微增
    statRequirements: {
      money: 40,
      intelligence: 55,
    },
    statEffects: {
      onAttempt: {
        money: -25,      // 创业烧钱
        happiness: -3,
        health: -8,      // 创业熬人
      },
      onSuccess: {
        money: 50,
        happiness: 30,
        lifeState: 'business',
      },
      onFailure: {
        money: -30,
        happiness: -20,
      },
    },
    narratives: {
      start: [
        '你受够了打工，决定辞职创业。父母说你疯了，但你觉得自己能行。',
        '一个深夜的灵感让你兴奋不已，你决定all in这个项目。',
        '和几个前同事组了团队，租了共享办公室，开始了创业之旅。',
      ],
      attempt: [
        '第{attempt}次创业，你比之前更有经验了。但市场也变得更冷了。',
        '上一轮融的钱快烧完了，你又开始见投资人。这次准备得更充分。',
        '第一次创业失败后，你沉淀了两年，总结了教训，准备东山再起。',
        '身边人都在劝你"找份安稳工作"，但你不甘心。',
      ],
      success: [
        '公司终于盈利了！虽然还没有财务自由，但至少证明了模式跑得通。',
        '被大厂收购了。虽然不算完全的成功，但至少没让投资人亏钱。',
        '你的项目突然爆火，DAU翻倍。那些熬过的夜，终于变成了回报。',
      ],
      failure: [
        '资金链断裂，发不出工资。你看着员工陆续离职，那种无力感刻骨铭心。',
        '合伙人卷款跑路，你一个人扛下了所有债务。',
        '产品很好，但timing不对。市场教育成本太高，你撑不到春天了。',
        '政策和风向突变，你的行业成了"夕阳产业"。时也命也。',
      ],
      giveUp: [
        '三次创业失败后，你认命了。不是每个人都适合当老板，回去打工也挺好。',
        '欠了一屁股债，你不得不解散团队。创业这条路，走到这里为止。',
        '家人重病，你需要稳定收入。梦想很美好，但现实更沉重。',
      ],
      gapYear: [
        '公司倒闭后，你gap了一年。这段时间你做了 consulting，边还债边复盘。',
        '创业失败后，你出去旅行了一圈。回来后发现，打工也挺好的。',
        '你用半年时间写了一本创业失败实录，没想到成了小有名气的博主。',
      ],
    },
  },

  // 高考追求系统 - 决定大学命运的关键一战
  gaokao: {
    id: 'gaokao',
    name: '高考决战',
    description: '千军万马过独木桥，决定你能否上大学、上什么大学',
    minAge: 17,
    maxAge: 25,  // 复读多年也有可能
    baseSuccessRate: 0.70,  // 基础录取率（包含各种层次大学）
    successRatePerAttempt: -0.10,  // 复读压力越来越大
    statRequirements: {
      intelligence: 30,
      money: 10,  // 需要一些学习资料、补习费用
    },
    statEffects: {
      onAttempt: {
        money: -5,       // 资料费、补习费
        happiness: -10,  // 高三/复读的压力
        health: -5,      // 熬夜学习
      },
      onSuccess: {
        money: -8,       // 大学学费预支
        happiness: 15,
        lifeState: 'student',
      },
      onFailure: {
        money: -3,
        happiness: -20,  // 高考失利打击巨大
      },
    },
    narratives: {
      start: [
        '高三开学，教室后面挂上了倒计时牌。你看着那个数字，感觉像是生命倒计时。',
        '复读班的第一课，老师看着你们说："你们比应届生多了一年，不要辜负这份经历。"',
        '你转到了一所升学率更高的高中借读，这里的一切都比原来学校更压抑，但也更有效率。',
      ],
      attempt: [
        '这是你第{attempt}次走进高考考场，手心还是出汗了。',
        '复读的第{attempt}年，你的习题册比人还高，但能记住的还有多少？',
        '身边的同学换了一批又一批，你成了复读班的"老面孔"。',
        '高考前夜，你失眠到凌晨三点。复读的压力，比第一次大得多。',
      ],
      success: [
        '成绩出来，你超过一本线30分！虽然不是顶尖名校，但已经是最好的结果。',
        '经过{attempt}次高考，你终于考上了理想的大学。那些复读的日子，值得了。',
        '你踩着二本线进了一所普通本科。虽然不够耀眼，但至少不用再复读了。',
        '考上了！虽然不是第一志愿，但调剂的专业你还算满意。大学，我来了。',
      ],
      failure: [
        '成绩出来，你差本科线5分。复读了一年，分数还比上次低。你坐在电脑前，久久无法动弹。',
        '再次失利。看着父母失望的眼神，你突然不知道自己这些年在干什么。',
        '数学考砸了，连带着影响了所有科目。命运有时候就是这么残酷。',
        '你考上了，但学费是你家承担不起的数字。录取通知书在手，却像是判决书。',
      ],
      giveUp: [
        '三战失利后，你终于接受了自己可能不是读书的料。去读个专科，早点工作吧。',
        '家里负担不起第四年的复读费用了。你擦干眼泪，开始找工作。',
        '你意识到执念比失败更可怕。放下名校梦，去读个普通学校，也是一种解脱。',
      ],
      gapYear: [
        '高考失利后，你没有马上复读，而是先去打工了一年。这一年让你更清楚为什么要读书。',
        '你用一年时间自学编程，同时备考。最后虽然没考上名校，但收获了技能。',
        '你申请了延期入学，用这一年时间调整心态。复读不是唯一的路。',
      ],
    },
  },
};

// 开始一个新的追求
export function startPursuit(player: PlayerState, pursuitId: string): { 
  success: boolean; 
  pursuit?: OngoingPursuit; 
  message?: string;
} {
  const definition = PURSUITS[pursuitId];
  if (!definition) {
    return { success: false, message: '未知的目标' };
  }

  // 检查年龄
  if (player.age < definition.minAge || player.age > definition.maxAge) {
    return { 
      success: false, 
      message: `${definition.name}需要在${definition.minAge}-${definition.maxAge}岁之间` 
    };
  }

  // 检查是否已经在追求
  const existing = player.ongoingPursuits.find(p => p.id === pursuitId);
  if (existing && existing.status === 'ongoing') {
    return { 
      success: false, 
      message: `你已经在${existing.attempts > 0 ? '继续' : ''}追求${definition.name}了` 
    };
  }

  // 考研需要大学背景（包括应届生和已工作的往届生）
  if (pursuitId === 'postgrad' && !player.lifePath.some(p => p.includes('学生') || p.includes('大学') || p.includes('本科') || p.includes('student'))) {
    return {
      success: false,
      message: '考研需要本科毕业背景。请先完成大学学业，或考虑同等学力考研。'
    };
  }

  // 检查属性要求
  for (const [stat, minValue] of Object.entries(definition.statRequirements)) {
    const currentValue = player.stats[stat as keyof typeof player.stats];
    if (currentValue !== undefined && currentValue < minValue) {
      return { 
        success: false, 
        message: `你的${stat}不足，需要至少${minValue}才能尝试${definition.name}` 
      };
    }
  }

  const pursuit: OngoingPursuit = {
    id: pursuitId,
    name: definition.name,
    startedAt: player.age,
    attempts: 0,
    status: 'ongoing',
    baseSuccessRate: definition.baseSuccessRate,
    accumulatedStress: 0,
    history: [],
  };

  return { success: true, pursuit };
}

// 进行一次尝试
export function attemptPursuit(player: PlayerState, pursuit: OngoingPursuit): {
  success: boolean;
  narrative: string;
  statChanges: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>>;
  shouldContinue: boolean;  // 是否还能继续追求
  giveUpOption?: boolean;  // 是否显示放弃选项
  gapYearOption?: boolean; // 是否显示gap year选项
} {
  const pursuitId = pursuit.id;
  const definition = PURSUITS[pursuitId];
  if (!definition) {
    return { 
      success: false, 
      narrative: '未知的目标', 
      statChanges: {}, 
      shouldContinue: false 
    };
  }
  pursuit.attempts++;
  pursuit.lastAttemptAge = player.age;

  // 计算成功率 - 智力是核心因素
  // 基础成功率
  let successRate = definition.baseSuccessRate;

  // 每次尝试的疲惫惩罚（心态崩了）
  successRate += (pursuit.attempts - 1) * definition.successRatePerAttempt;

  // 智力加成（核心机制）
  // 智力50为基准，每高1点智力，成功率+0.8%；每低1点，成功率-0.8%
  // 智力90 vs 智力50，成功率差距32个百分点
  const intelligenceBonus = (player.stats.intelligence - 50) * 0.008;
  successRate += intelligenceBonus;

  // 经济支撑（次要因素）
  // 有钱可以报更好的班、更专注备考
  const moneyBonus = Math.max(-0.1, Math.min(0.15, (player.stats.money - 40) * 0.002));
  successRate += moneyBonus;

  // 健康状态影响（身体垮了学不进去）
  if (player.stats.health < 40) {
    successRate -= 0.15; // 身体差，效率大幅降低
  } else if (player.stats.health > 70) {
    successRate += 0.05; // 身体好，精力充沛
  }

  // 心情状态影响（焦虑影响发挥）
  if (player.stats.happiness < 30) {
    successRate -= 0.1; // 抑郁焦虑，学不进去
  }

  // 年龄越大考公越难
  if (pursuitId === 'civil_exam' && player.age > 28) {
    successRate -= 0.05;
  }

  // gap year 后心态好转
  if (pursuit.accumulatedStress > 20) {
    successRate -= 0.1;
  }

  // 确保成功率在合理范围
  successRate = Math.max(0.05, Math.min(0.8, successRate));

  // 判定结果
  const roll = Math.random();
  const isSuccess = roll < successRate;

  // 累积压力
  pursuit.accumulatedStress += 10;

  let narrative = '';
  let statChanges: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>> = {};
  let shouldContinue = true;
  let giveUpOption = false;
  let gapYearOption = false;

  if (isSuccess) {
    // 成功！
    pursuit.status = 'succeeded';
    narrative = getRandomNarrative(definition.narratives.success, pursuit.attempts);
    statChanges = { ...definition.statEffects.onSuccess };
    delete (statChanges as { lifeState?: string }).lifeState;
    shouldContinue = false;
    
    pursuit.history.push({
      age: player.age,
      result: 'passed',
      description: `第${pursuit.attempts}次尝试，成功上岸`,
    });
  } else {
    // 失败
    narrative = getRandomNarrative(definition.narratives.failure, pursuit.attempts);
    statChanges = { ...definition.statEffects.onFailure };
    
    pursuit.history.push({
      age: player.age,
      result: 'failed',
      description: `第${pursuit.attempts}次尝试，未能成功`,
    });

    // 检查是否还能继续
    const maxAttempts = pursuitId === 'civil_exam' ? 5 : pursuitId === 'postgrad' ? 4 : 3;
    
    if (pursuit.attempts >= maxAttempts) {
      // 次数用尽
      pursuit.status = 'abandoned';
      narrative += '\n\n' + getRandomNarrative(definition.narratives.giveUp, pursuit.attempts);
      shouldContinue = false;
    } else if (pursuit.accumulatedStress > 30 && Math.random() < 0.3) {
      // 压力太大，建议gap
      gapYearOption = true;
      narrative += '\n\n你感到身心俱疲，也许需要停下来休整一年...';
    } else if (pursuit.attempts >= 2 && Math.random() < 0.4) {
      // 多次失败，提供放弃选项
      giveUpOption = true;
      narrative += '\n\n多次失败后，你开始怀疑自己是否真的适合这条路...';
    }
  }

  // 加上尝试的消耗
  statChanges.money = (statChanges.money || 0) + definition.statEffects.onAttempt.money;
  statChanges.happiness = (statChanges.happiness || 0) + definition.statEffects.onAttempt.happiness;
  statChanges.health = (statChanges.health || 0) + definition.statEffects.onAttempt.health;

  return {
    success: isSuccess,
    narrative,
    statChanges,
    shouldContinue,
    giveUpOption,
    gapYearOption,
  };
}

// 选择gap year
export function takeGapYear(player: PlayerState, pursuit: OngoingPursuit): {
  narrative: string;
  statChanges: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>>;
} {
  const definition = PURSUITS[pursuit.id];
  
  pursuit.status = 'paused';
  pursuit.accumulatedStress = Math.max(0, pursuit.accumulatedStress - 20);
  
  const narrative = getRandomNarrative(definition?.narratives.gapYear || ['你休息了一年'], 1);
  
  return {
    narrative,
    statChanges: {
      money: -5,      // gap year 也要花钱
      happiness: 10,  // 心情恢复
      health: 5,      // 身体恢复
    },
  };
}

// 放弃追求
export function abandonPursuit(pursuit: OngoingPursuit): string {
  pursuit.status = 'abandoned';
  const definition = PURSUITS[pursuit.id];
  return getRandomNarrative(definition?.narratives.giveUp || ['你选择了放弃'], pursuit.attempts);
}

// 恢复追求（gap year 后）
export function resumePursuit(pursuit: OngoingPursuit): void {
  pursuit.status = 'ongoing';
}

// 辅助函数：获取随机叙事
function getRandomNarrative(narratives: string[], attemptCount: number): string {
  const template = narratives[Math.floor(Math.random() * narratives.length)];
  return template.replace(/{attempt}/g, attemptCount.toString());
}

// 获取进行中的追求
export function getOngoingPursuit(player: PlayerState): OngoingPursuit | undefined {
  return player.ongoingPursuits.find(p => p.status === 'ongoing');
}

// 生成选择选项
export function generatePursuitOptions(player: PlayerState, pursuitId: string): ChoiceOption[] {
  const pursuit = player.ongoingPursuits.find(p => p.id === pursuitId);
  const definition = PURSUITS[pursuitId];
  
  if (!pursuit || !definition) {
    return [];
  }

  const options: ChoiceOption[] = [
    {
      id: 'continue',
      text: pursuit.attempts === 0 ? '开始全力备考/准备' : '再战一次',
      description: pursuit.attempts === 0 
        ? '投入全部精力，背水一战' 
        : `第${pursuit.attempts + 1}次尝试，成败在此一举`,
      effects: definition.statEffects.onAttempt,
    },
  ];

  // 如果压力太大，显示gap year选项
  if (pursuit.accumulatedStress > 25) {
    options.push({
      id: 'gap_year',
      text: 'gap一年，调整状态',
      description: '暂时停下来，打工攒钱或旅行放松',
      effects: { money: -5, happiness: 10, health: 5 },
    });
  }

  // 如果失败多次，显示放弃选项
  if (pursuit.attempts >= 2) {
    options.push({
      id: 'give_up',
      text: '认命，换条路走',
      description: '不是每个人都适合这条路，及时止损也是一种智慧',
      effects: { happiness: -5 },
      lifeState: 'worker',
    });
  }

  // 考公/考研特有选项：边工作边准备
  if ((pursuitId === 'civil_exam' || pursuitId === 'postgrad') && pursuit.attempts >= 1) {
    options.push({
      id: 'part_time',
      text: '先找工作，在职备考',
      description: '不再脱产，经济压力小但精力分散',
      effects: { money: 10, happiness: -3, health: -5 },
      lifeState: 'worker',
    });
  }

  return options;
}
