/**
 * AI 叙事服务 - 关键节点AI驱动，普通年份本地叙事
 * 
 * 设计原则：
 * 1. 普通年份：使用本地预设的吐槽叙事模板，流畅快速
 * 2. 关键节点（6/12/15/18/22/28/35/45/60岁）：调用AI生成重大抉择场景
 * 3. AI返回结构化的抉择内容（吐槽文案 + 选项 + 属性影响）
 */

import { PlayerState, ChoiceOption, LifeStateType, PlayerStats, OngoingPursuit, InputScene } from './types';
import { FAMILY_NAMES } from './familySystem';
import { getEraByBirthYear, getEraEvent, getEraOpportunity } from './eraSystem';
import { LIFE_STATE_NAMES, STATE_EFFECTS } from './lifeState';
import { 
  attemptPursuit, 
  generatePursuitOptions, 
  getOngoingPursuit,
  PURSUITS 
} from './pursuitSystem';
import { getSceneForAge } from './inputProcessor';

// 关键年龄节点 - 调用AI生成重大抉择
export const KEY_DECISION_AGES = [6, 12, 15, 18, 22, 28, 35, 45, 60];

// AI 返回的叙事结果
export interface AINarrativeResult {
  narrative: string;
  eventTitle?: string;
  eventDescription?: string;
  statChanges: Partial<PlayerStats>;
  newLifeState?: LifeStateType;
  interaction?: {
    type: 'choice' | 'input';
    options?: ChoiceOption[];
    inputHint?: string;
    sceneId: string;
  };
  ending?: {
    type: 'death' | 'enlightenment' | 'breakdown' | 'natural';
    reason: string;
  };
  tags: string[];
}

// AI 服务配置
interface AIServiceConfig {
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  mockMode: boolean;
}

// 默认配置 - 阿里云百炼API（无 key 时自动走本地/模拟叙事）
let aiConfig: AIServiceConfig = {
  mockMode: false,
  apiKey: process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY,
  apiEndpoint: process.env.NEXT_PUBLIC_DASHSCOPE_API_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: process.env.NEXT_PUBLIC_DASHSCOPE_MODEL || 'qwen-flash-character'
};

export function configureAI(config: Partial<AIServiceConfig>) {
  aiConfig = { ...aiConfig, ...config };
}

/**
 * 判断是否为关键决策年龄
 */
export function isKeyDecisionAge(age: number): boolean {
  return KEY_DECISION_AGES.includes(age);
}

/**
 * 获取关键节点的场景描述
 */
function getKeyDecisionContext(age: number, gender: 'male' | 'female', alreadyDroppedOut: boolean = false): { title: string; context: string } {
  const contexts: Record<number, { title: string; context: string; femaleContext?: string; dropoutTitle?: string; dropoutContext?: string }> = {
    6: {
      title: '小学入学',
      context: '背着新书包踏入校门，人生第一次面对集体生活。'
    },
    12: {
      title: '小升初',
      context: '告别童年，即将进入青春期，学业压力开始增加。'
    },
    15: alreadyDroppedOut ? {
      title: '辍学后的人生',
      context: '没有中考的你，已经在社会上摸爬滚打。下一步该怎么走？',
      dropoutTitle: '辍学后的人生',
      dropoutContext: '没有中考的你，已经在社会上摸爬滚打。下一步该怎么走？'
    } : {
      title: '中考抉择',
      context: '人生的第一次大考，决定你能否进入好的高中。',
      dropoutTitle: '辍学后的人生',
      dropoutContext: '没有中考的你，已经在社会上摸爬滚打。下一步该怎么走？'
    },
    18: {
      title: '高考分水岭',
      context: '十年寒窗，一朝定胜负。大学决定你的起点。'
    },
    22: {
      title: '毕业抉择',
      context: '大学四年结束，站在人生的十字路口。',
      femaleContext: '大学毕业，面临职场性别偏见和婚恋压力的双重考验。'
    },
    28: {
      title: '婚恋压力',
      context: '到了适婚年龄，周围人都在催婚，你怎么想？',
      femaleContext: '28岁，职场和婚恋的双重压力让你喘不过气。'
    },
    35: {
      title: '中年危机',
      context: '职场开始卡年龄，你开始怀疑人生。',
      femaleContext: '35岁，职场瓶颈和生育焦虑同时袭来。'
    },
    45: {
      title: '人生中场',
      context: '事业遇到瓶颈，健康开始走下坡路。'
    },
    60: {
      title: '退休时刻',
      context: '工作生涯结束，准备进入人生的下半场。'
    }
  };
  
  const ctx = contexts[age];
  if (!ctx) return { title: '人生抉择', context: '一个重要的时刻。' };
  
  return {
    title: ctx.title,
    context: gender === 'female' && ctx.femaleContext ? ctx.femaleContext : ctx.context
  };
}

/**
 * 主API：获取年度叙事
 * - 关键节点：调用AI生成
 * - 普通年份：使用本地模拟叙事
 * - 进行中的追求：使用追求系统
 */
export async function getAINarrative(
  playerState: PlayerState,
  yearContext: {
    currentYear: number;
    recentEvents: string[];
    lifePathSummary: string;
  }
): Promise<AINarrativeResult> {
  const age = playerState.age;
  
  // 检查是否有进行中的追求目标
  const ongoingPursuit = playerState.ongoingPursuits?.find(p => p.status === 'ongoing');
  if (ongoingPursuit) {
    // 有进行中的追求，使用追求系统生成叙事
    return await generatePursuitNarrative(playerState, ongoingPursuit);
  }
  
  // 关键节点：调用AI生成重大抉择
  if (isKeyDecisionAge(age)) {
    return await generateKeyDecisionNarrative(playerState, yearContext);
  }
  
  // 普通年份：使用本地模拟叙事
  return generateLocalNarrative(playerState, yearContext);
}

/**
 * 生成追求目标的叙事（考公、考研、找工作等）
 */
async function generatePursuitNarrative(
  player: PlayerState,
  pursuit: OngoingPursuit
): Promise<AINarrativeResult> {
  console.log(`[${player.age}岁] 追求目标: ${pursuit.name} - 第${pursuit.attempts + 1}次尝试`);
  
  // 进行尝试
  const result = attemptPursuit(player, pursuit);
  
  // 生成选项
  const options = generatePursuitOptions(player, pursuit.id);
  
  return {
    narrative: result.narrative,
    eventTitle: `${pursuit.name} · 第${pursuit.attempts}次尝试`,
    statChanges: result.statChanges,
    newLifeState: result.success ? PURSUITS[pursuit.id]?.statEffects.onSuccess.lifeState as LifeStateType : undefined,
    interaction: result.shouldContinue ? {
      type: 'choice',
      sceneId: `${pursuit.id}_${pursuit.attempts}`,
      options: options,
    } : undefined,
    tags: [pursuit.id, result.success ? 'success' : 'failure', `attempt_${pursuit.attempts}`],
  };
}

