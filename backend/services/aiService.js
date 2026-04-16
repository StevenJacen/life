/**
 * AI 事件生成服务 - 调用 DashScope (通义千问)
 */

const fs = require('fs');
const path = require('path');

function extractKeyFromAicall() {
  try {
    const p = path.join(__dirname, '..', '..', 'aicall.md');
    const content = fs.readFileSync(p, 'utf-8');
    const match = content.match(/api\s*key\s*=\s*(sk-[a-zA-Z0-9]+)/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

const API_KEY = process.env.DASHSCOPE_API_KEY || extractKeyFromAicall() || '';
const MODEL = process.env.DASHSCOPE_MODEL || 'qwen-flash-character';
const ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

async function generateEventByState(state) {
  if (!API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  const prompt = buildPrompt(state);

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是「人生模拟器」的AI事件生成引擎。请根据玩家当前状态，生成一个符合中式生活场景、带吐槽风格的随机事件。返回必须是合法JSON，不要包含markdown代码块标记。'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DashScope API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 解析 JSON
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  }

  if (!parsed) {
    throw new Error('Failed to parse AI response as JSON');
  }

  return normalizeEvent(parsed);
}

function buildPrompt(state) {
  return `[人生模拟器 - 随机事件生成]

玩家当前状态：
- 年龄：${state.age}岁
- 职业：${state.career}
- 学历：${state.education_level}
- 家庭背景：${state.family_class}
- 财富：${state.money}
- 健康：${state.health}
- 快乐：${state.happiness}
- 智力：${state.attributes.intelligence || 0}
- 魅力：${state.attributes.charm || 0}

请生成一个随机事件，要求：
1. 标题简洁有力（5-10字）
2. 描述要有中式生活感和吐槽风格（50-120字）
3. 提供2-3个选项，每个选项要有效果（type支持：money, attribute, career, education, happiness, health, family）
4. 如果有条件限制，用conditions表达
5. weight_formula.base 默认80

返回严格JSON格式：
{
  "title": "事件标题",
  "description": "事件描述",
  "min_age": 0,
  "max_age": 999,
  "repeatable": false,
  "once_per_life": false,
  "weight_formula": {"base":80},
  "conditions": [],
  "options": [
    {
      "text": "选项文字",
      "description": "",
      "effects": [
        {"type": "money", "value": -1000},
        {"type": "happiness", "value": 5}
      ]
    }
  ]
}`;
}

function normalizeEvent(raw) {
  const event = {
    title: raw.title || '意外事件',
    description: raw.description || '这一年发生了一些意想不到的事。',
    min_age: typeof raw.min_age === 'number' ? raw.min_age : 0,
    max_age: typeof raw.max_age === 'number' ? raw.max_age : 999,
    repeatable: !!raw.repeatable,
    once_per_life: !!raw.once_per_life,
    weight_formula: raw.weight_formula || { base: 80 },
    conditions: Array.isArray(raw.conditions) ? raw.conditions : [],
    options: []
  };

  for (const opt of (raw.options || [])) {
    const option = {
      text: opt.text || '继续生活',
      description: opt.description || '',
      effects: []
    };
    for (const eff of (opt.effects || [])) {
      option.effects.push({
        type: eff.type || 'happiness',
        target: eff.target || null,
        value: typeof eff.value === 'number' ? eff.value : 0,
        probability: typeof eff.probability === 'number' ? eff.probability : 1.0
      });
    }
    event.options.push(option);
  }

  return event;
}

async function generateBackstoryInit(age, description) {
  if (!API_KEY) {
    throw new Error('DASHSCOPE_API_KEY not configured');
  }

  const prompt = buildBackstoryPrompt(age, description);

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是「人生模拟器」的AI剧本编排引擎。请根据用户的年龄和前半生描述，生成一段符合中式生活场景、带吐槽风格的总结，并推断当前状态，再为后半生埋下4-6个伏笔事件。返回必须是合法JSON，不要包含markdown代码块标记。'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DashScope API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  }

  if (!parsed) {
    throw new Error('Failed to parse AI response as JSON');
  }

  return normalizeBackstoryInit(parsed);
}

function buildBackstoryPrompt(age, description) {
  return `[人生模拟器 - 从半途开始]

玩家设定：
- 开始年龄：${age}岁
- 前半生描述：${description}

请生成以下内容：
1. summary：一段4-6句话的「前半生回顾」，要有中式生活感和吐槽风格。
2. state：推断玩家当前的合理状态：
   - age（固定为${age}）
   - money（整数，参考社会经济水平）
   - career（字符串，如"程序员"、"小学教师"、"自由职业"）
   - education_level（字符串，如"本科"、"高中"、"硕士"）
   - family_class（字符串，如"普通家庭"、"中产家庭"）
   - health（0-100整数）
   - happiness（0-100整数）
   - attributes：{intelligence, charm, strength, luck}，每项0-100整数
3. events：为后半生埋下4-6个伏笔事件。这些事件将在游戏中以高概率触发。要求：
   - 每个事件贴合玩家的前半生设定
   - weight_formula.base 设为 150-250 之间
   - min_age 不小于 ${age}，max_age 不大于 100
   - 标题5-10字，描述50-120字
   - 2-3个选项，带合理效果（type支持 money, attribute, career, education, happiness, health, family）

返回严格JSON格式：
{
  "summary": "前半生回顾文本",
  "state": {
    "age": ${age},
    "money": 0,
    "career": "职业",
    "education_level": "学历",
    "family_class": "家庭背景",
    "health": 80,
    "happiness": 70,
    "attributes": {"intelligence":50,"charm":50,"strength":50,"luck":50}
  },
  "events": [
    {
      "title": "事件标题",
      "description": "事件描述",
      "min_age": ${age},
      "max_age": 999,
      "repeatable": false,
      "once_per_life": true,
      "weight_formula": {"base":200},
      "conditions": [],
      "options": [
        {
          "text": "选项文字",
          "description": "",
          "effects": [
            {"type": "money", "value": -1000},
            {"type": "happiness", "value": 5}
          ]
        }
      ]
    }
  ]
}`;
}

function normalizeBackstoryInit(raw) {
  const result = {
    summary: raw.summary || '前半生如白驹过隙，留下的只有未完待续的故事。',
    state: {
      age: typeof raw.state?.age === 'number' ? raw.state.age : 0,
      money: typeof raw.state?.money === 'number' ? raw.state.money : 0,
      career: raw.state?.career || '无业',
      education_level: raw.state?.education_level || '未知',
      family_class: raw.state?.family_class || '普通家庭',
      health: clampStat(raw.state?.health),
      happiness: clampStat(raw.state?.happiness),
      attributes: {
        intelligence: clampStat(raw.state?.attributes?.intelligence),
        charm: clampStat(raw.state?.attributes?.charm),
        strength: clampStat(raw.state?.attributes?.strength),
        luck: clampStat(raw.state?.attributes?.luck)
      }
    },
    events: []
  };

  for (const ev of (raw.events || [])) {
    result.events.push(normalizeEvent(ev));
  }

  return result;
}

function clampStat(v) {
  const n = typeof v === 'number' ? v : 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

module.exports = {
  generateEventByState,
  generateBackstoryInit
};
