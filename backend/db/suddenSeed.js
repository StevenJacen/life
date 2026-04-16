const db = require('./index');

const suddenEvents = [
  {
    title: '青年失恋',
    description: '一段无疾而终的感情让你黯然神伤，但也让你更成熟。',
    min_age: 18, max_age: 28,
    base_probability: 0.15,
    effects: [{ type: 'happiness', value: -15 }, { type: 'health', value: -3 }],
    repeatable: true, cooldown_years: 2
  },
  {
    title: '35岁裁员',
    description: 'HR把你叫进会议室，说"公司战略调整"。你默默收拾工位离开。',
    min_age: 32, max_age: 45,
    base_probability: 0.12,
    career_conditions: JSON.stringify(['employee', 'worker']),
    effects: [{ type: 'money', value: -30 }, { type: 'happiness', value: -20 }, { type: 'health', value: -5 }],
    repeatable: false, cooldown_years: 5
  },
  {
    title: '积劳成疾',
    description: '长期加班让你的身体发出了警报，不得不去医院报到。',
    min_age: 18, max_age: 999,
    base_probability: 0.30,
    stat_conditions: JSON.stringify([{ stat: 'health', operator: '<', value: 40 }]),
    effects: [{ type: 'health', value: -10 }, { type: 'money', value: -10 }, { type: 'happiness', value: -5 }],
    repeatable: true, cooldown_years: 3
  },
  {
    title: '医疗账单',
    description: '一连串的检查和治疗让钱包大出血，你开始理解健康就是财富。',
    min_age: 18, max_age: 999,
    base_probability: 0.50,
    stat_conditions: JSON.stringify([{ stat: 'health', operator: '<', value: 40 }, { stat: 'money', operator: '<', value: 30 }]),
    effects: [{ type: 'money', value: -20 }, { type: 'happiness', value: -10 }],
    repeatable: true, cooldown_years: 2,
    required_event_ids: JSON.stringify([3]) // 需要积劳成疾(id=3)先触发过
  },
  {
    title: '车祸意外',
    description: '一场突如其来的交通事故让你躺进了医院，人生无常。',
    min_age: 18, max_age: 60,
    base_probability: 0.05,
    effects: [{ type: 'health', value: -15 }, { type: 'money', value: -20 }, { type: 'happiness', value: -10 }],
    repeatable: true, cooldown_years: 5
  },
  {
    title: '投资暴雷',
    description: '你听信朋友推荐买的理财产品一夜之间归零，血本无归。',
    min_age: 25, max_age: 55,
    base_probability: 0.10,
    stat_conditions: JSON.stringify([{ stat: 'money', operator: '>=', value: 50 }]),
    effects: [{ type: 'money', value: -40 }, { type: 'happiness', value: -15 }],
    repeatable: true, cooldown_years: 3
  },
  {
    title: '抑郁情绪',
    description: '长期的压力让你陷入低落，对什么都提不起兴趣。',
    min_age: 18, max_age: 999,
    base_probability: 0.25,
    stat_conditions: JSON.stringify([{ stat: 'happiness', operator: '<', value: 30 }]),
    effects: [{ type: 'happiness', value: -10 }, { type: 'health', value: -5 }],
    repeatable: true, cooldown_years: 2
  },
  {
    title: '彩票中奖',
    description: '随手买的一张彩票居然中了小奖，运气来了挡不住。',
    min_age: 18, max_age: 999,
    base_probability: 0.02,
    effects: [{ type: 'money', value: 50 }, { type: 'happiness', value: 10 }],
    repeatable: true, cooldown_years: 5
  },
  {
    title: '意外遗产',
    description: '远方亲戚去世，你意外继承了一笔遗产，人生转折来得太突然。',
    min_age: 40, max_age: 999,
    base_probability: 0.03,
    effects: [{ type: 'money', value: 80 }, { type: 'happiness', value: 5 }],
    repeatable: false, cooldown_years: 10
  },
  {
    title: '意外晋升',
    description: '上司突然离职，你被破格提拔，薪水水涨船高。',
    min_age: 25, max_age: 50,
    base_probability: 0.08,
    career_conditions: JSON.stringify(['employee', 'worker']),
    stat_conditions: JSON.stringify([{ stat: 'intelligence', operator: '>', value: 60 }]),
    effects: [{ type: 'money', value: 25 }, { type: 'happiness', value: 10 }],
    repeatable: false, cooldown_years: 5
  }
];

function seedSuddenEvents() {
  const hasData = db.prepare('SELECT COUNT(*) as count FROM sudden_event_def').get();
  if (hasData && hasData.count > 0) {
    console.log('sudden_event_def already seeded');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO sudden_event_def (
      title, description, min_age, max_age, base_probability,
      stat_conditions, career_conditions, effects,
      once_per_life, repeatable, cooldown_years, required_event_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ev of suddenEvents) {
    insert.run(
      ev.title,
      ev.description,
      ev.min_age ?? 0,
      ev.max_age ?? 999,
      ev.base_probability ?? 0.1,
      ev.stat_conditions ?? '[]',
      ev.career_conditions ?? '[]',
      typeof ev.effects === 'string' ? ev.effects : JSON.stringify(ev.effects ?? []),
      ev.once_per_life ? 1 : 0,
      ev.repeatable ? 1 : 0,
      ev.cooldown_years ?? 0,
      ev.required_event_ids ?? '[]'
    );
  }

  console.log(`Seeded ${suddenEvents.length} sudden events.`);
}

seedSuddenEvents();