/**
 * 调用AI生成关键节点叙事
 */
async function generateKeyDecisionNarrative(
  player: PlayerState,
  yearContext: {
    currentYear: number;
    recentEvents: string[];
    lifePathSummary: string;
  }
): Promise<AINarrativeResult> {
  const prompt = buildKeyDecisionPrompt(player, yearContext);
  
  if (aiConfig.mockMode || !aiConfig.apiKey) {
    console.log(`[${player.age}岁] 关键节点 - 使用模拟模式`);
    return mockKeyDecisionNarrative(player);
  }

  try {
    console.log(`[${player.age}岁] 关键节点 - 调用AI API`);
    const response = await fetch(aiConfig.apiEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是「人生重开模拟器」的AI叙事引擎，专门生成关键人生节点的吐槽风格抉择场景。你的回复必须是合法的JSON格式。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log(`[关键节点] AI原始返回:`, content);
    
    // 解析JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    console.log(`[关键节点] 解析后数据:`, parsed);
    
    const result = validateAndNormalizeResult(parsed, player.age);
    console.log(`[关键节点] 规范化结果 - narrative:`, result.narrative);
    console.log(`[关键节点] 规范化结果 - interaction:`, result.interaction);
    return result;
  } catch (error) {
    console.error('AI API调用失败，回退到模拟模式:', error);
    return mockKeyDecisionNarrative(player);
  }
}

/**
 * 构建关键节点的prompt
 */
function buildKeyDecisionPrompt(
  player: PlayerState,
  yearContext: {
    currentYear: number;
    recentEvents: string[];
    lifePathSummary: string;
  }
): string {
  const age = player.age;
  const birthYear = (player as any).birthYear || 1990;
  const actualYear = birthYear + age;
  const familyName = FAMILY_NAMES[player.birthFamily.type];
  
  // 检查是否已经辍学
  const alreadyDroppedOut = player.majorChoices.some(c => 
    c.choiceId === 'drop_out' || c.choiceId === 'work_direct' || c.lifeState === 'worker' || c.lifeState === 'delinquent'
  );
  
  const decisionCtx = getKeyDecisionContext(age, player.gender, alreadyDroppedOut);
  const era = getEraByBirthYear(birthYear);
  
  // Get era events
  const eraEvent = getEraEvent(birthYear, age);
  const eraOpportunity = getEraOpportunity(birthYear, age);
  
  // Era context
  let eraContext = `${birthYear}年出生的${era.name}，${era.description}`;
  if (eraEvent) {
    eraContext += `\n${actualYear}年（你${age}岁）：${eraEvent.title} - ${eraEvent.description}`;
  }
  if (eraOpportunity) {
    eraContext += `\n时代红利：${eraOpportunity.name} - ${eraOpportunity.description}`;
  }
  
  return `[人生重开模拟器 - 关键节点叙事]

玩家信息：
- 姓名：${(player as any).name || '无名氏'}
- 出生年份：${birthYear}年
- 当前年龄：${age}岁（${actualYear}年）
- 性别：${player.gender === 'male' ? '男' : '女'}
- 出身：${familyName}

时代背景：
${eraContext}

当前状态：
- 人生状态：${LIFE_STATE_NAMES[player.lifeState]}
- 属性：财力${player.stats.money}、智力${player.stats.intelligence}、外貌${player.stats.appearance}、健康${player.stats.health}、快乐${player.stats.happiness}

关键节点：${decisionCtx.title}
背景：${decisionCtx.context}

请结合上述时代背景，生成这个关键节点的吐槽风格叙事和3个选项。整体口吻要像一个见过世面的中式损友：嘴损但不刻薄，先讲事实，再补一刀，细节要有中国生活感（家长群、编制、房贷、相亲、年终奖这类语境都可以自然出现）。选项要体现时代特征，而且每个选项都要让玩家一眼看懂代价与气质。

返回JSON格式：
{
  "narrative": "吐槽风格的叙事文案",
  "eventTitle": "事件标题",
  "options": [
    {"id": "option1", "text": "选项文字", "description": "描述", "effects": {"money": 0}}
  ],
  "tags": ["标签"]
}`;
}

/**
 * 本地生成普通年份叙事
 */
function generateLocalNarrative(
  player: PlayerState,
  yearContext: {
    currentYear: number;
    recentEvents: string[];
    lifePathSummary: string;
  }
): AINarrativeResult {
  const age = player.age;
  const isFemale = player.gender === 'female';
  const money = player.stats.money;
  const lifeState = player.lifeState;
  
  // 从本地库选择叙事（传入历史选择以过滤不符合的叙事）
  const narratives = getLocalNarratives(age, isFemale, money, lifeState, player.majorChoices);
  
  // 根据最近的事件过滤掉相似的叙事（避免相邻年份重复）
  const recentNarratives = yearContext.recentEvents || [];
  const availableNarratives = narratives.filter(n => {
    // 检查是否与最近3年的叙事相似（前20个字符相同则认为是相似叙事）
    const nHash = hashNarrative(n);
    return !recentNarratives.some(recent => hashNarrative(recent) === nHash);
  });
  
  // 如果所有叙事都用过了，重置或使用全部
  const candidates = availableNarratives.length > 0 ? availableNarratives : narratives;
  const narrative = candidates[Math.floor(Math.random() * candidates.length)];
  
  // 生成本地属性变化
  const statChanges = generateLocalStatChanges(age, money, lifeState);
  
  // 检查是否触发状态变化
  const newLifeState = checkLocalStateTransition(player);
  
  // 检查是否触发结局
  const ending = checkLocalEnding(player);
  
  return {
    narrative,
    statChanges,
    newLifeState,
    ending,
    tags: generateLocalTags(age, lifeState, money)
  };
}

/**
 * 生成叙事的简单哈希，用于去重
 */
function hashNarrative(narrative: string): string {
  // 使用叙事的前20个字符作为简单哈希
  return narrative.slice(0, 20).replace(/\s/g, '');
}

/**
 * 本地叙事库
 */
function getLocalNarratives(
  age: number, 
  isFemale: boolean, 
  money: number,
  lifeState: string,
  majorChoices: { age: number; sceneId: string; choiceId: string; description: string; }[]
): string[] {
  // 检查玩家的重大选择
  const choseDropOut = majorChoices.some(c => 
    c.choiceId === 'drop_out' || c.choiceId === 'work_direct' || c.choiceId === 'vocational' || 
    c.choiceId === 'gang' || c.choiceId === 'keep_working' || c.choiceId === 'learn_skill' ||
    c.description.includes('不读') || c.description.includes('辍学') || c.description.includes('技校') || 
    c.description.includes('专科') || c.description.includes('打工')
  );
  
  // 检查是否选择了上大学（gaokao）
  const choseUniversity = majorChoices.some(c => 
    c.choiceId === 'gaokao' || c.description.includes('高考') || c.description.includes('大学')
  );
  const choseGang = majorChoices.some(c => 
    c.choiceId === 'gang' || c.choiceId.includes('gang')
  );
  const isWorker = lifeState === 'worker' || lifeState === 'business';
  // 按年龄段分类的本地叙事
  const stageNarratives: Record<string, string[]> = {
    infant: [
      age === 1 
        ? `${age}岁这年满周岁，家里办了抓周仪式。你在算盘和画笔之间摸了半天，最后一把抓住了钱。亲戚们当场点头：这孩子，起码饿不死。`
        : `${age}岁的你除了吃奶就是睡觉，唯一的 KPI 是别半夜把全家都叫醒。很遗憾，你超额完成了。`,
      age === 1
        ? `满${age}岁了，你会走了，也会叫爸妈了。抓周时你左手抓书右手抓钱，大人们笑着说：又要读书又要赚钱，这孩子以后有得忙。`
        : `${age}岁的你学会了翻身和爬行，家里人看着你满地乱窜，已经开始脑补你以后上学鸡飞狗跳的样子。`,
      age === 1
        ? `${age}岁生日，长辈们摆了一地东西让你抓周。你径直爬向了最远的那个——馒头。大家笑得前仰后合：这孩子，以后是个干饭人。`
        : `${age}岁的你开始对周围世界产生好奇，虽然还不会说话，但已经会用哭声表达各种需求了。`,
      `${age}岁的你，唯一的技能点是卖萌。但就是这个技能，让全家人心甘情愿为你加班赚钱。`
    ],
    preschool: [
      `${age}岁的你在幼儿园学会了唱歌跳舞，虽然五音不全，但老师说你很有表现力。`,
      '幼儿园的日子很轻松，唯一的烦恼是午睡时睡不着，以及隔壁桌的小朋友总是抢你的玩具。',
      '你开始有了第一个“最好的朋友”，虽然这个头衔每周都会换人。',
      `${age}岁的你第一次参加文艺汇演，穿着并不合身的演出服，在台上认真地表演了《小星星》。`,
      `${age}岁的你在幼儿园学会了用勺子吃饭，虽然经常把饭菜洒在衣服上，但老师说这是成长的必经之路。`,
      '你开始对动画片产生浓厚兴趣，每天最期待的就是放学回家看半小时的动画片。',
      `${age}岁这年，你学会了骑小三轮车，虽然经常摔倒，但每次都能自己爬起来继续骑。`,
      '幼儿园老师教你们背古诗，你只会背“床前明月光”，而且每次都把“疑是地上霜”说成“疑是地上糖”。',
      `${age}岁的你，最大的烦恼是妈妈不让你吃糖，最大的快乐是奶奶偷偷给你塞糖。`
    ],
    child: [
      age === 6 ? `${age}岁，终于上小学了。你背着新书包，觉得自己长大了。班主任看着你期待的眼神，默默叹了口气——这届学生不好带啊。` :
      age === 7 ? `${age}岁，一年级下学期，你已经习惯了每天早起上学。拼音和算术成了你的新朋友，虽然偶尔会搞混b和d。` :
      age === 8 ? `${age}岁，二年级。你开始有了固定的玩伴，下课铃一响就冲向操场。学习和玩耍之间，你毫不犹豫地选择了后者。` :
      age === 9 ? `${age}岁，三年级。老师开始布置作文，你第一次为凑够300字而绞尽脑汁。家长会的阴影开始笼罩你的周末。` :
      age === 10 ? `${age}岁，四年级。你开始意识到“别人家的孩子”不是文学形象，而是真实存在并且稳定伤害你自尊的人。` :
      age === 11 ? `${age}岁，五年级。小升初的压力隐隐传来，课外补习班开始侵占你的周末。你不明白为什么分数那么重要。` :
      age === 12 ? `${age}岁，六年级。毕业倒计时开始，你和同学们交换QQ号，以为友谊可以天长地久。中考的阴影已经在前方招手。` :
      `${age}岁，小学的日子作业不算多，比较多的是家长群里此起彼伏的“收到”。你还小，但已经感受到集体生活的压迫感。`,
      
      '童年的夏天，冰棍还便宜，快乐也来得简单。唯一的问题是，暑假作业总能在最后三天突然长出灵魂。',
      
      `${age}岁的你，在作业和玩耍之间寻找平衡，偶尔作弊，偶尔偷懒，童年就是这样磕磕绊绊地向前。`,
      
      age === 8 ? `${age}岁的你，课间操时偷偷注意的人就站在隔壁班，你假装不经意地偷看，心里像有只小鹿在乱撞。` :
      age === 9 ? `${age}岁的你，开始对班上的某个人产生好感，虽然不懂什么是喜欢，但就是想和TA多说几句话。` :
      age === 10 ? `${age}岁的你，第一次收到异性递来的纸条，心跳加速了一整天，结果发现是借橡皮的。` :
      `${age}岁的你，开始有了自己的小秘密，日记本上锁，手机设密码，父母觉得你在疏远，你觉得他们在控制。`,
      
      age === 11 ? `${age}岁的你，开始有了自己的小秘密，日记本上锁，手机设密码，父母觉得你在疏远，你觉得他们在控制。` : `${age}岁的你，在作业和玩耍之间寻找平衡，偶尔作弊，偶尔偷懒，童年就是这样磕磕绊绊地向前。`,
      
      `${age}岁的你，第一次考试作弊，手心全是汗，虽然没被发现，但你决定以后还是靠自己。`,
      `${age}岁这年，你因为没完成作业被老师批评，哭着回家却发现爸妈比你还着急。`,
      `${age}岁的你，学会了骑自行车，摔了好几次，但每次都能爬起来继续，这就是成长吧。`,
      `${age}岁，你第一次参加夏令营，离开家一个星期，想家想得直哭，但也交到了新朋友。`,
      `${age}岁的你，开始帮家里做家务，虽然做得不好，但妈妈说这是培养责任心的开始。`,
      `${age}岁，你在学校运动会上拿了第一名，爸妈骄傲得逢人就夸，你觉得自己像个英雄。`,
      `${age}岁的你，第一次体验到考试考砸的感觉，虽然很难过，但也明白了努力的重要性。`,
      `${age}岁，你开始学一门乐器，虽然练习很枯燥，但每次弹出完整的曲子都很有成就感。`,
      `${age}岁的你，第一次和朋友闹翻，冷战了好几天，最后主动道歉和好，学会了珍惜友谊。`
    ],
    middleSchool: [
      age === 12 ? `${age}岁，小升初。你以为只是换个学校。殊不知，这是内卷的开始。` :
      age === 13 ? `${age}岁，初一。小升初的暑假转瞬即逝，你发现初中的课程突然变难了，小学时的好成绩在这里只是平均水平。` :
      age === 14 ? `${age}岁，初二。你开始有了喜欢的科目，也有了讨厌的老师。偏科的种子在这个时期悄悄种下。` :
      age === 15 ? `${age}岁，初三。中考前夜，你第一次认真失眠。不是突然热爱学习，而是猛然发现这三年好像都在神游。` :
      `${age}岁，初中的日子。你第一次意识到，有些同学家里很有钱，有些同学家里很穷，而你恰好夹在中间。`,
      
      `${age}岁的你，身体开始发育，声音变了，脸上长痘了，照镜子的时间变长了。`,
      
      isFemale
        ? `${age}岁的你，作为女生，开始不断听见“女孩子要稳一点”。你表面点头，心里已经把这句话打包丢进了时代废纸篓。`
        : `${age}岁的你，作为男生，总被教育“男孩子要扛事”。可你连周测都扛不住，更别说人生了。`,
        
      `${age}岁的你，第一次暗恋班上的同学，虽然不敢表白，但每天能看到TA就觉得很开心。`,
      `${age}岁，你因为偏科被家长批评，虽然委屈，但也开始努力补齐短板。`,
      `${age}岁的你，加入了学校的社团，虽然占用学习时间，但找到了志同道合的朋友。`,
      `${age}岁，你第一次体验到期末考试的焦虑，那种被排名支配的恐惧让你彻夜难眠。`,
      `${age}岁的你，开始对未来有了模糊的想法，虽然还不确定，但已经不想完全按照父母的规划走了。`,
      `${age}岁，你和最好的朋友闹了矛盾，虽然后来和好了，但那种被背叛的感觉让你久久难忘。`,
      `${age}岁的你，第一次尝试反抗父母的安排，虽然最后妥协了，但那种叛逆的感觉让你觉得自己长大了。`
    ],
    highSchool: choseDropOut ? [
      // 如果选择了辍学，16-18岁显示打工叙事
      age === 16 ? `${age}岁，同龄人还在高中教室刷题，你已经在工厂流水线或者餐厅后厨挥洒汗水了。累，但至少能养活自己。` :
      age === 17 ? `${age}岁，曾经的同学备战高考，你在社会上被人呼来喝去。没有学历的敲门砖，每一步都比旁人艰难。` :
      age === 18 ? `${age}岁，高考那天你在工作，看着新闻里关于高考的报道，心里五味杂陈。这是你选择的路，但偶尔也会想，如果当初...` :
      `${age}岁，没有高中文凭的你，只能做些体力活或者底层工作。你学会了忍耐，也学会了察言观色。`,
      
      `${age}岁，社会的毒打比老师的批评更疼，但也更直接。你开始明白，人生没有标准答案，但有代价。`,
      
      `${age}岁，看着曾经的同学即将进入大学，你说不上是羡慕还是释然。至少，你比他们更早知道了钱难赚、屎难吃。`,
      
      `${age}岁的你，第一次领到工资，虽然不多，但花自己赚的钱感觉和父母给的不一样。`,
      `${age}岁，你在工作中犯了错被老板骂，虽然委屈，但也明白这就是社会的规则。`,
      `${age}岁的你，开始后悔当初辍学的决定，但你知道人生没有回头路，只能往前走。`,
      `${age}岁，你在工作中认识了新朋友，虽然背景不同，但大家都在为了生活努力。`,
      `${age}岁的你，第一次给父母买东西，虽然不贵，但看到他们的笑容你觉得一切都值得。`
    ] : [
      // 正常上高中
      age === 16 ? `${age}岁，高一。中考的硝烟刚散，你还沉浸在考上高中的喜悦中，却发现身边的同学都是各个初中的尖子生。` :
      age === 17 ? `${age}岁，高二。文理分科让你第一次认真思考：我究竟想要什么？父母说理科好就业，你说文科有意思。` :
      age === 18 ? `${age}岁，高三。高考倒计时牌上的数字一天天减少，你的焦虑指数一天天增加。` :
      `${age}岁，高中生活就是一场持久战，早起晚睡，试卷成山。`,
      
      `${age}岁的你开始偷偷喜欢班上的某个人。暗恋这件事，本质上就是一场没有合同、没有回报、还全靠脑补的个人项目。`,
      
      '高中生活就是一场持久战，早起晚睡，试卷成山。你开始理解为什么大人总说“学生时代最幸福”——因为他们已经忘了有多累。',
      
      `${age}岁的你，第一次月考考砸了，躲在房间里哭了一晚上，第二天还是要照常去上课。`,
      `${age}岁，你在晚自习时偷偷看小说，被班主任抓个正着，书被没收了，心也碎了。`,
      `${age}岁的你，开始思考未来的方向，虽然还不确定，但已经不想完全按照父母的期望走了。`,
      `${age}岁，你和最好的朋友约定要考同一所大学，虽然不知道能不能实现，但那种承诺让你觉得很温暖。`,
      `${age}岁的你，第一次体验到熬夜刷题的感觉，咖啡和浓茶成了你的好伙伴。`,
      `${age}岁，你在运动会上为班级争光，虽然学习很重要，但那种集体的荣誉感让你觉得很骄傲。`,
      `${age}岁的你，开始理解父母的不容易，虽然还是有代沟，但你已经开始试着体谅他们了。`
    ],
    college: (choseDropOut || lifeState === 'worker' || lifeState === 'business' || lifeState === 'criminal' || lifeState === 'delinquent') && !choseUniversity ? [
      // 如果选择了辍学/直接工作，显示打工叙事而不是大学叙事
      age === 19 ? `${age}岁，同龄人还在高考，你已经在社会上摸爬滚打了。没有学历这块敲门砖，你只能从最底层做起。` :
      age === 20 ? `${age}岁，曾经的同学在朋友圈晒大学宿舍，你在晒加班的夜景。你们走上了不同的路，谁对谁错，还不好说。` :
      age === 21 ? `${age}岁，三年的工作经验让你比应届生更懂人情世故，但你也明白，有些门永远对你是关闭的。` :
      age === 22 ? `${age}岁，看着大学生们为毕业论文发愁，你庆幸自己不用写论文，但也羡慕他们有可以选择的余地。` :
      `${age}岁，你在社会里学会了生存，虽然辛苦，但至少经济独立了。`,
      
      `${age}岁，没有大学文凭的你，每换一次工作都要付出比别人更多的努力来证明自己的能力。`,
      
      `${age}岁，同学聚会你很少去，不是不想去，是怕话题聊不到一起。`,
      
      isFemale
        ? `${age}岁，亲戚给你介绍对象，对方问你是哪个学校的，你说"社会大学"，场面一度很尴尬。`
        : `${age}岁，父亲拍着你的肩膀说"该扛起家了"。你看了眼银行卡余额，觉得这个家最好还是先自己站稳。`
    ] : [
      // 正常上大学
      age === 19 ? `${age}岁，大一。高考结束那天，你以为人生终于自由了。后来你发现，志愿填报只是第一次被命运要求自己签字。` :
      age === 20 ? `${age}岁，大二。你已经学会了熬夜、外卖、做 PPT 和临时抱佛脚。至于专业知识，只能说考试前确实短暂拥有过。` :
      age === 21 ? `${age}岁，大三。考研还是就业？这个选择题比高考还难。你看着身边同学一个个有了方向，自己却还在原地打转。` :
      age === 22 ? `${age}岁，大四。毕业论文让你明白，复制粘贴也是一门技术。` :
      `${age}岁，大学的日子。你在自由与迷茫之间摇摆，享受着最后的校园时光。`,
      
      isFemale
        ? `${age}岁，亲戚开始旁敲侧击问你有没有对象，仿佛毕业证和结婚证之间只隔了一个春节。`
        : `${age}岁，父亲拍着你的肩膀说“该扛起家了”。你看了眼银行卡余额，觉得这个家最好还是先自己站稳。`,
      
      `${age}岁，第一份工作到手，工资看着像希望，扣完房租像行为艺术。你终于理解什么叫“上班只是活着的一种方式”。`,
      
      `${age}岁，同学聚会有人晒娃有人晒车，你低头晒工位和加班记录。大家都在奔赴未来，只是你的未来带着工卡。`
    ],
    youngAdult: [
      `${age}岁，初入职场。你以为终于能自己赚钱了，结果发现工资的一半交给房东，另一半交给外卖平台。`,
      `${age}岁，开始被催婚。你妈说"不小了"，你说"还小呢"，你们在"小"的定义上产生了代沟。`,
      isFemale
        ? `${age}岁，职场新人。你学会了在会议室里微笑点头，在茶水间里吐槽抱怨。这就是职场生存法则。`
        : `${age}岁，职场新人。你开始明白"加班"不是奋斗，是福报——虽然这福报你并不想要。`,
      `${age}岁，第一次独立租房。房东说"押一付三"，你说"能不能月付"，最后你们各退一步——你押一付二。`,
      `${age}岁，开始养生。啤酒里加枸杞，可乐里放党参。朋克养生，主打一个心理安慰。`,
      `${age}岁，社交圈开始固化。新朋友交不到，老朋友聚不了。你的周末 increasingly 与手机和外卖为伴。`
    ],
    adult: [
      `${age}岁，婚恋突然成了年度 KPI。相亲对象先问房和车，仿佛感情是招标流程，心动只是补充材料。`,
      `${age}岁生日那天，你对着镜子数白头发。青春不是慢慢离开的，是趁你开会的时候悄悄撤回了。`,
      '第一次买房，签完字那一刻你突然很成熟。毕竟从今天起，你不仅属于自己，也属于每月那条自动扣款短信。',
      isFemale
        ? '在职场里，你发现自己要多做一点、多扛一点、多证明一点，最后才能勉强换来一句“还不错”。'
        : '到了这个年纪，你的发际线和理想都开始后撤。只不过前者人人看得见，后者你自己最清楚。'
    ],
    middleAge: [
      `${age}岁以后，你突然对球鞋、露营、辞职创业产生浓厚兴趣。说白了，不是爱好变多了，是人开始试图和生活讨价还价。`,
      '孩子一上学，你才明白辅导作业比上班更考验情绪稳定。原来真正的职场，不在公司，在餐桌边。',
      '父母去医院的次数慢慢变多，你才第一次真正意识到：原来那个一直替你扛事的人，也会老。',
      '体检报告出来后，你盯着一排异常指标沉默良久。年轻时熬的夜、吃的外卖、硬扛的情绪，医院都替你记着账。'
    ],
    elderly: [
      '退休第一天，你站在阳台发呆，突然不知道该几点焦虑。忙了一辈子的人，最难适应的往往不是清闲，是没人催。',
      '孙辈围着你问以前没有手机怎么活，你笑了笑。那时候日子也难，但至少没那么多消息提示音。',
      '老伴在厨房忙，你在阳台浇花。年轻时以为轰轰烈烈才算人生，后来才懂，平平安安吃完一顿饭也很难得。'
    ]
  };

  // 根据金钱状态的特殊叙事
  const moneyNarratives: Record<string, string[]> = {
    broke: [
      '钱包比脸还干净，但你已经习惯了。贫穷限制不了你的想象力，只限制了你的外卖选择。',
      '月底了，你看着银行卡余额，决定把这周叫做"辟谷周"。'
    ],
    rich: [
      '财务自由的好处是，你可以对不喜欢的工作说不。坏处是，你发现自己还是喜欢工作——因为闲得慌。',
      '钱能解决99%的烦恼，剩下的1%是因为钱还不够多。'
    ]
  };

  // 选择阶段 - 更符合中国教育体系的年龄划分
  let stage = 'normal';
  if (age <= 3) stage = 'infant';           // 0-3岁：婴幼儿
  else if (age <= 5) stage = 'preschool';   // 4-5岁：学龄前（幼儿园）
  else if (age <= 11) stage = 'child';      // 6-11岁：小学阶段（1-6年级）
  else if (age <= 15) stage = 'middleSchool'; // 12-15岁：初中阶段（小升初+初一至初三）
  else if (age <= 18) stage = 'highSchool'; // 16-18岁：高中阶段
  else if (age <= 22) stage = 'college';    // 19-22岁：大学阶段
  else if (age <= 30) stage = 'youngAdult'; // 23-30岁：初入职场
  else if (age <= 45) stage = 'adult';      // 31-45岁：中年
  else if (age <= 60) stage = 'middleAge';  // 46-60岁：中老年
  else stage = 'elderly';                   // 60岁+：老年

  let candidates = stageNarratives[stage] || stageNarratives.youngAdult;
  
  // 根据金钱状态追加叙事
  if (money < 20) candidates = [...candidates, ...moneyNarratives.broke];
  if (money > 80) candidates = [...candidates, ...moneyNarratives.rich];

  return candidates;
}

/**
 * 生成本地属性变化
 */
function generateLocalStatChanges(
  age: number, 
  money: number, 
  lifeState: string
): Partial<PlayerStats> {
  const changes: Partial<PlayerStats> = {};
  
  // 年龄对健康的影响
  if (age > 50) changes.health = -Math.floor(Math.random() * 3) - 1;
  else if (age < 20) changes.health = Math.floor(Math.random() * 3);
  else changes.health = Math.floor(Math.random() * 3) - 1;
  
  // 金钱对快乐的影响
  if (money < 20) changes.happiness = -Math.floor(Math.random() * 5);
  else if (money > 70) changes.happiness = Math.floor(Math.random() * 3) + 1;
  else changes.happiness = Math.floor(Math.random() * 3) - 1;
  
  // 智力随年龄变化（学龄期增长最快）
  if (age >= 6 && age <= 22) changes.intelligence = Math.floor(Math.random() * 3) + 1; // 小学到大学快速增长
  else if (age > 60) changes.intelligence = -Math.floor(Math.random() * 2);
  
  // 外貌随年龄变化
  if (age >= 14 && age <= 28) changes.appearance = Math.floor(Math.random() * 2);
  else if (age > 40) changes.appearance = -Math.floor(Math.random() * 2) - 1;
  
  // 金钱的自然变化（工作收入或消耗）
  const lifeStateEffects: Record<string, number> = {
    worker: 3,
    business: Math.random() > 0.5 ? 8 : -5,
    civil: 2,
    beggar: -2,
    criminal: Math.random() > 0.7 ? 10 : -10,
    freelancer: Math.floor(Math.random() * 5),
    student: -1,
    retired: -3,
    normal: 0
  };
  
  changes.money = (lifeStateEffects[lifeState] || 0) + Math.floor(Math.random() * 3) - 1;
  
  return changes;
}

/**
 * 检查本地状态转换
 */
function checkLocalStateTransition(player: PlayerState): LifeStateType | undefined {
  const { money, happiness, health } = player.stats;
  const age = player.age;
  const current = player.lifeState;
  
  if (health <= 0) return undefined;
  if (money < -30) return 'bankrupt';
  if (money < -10 && money >= -30) return 'debt';
  if (money < -20 && happiness < 20) return 'criminal';
  if (money < 0 && money >= -10) return 'beggar';
  if (happiness < 10) return 'addict';
  if (happiness < 30 && money >= 0 && age > 30 && age < 70) return 'hermit';
  if (age >= 70) return 'elder';
  if (age >= 60 && ['worker', 'civil', 'business'].includes(current)) return 'retired';
  
  return undefined;
}

/**
 * 检查是否触发结局
 */
function checkLocalEnding(player: PlayerState) {
  const { health, happiness } = player.stats;
  const age = player.age;
  
  // 最早60岁才能结束游戏
  if (age < 60) {
    return undefined;
  }
  
  if (health <= 0) {
    return { type: 'death' as const, reason: age > 70 ? '寿终正寝' : '积劳成疾' };
  }
  if (happiness >= 100) {
    return { type: 'enlightenment' as const, reason: '大彻大悟，超凡入圣' };
  }
  if (happiness <= 0) {
    return { type: 'breakdown' as const, reason: '精神崩溃' };
  }
  if (age > 80 && Math.random() > 0.7) {
    return { type: 'natural' as const, reason: '安详离世' };
  }
  if (age > 90) {
    return { type: 'natural' as const, reason: '活到了生命的终点' };
  }
  return undefined;
}

/**
 * 生成本地标签
 */
function generateTags(age: number, lifeState: string, money: number): string[] {
  const tags: string[] = [];
  
  if (age <= 6) tags.push('幼年');
  else if (age <= 12) tags.push('童年');
  else if (age <= 18) tags.push('少年');
  else if (age <= 30) tags.push('青年');
  else if (age <= 45) tags.push('中年');
  else tags.push('老年');
  
  tags.push(lifeState);
  if (money < 20) tags.push('贫困');
  else if (money > 70) tags.push('富裕');
  
  return tags;
}

// 别名保持兼容
const generateLocalTags = generateTags;

/**
 * 模拟关键节点叙事（API失败时回退）
 */
function mockKeyDecisionNarrative(player: PlayerState): AINarrativeResult {
  const age = player.age;
  const isFemale = player.gender === 'female';
  
  // 检查是否已经辍学
  const alreadyDroppedOut = player.majorChoices.some(c => 
    c.choiceId === 'drop_out' || c.choiceId === 'work_direct' || c.lifeState === 'worker' || c.lifeState === 'delinquent'
  );
  
  const decisionCtx = getKeyDecisionContext(age, player.gender, alreadyDroppedOut);
  
  // 检查是否应该触发输入场景（基于状态和年龄）
  // 1. 刚毕业（刚从学生状态转为其他状态，或22岁左右）
  const justGraduated = age >= 21 && age <= 24 && player.lifeState === 'student';
  // 2. 婚恋压力（28岁左右且未婚）
  const marriagePressure = age >= 27 && age <= 30 && !player.majorChoices.some(c => c.choiceId.includes('marry'));
  // 3. 中年危机（35岁左右且职场状态）
  const midlifeCrisis = age >= 34 && age <= 36 && ['worker', 'business', 'freelance'].includes(player.lifeState);
  
  // 如果符合条件，触发输入场景
  if (justGraduated || marriagePressure || midlifeCrisis) {
    const inputScenes: Record<string, { title: string; narrative: string; hint: string }> = {
      graduation: {
        title: '毕业抉择',
        narrative: `大学四年转瞬即逝。毕业典礼上，你穿着学士服拍照，心里却空荡荡的——接下来该去哪？\n\n考研？考公？找工作？创业？还是干脆gap一年？\n\n人生没有标准答案，但此刻的选择，会把你推向不同的轨道。`,
        hint: '比如：考研深造 / 考公务员 / 进大厂打工 / 创业 / 躺平...'
      },
      marriage: {
        title: '婚恋压力',
        narrative: `${age}岁了。\n\n春节回家，亲戚们的话题从"在哪里工作"变成了"什么时候结婚"。妈妈欲言又止地看着你，爸爸抽烟的频率明显变高了。\n\n你心里也不是没有焦虑。朋友圈里有人晒娃，有人晒婚纱照，有人晒分手。\n\n爱情、现实、自由、孤独——你是怎么想的？`,
        hint: '比如：嫁给爱情 / 现实一点 / 保持单身 / 先忙事业...'
      },
      midlife: {
        title: '中年危机',
        narrative: `35岁生日那天，你对着镜子数白头发。\n\n职场开始卡年龄，比你年轻的同事已经爬到了你上面。房贷还有二十年，孩子的补习班费用让你头疼，父母的身体也开始出小毛病。\n\n你突然想问：这就是我要的人生吗？\n\n继续卷？换赛道？认命躺平？还是搏一把？`,
        hint: '比如：继续卷 / 换赛道 / 认命躺平 / 创业搏一把...'
      }
    };
    
    let sceneId = 'graduation';
    if (marriagePressure) sceneId = 'marriage';
    if (midlifeCrisis) sceneId = 'midlife';
    
    const scene = inputScenes[sceneId];
    
    return {
      narrative: scene.narrative,
      eventTitle: scene.title,
      statChanges: {},
      interaction: {
        type: 'input',
        sceneId: sceneId,
        inputHint: scene.hint
      },
      tags: ['input', sceneId, `age_${age}`]
    };
  }
  
  // 默认选项
  const defaultOptions: ChoiceOption[] = [
    { id: 'safe', text: '稳扎稳打', description: '稳妥的选择', effects: { money: 2, health: 1 } },
    { id: 'risk', text: '放手一搏', description: '高风险高回报', effects: { money: 5, happiness: -3 } },
    { id: 'happy', text: '及时行乐', description: '活在当下', effects: { happiness: 5, money: -2 } }
  ];
  
  // 年龄特定选项
  let ageSpecificOptions: Record<number, ChoiceOption[]> = {
    6: [
      { id: 'study_hard', text: '认真学习', effects: { intelligence: 5, happiness: -2 } },
      { id: 'play_more', text: '多交朋友', effects: { happiness: 5, intelligence: 2 } },
      { id: 'balanced', text: '均衡发展', effects: { intelligence: 3, happiness: 3 } }
    ],
    12: [
      { id: 'study_hard', text: '埋头苦读', effects: { intelligence: 6, happiness: -3 } },
      { id: 'first_love', text: '早恋', effects: { happiness: 8, intelligence: -4, appearance: 2 } },
      { id: 'fight', text: '加入校霸团体', effects: { appearance: 5, happiness: 6, intelligence: -5 }, lifeState: 'delinquent' },
      { id: 'game_addict', text: '沉迷游戏', effects: { happiness: 10, intelligence: -6, health: -3 } }
    ],
    15: alreadyDroppedOut ? [
      // 已经辍学后的选择
      { id: 'keep_working', text: '继续打工赚钱', effects: { money: 8, health: -2 }, lifeState: 'worker' },
      { id: 'learn_skill', text: '学门手艺（修车/美发/厨艺）', effects: { money: -3, intelligence: 3 }, lifeState: 'worker' },
      { id: 'street_race', text: '街头飙车', effects: { happiness: 10, health: -5, money: -3 }, lifeState: 'delinquent' },
      { id: 'return_school', text: '想回学校读书', effects: { happiness: -5, intelligence: 2 } }
    ] : [
      // 正常在校的选择
      { id: 'exam_prep', text: '全力备战中考', effects: { intelligence: 7, happiness: -4 } },
      { id: 'drop_out', text: '辍学混社会', effects: { money: 5, intelligence: -8, happiness: 3 }, lifeState: 'worker' },
      { id: 'street_race', text: '街头飙车', effects: { happiness: 10, health: -5, money: -3 }, lifeState: 'delinquent' }
    ],
    18: alreadyDroppedOut ? [
      // 如果已经辍学/工作了，18岁时是继续打工还是尝试其他出路
      { id: 'keep_working', text: '继续打工积累经验', effects: { money: 8, health: -2 }, lifeState: 'worker' },
      { id: 'learn_skill', text: '学门手艺（修车/美发/厨艺）', effects: { money: -3, intelligence: 3 }, lifeState: 'worker' },
      { id: 'start_small_business', text: '摆地摊/开小店创业', effects: { money: -5, happiness: 5 }, lifeState: 'business' },
      { id: 'adult_education', text: '报成人教育/自考', effects: { money: -3, happiness: -5, intelligence: 5 } }
    ] : [
      // 正常上学的选择
      { id: 'gaokao', text: '参加高考，冲击大学', effects: { happiness: -5, money: -3 } },
      { id: 'vocational', text: '直接读技校/专科', effects: { money: 3, intelligence: 2 }, lifeState: 'worker' },
      { id: 'work_direct', text: '不读了，直接打工', effects: { money: 5, happiness: -3 }, lifeState: 'worker' },
      { id: 'gang', text: '加入帮派', effects: { money: 10, appearance: 5, happiness: 8, health: -10 }, lifeState: 'criminal' }
    ],
    60: [
      { id: 'enjoy_retirement', text: '享受退休', effects: { happiness: 10, money: -3 }, lifeState: 'retired' },
      { id: 'keep_working', text: '继续工作', effects: { money: 5, happiness: -2 } },
      { id: 'start_business', text: '老年创业', effects: { money: -5, happiness: 8 }, lifeState: 'business' }
    ]
  };
  
  const options = ageSpecificOptions[age] || defaultOptions;
  
  // 吐槽文案（根据历史选择调整）
  const roasts: Record<number, string> = {
    6: '小学入学第一天，你背着新书包，觉得自己长大了。班主任看着你期待的眼神，默默叹了口气——这届学生不好带啊。',
    12: '小升初，你以为只是换个学校。殊不知，这是内卷的开始。',
    15: alreadyDroppedOut
      ? '15岁，本该备战中考的你已经辍学在社会上混了。看着曾经的 classmates 为中考焦虑，你觉得自己已经提前"解放"了。但你也清楚，没有学历的路，每一步都会更难走。'
      : '中考前夜，你第一次失眠。不是因为紧张，是因为发现三年数学课都在发呆，现在连方程都不会解。',
    18: alreadyDroppedOut 
      ? '18岁，本该高考的你已经在社会上摸爬滚打了好几年。看着曾经的同学备战高考，你心里五味杂陈。但路是自己选的，现在该想想下一步怎么走了。'
      : '高考结束，你以为人生从此自由。录取通知书告诉你：真正的内卷，才刚刚开始。',
    45: '45岁，事业遇到瓶颈，身体开始走下坡路。你终于理解了什么叫"人到中年万事休"。'
  };
  
  return {
    narrative: roasts[age] || decisionCtx.context,
    eventTitle: decisionCtx.title,
    eventDescription: decisionCtx.context,
    statChanges: {},
    interaction: {
      type: 'choice',
      sceneId: `decision_${age}`,
      options
    },
    tags: [decisionCtx.title, '关键抉择']
  };
}

/**
 * 验证并规范化结果
 */
function validateAndNormalizeResult(result: any, age: number): AINarrativeResult {
  // 处理ending字段
  let ending = result.ending;
  if (typeof ending === 'string' || typeof ending === 'boolean') {
    ending = null;
  } else if (ending && typeof ending === 'object') {
    const validTypes = ['death', 'enlightenment', 'breakdown', 'natural'];
    if (!validTypes.includes(ending.type)) {
      ending = null;
    }
  }
  
  // 处理interaction字段 - AI可能直接返回options而不是interaction对象
  let interaction = result.interaction;
  let options = result.options;
  
  // 如果直接有options但没有interaction，自动创建interaction
  if (!interaction && Array.isArray(options) && options.length > 0) {
    interaction = {
      type: 'choice',
      sceneId: `decision_${age}`,
      options: options
    };
  }
  
  // 验证interaction类型
  if (interaction && !['choice', 'input'].includes(interaction.type)) {
    interaction = undefined;
  }
  
  // 验证newLifeState
  let newLifeState = result.newLifeState;
  const validStates = ['normal', 'student', 'worker', 'business', 'freelancer', 'civil', 'hermit', 'beggar', 'criminal', 'addict', 'retired', 'elder', 'debt', 'bankrupt'];
  if (newLifeState && !validStates.includes(newLifeState)) {
    newLifeState = undefined;
  }
  
  return {
    narrative: result.narrative || `你度过了${age}岁这一年。`,
    eventTitle: result.eventTitle,
    eventDescription: result.eventDescription,
    statChanges: result.statChanges || {},
    newLifeState,
    interaction,
    ending,
    tags: Array.isArray(result.tags) ? result.tags : []
  };
}

/**
 * 生成人生总结
 */
export async function generateLifeSummary(
  playerState: PlayerState,
  allNarratives: string[],
  yearRecords: {age: number; narrative: string; eventTitle?: string}[]
): Promise<{
  summary: string;
  achievements: string[];
  regrets: string[];
  finalComment: string;
  aiEvaluation: string;
}> {
  const familyName = FAMILY_NAMES[playerState.birthFamily.type];
  const lifeStateName = LIFE_STATE_NAMES[playerState.lifeState];
  const birthplaceName = (playerState as any).birthplace || '未知';
  
  // 构建一生日志文本
  const lifeLog = yearRecords.map(r => `${r.age}岁：${r.eventTitle ? `[${r.eventTitle}] ` : ''}${r.narrative.substring(0, 100)}...`).join('\n');
  
  // 构建AI评价prompt
  const prompt = `【人生重开模拟器 - 一生评价】

玩家信息：
- 姓名：${(playerState as any).name || '无名氏'}
- 出生地：${birthplaceName}
- 出生年份：${(playerState as any).birthYear || '未知'}年
- 寿命：${playerState.age}岁
- 出身：${familyName}
- 最终状态：${lifeStateName}
- 最终属性：财力${playerState.stats.money}、智力${playerState.stats.intelligence}、外貌${playerState.stats.appearance}、健康${playerState.stats.health}、快乐${playerState.stats.happiness}

一生大事记：
${lifeLog.substring(0, 2000)}

请作为一位毒舌但温暖的人生评论家，用吐槽风格为这位玩家的一生写一段评价（300字以内）。要求：
1. 总结其一生经历的关键节点
2. 点评其人生选择
3. 给予一个幽默但走心的最终评价
4. 可以吐槽，但不要过于刻薄

请直接返回评价文字，不需要JSON格式。`;

  // 尝试调用AI
  let aiEvaluation = '';
  try {
    const response = await fetch(aiConfig.apiEndpoint || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: '你是人生评论家，擅长吐槽风格的人生总结' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 600
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      aiEvaluation = data.choices[0].message.content;
    } else {
      throw new Error('API调用失败');
    }
  } catch (error) {
    // 使用本地后备评价
    aiEvaluation = `${(playerState as any).name || '这位玩家'}的一生，从${birthplaceName}出发，历经${playerState.age}年风雨。${allNarratives.length > 10 ? '经历了许多大起大落，' : '日子平平淡淡的，'}最终定格在"${lifeStateName}"的状态。\n\n人生如戏，全靠演技。这场戏演得如何，只有你自己知道。但至少，你坚持到了${playerState.age}岁，这本身就是一种胜利。`;
  }
  
  // 生成本地总结
  const summaries = [
    `从${birthplaceName}的${familyName}出发，历经${playerState.age}年风雨，最终定格在"${lifeStateName}"的状态。这一生有过高光，也有过低谷。`,
    `${playerState.age}年人生，说长不长，说短不短。你体验过人生的酸甜苦辣，留下了属于自己的故事。`
  ];

  return {
    summary: summaries[Math.floor(Math.random() * summaries.length)],
    achievements: ['活到了' + playerState.age + '岁', `出生在${birthplaceName}`, '经历了人生的酸甜苦辣'],
    regrets: ['有些选择可能不够好', '时间过得太快'],
    finalComment: '"游戏结束，但你的故事会被记住——至少在这个存档里。"',
    aiEvaluation
  };
}

/**
 * 生成自由输入场景的叙事
 */
function generateInputSceneNarrative(
  player: PlayerState,
  scene: InputScene
): AINarrativeResult {
  // 根据场景生成不同的叙事
  const narratives: Record<string, string> = {
    graduation: `大学四年转瞬即逝。毕业典礼上，你穿着学士服拍照，心里却空荡荡的——接下来该去哪？\n\n考研？考公？找工作？创业？还是干脆gap一年？\n\n人生没有标准答案，但此刻的选择，会把你推向不同的轨道。`,
    marriage_pressure: `${player.age}岁了。\n\n春节回家，亲戚们的话题从"在哪里工作"变成了"什么时候结婚"。妈妈欲言又止地看着你，爸爸抽烟的频率明显变高了。\n\n你心里也不是没有焦虑。朋友圈里有人晒娃，有人晒婚纱照，有人晒分手。\n\n爱情、现实、自由、孤独——你是怎么想的？`,
    midlife_crisis: `35岁生日那天，你对着镜子数白头发。\n\n职场开始卡年龄，比你年轻的同事已经爬到了你上面。房贷还有二十年，孩子的补习班费用让你头疼，父母的身体也开始出小毛病。\n\n你突然想问：这就是我要的人生吗？\n\n继续卷？换赛道？认命躺平？还是搏一把？`
  };

  const narrative = narratives[scene.id] || scene.description;

  return {
    narrative,
    eventTitle: scene.title,
    statChanges: {},
    interaction: {
      type: 'input',
      sceneId: scene.id,
      inputHint: scene.hint
    },
    tags: ['input', scene.id, `age_${player.age}`]
  };
}
