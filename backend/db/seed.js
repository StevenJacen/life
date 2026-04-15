const db = require('./index');
const fs = require('fs');
const path = require('path');

const { insertEvent } = db;

try {
  db.exec(`DELETE FROM event_effect; DELETE FROM event_option; DELETE FROM event_condition; DELETE FROM event_log; DELETE FROM event_def; DELETE FROM life_state;`);
} catch (e) {
  // ignore if tables don't exist yet
}

const events = [
  {
    title: '出生',
    description: '你来到了这个世界，命运之门缓缓打开。',
    min_age: 0, max_age: 0,
    repeatable: false, once_per_life: true,
    weight_formula: { base: 100 },
    options: [
      {
        text: '普通家庭',
        description: '平凡但温暖的家庭',
        effects: [
          { type: 'money', value: 1000 },
          { type: 'attribute', target: 'intelligence', value: 10 },
          { type: 'attribute', target: 'health', value: 10 },
        ]
      },
      {
        text: '富裕家庭',
        description: '含着金汤匙出生',
        effects: [
          { type: 'money', value: 10000 },
          { type: 'family', value: 0, target: 'rich' },
        ]
      }
    ]
  },
  {
    title: '上学',
    description: '又是一年校园时光，你打算怎么度过？',
    min_age: 6, max_age: 17,
    repeatable: true, once_per_life: false,
    weight_formula: { base: 200 },
    options: [
      {
        text: '努力学习',
        effects: [
          { type: 'attribute', target: 'intelligence', value: 5 },
          { type: 'happiness', value: -2 },
        ]
      },
      {
        text: '随便混混',
        effects: [
          { type: 'attribute', target: 'intelligence', value: 1 },
          { type: 'happiness', value: 3 },
        ]
      }
    ]
  },
  {
    title: '高考',
    description: '寒窗苦读十二年，一考定终身。',
    min_age: 18, max_age: 18,
    repeatable: false, once_per_life: true,
    weight_formula: {
      base: 100,
      modifiers: [
        { condition: 'intelligence > 80', multiplier: 1.5 }
      ]
    },
    conditions: [
      { type: 'education', operator: '!=', value: 'university' }
    ],
    options: [
      {
        text: '正常发挥',
        description: '你考上了大学',
        effects: [
          { type: 'education', value: 0, target: 'university' },
          { type: 'attribute', target: 'intelligence', value: 10 },
          { type: 'happiness', value: 10 },
        ]
      },
      {
        text: '考试失利',
        description: '只能去读大专或直接工作',
        effects: [
          { type: 'education', value: 0, target: 'highschool' },
          { type: 'happiness', value: -10 },
        ]
      }
    ]
  },
  {
    title: '工作',
    description: '辛勤工作的一年，你获得了回报。',
    min_age: 22, max_age: 59,
    repeatable: true, once_per_life: false,
    weight_formula: { base: 150 },
    options: [
      {
        text: '认真工作',
        effects: [
          { type: 'money', value: 3000 },
          { type: 'attribute', target: 'intelligence', value: 1 },
          { type: 'happiness', value: -1 },
        ]
      },
      {
        text: '摸鱼度日',
        effects: [
          { type: 'money', value: 1500 },
          { type: 'happiness', value: 3 },
        ]
      }
    ]
  },
  {
    title: '结婚',
    description: '你遇到了想要共度一生的人。',
    min_age: 25, max_age: 40,
    repeatable: false, once_per_life: true,
    weight_formula: { base: 80 },
    conditions: [
      { type: 'career', operator: '!=', value: 'unemployed' }
    ],
    options: [
      {
        text: '步入婚姻',
        effects: [
          { type: 'happiness', value: 20 },
          { type: 'money', value: -5000 },
        ]
      },
      {
        text: '保持单身',
        effects: [
          { type: 'happiness', value: -5 },
        ]
      }
    ]
  },
  {
    title: '投资',
    description: '股市行情不错，你考虑要不要入场。',
    min_age: 30, max_age: 55,
    repeatable: true, once_per_life: false,
    weight_formula: { base: 60 },
    conditions: [
      { type: 'money', operator: '>=', value: '10000' }
    ],
    options: [
      {
        text: '稳健理财',
        effects: [
          { type: 'money', value: 5000 },
        ]
      },
      {
        text: '高风险高回报',
        effects: [
          { type: 'money', value: 20000, probability: 0.5 },
          { type: 'money', value: -10000, probability: 0.5 },
        ]
      }
    ]
  },
  {
    title: '生病',
    description: '身体发出了警报，你感到不适。',
    min_age: 20, max_age: 70,
    repeatable: true, once_per_life: false,
    weight_formula: { base: 70 },
    options: [
      {
        text: '积极治疗',
        effects: [
          { type: 'health', value: 10 },
          { type: 'money', value: -3000 },
        ]
      },
      {
        text: '硬扛过去',
        effects: [
          { type: 'health', value: -10 },
        ]
      }
    ]
  },
  {
    title: '创业',
    description: '你有了一个商业点子，要不要辞职创业？',
    min_age: 25, max_age: 45,
    repeatable: false, once_per_life: true,
    weight_formula: { base: 50 },
    conditions: [
      { type: 'attribute', operator: '>=', target: 'intelligence', value: '60' }
    ],
    options: [
      {
        text: '辞职创业',
        effects: [
          { type: 'career', value: 0, target: 'entrepreneur' },
          { type: 'money', value: -20000 },
          { type: 'money', value: 50000, probability: 0.5 },
        ]
      },
      {
        text: '继续打工',
        effects: [
          { type: 'happiness', value: 2 },
        ]
      }
    ]
  },
  {
    title: '破产',
    description: '经济形势不好，你的资产大幅缩水。',
    min_age: 30, max_age: 60,
    repeatable: false, once_per_life: true,
    weight_formula: { base: 40 },
    conditions: [
      { type: 'career', operator: '=', value: 'entrepreneur' }
    ],
    options: [
      {
        text: '变卖资产',
        effects: [
          { type: 'money', value: -30000 },
          { type: 'career', value: 0, target: 'employee' },
          { type: 'happiness', value: -10 },
        ]
      },
      {
        text: '借钱周转',
        effects: [
          { type: 'money', value: -10000 },
          { type: 'happiness', value: -10 },
        ]
      }
    ]
  },
  {
    title: '退休',
    description: '你到了退休年龄，结束了职业生涯。',
    min_age: 60, max_age: 999,
    repeatable: false, once_per_life: true,
    weight_formula: { base: 300 },
    options: [
      {
        text: '安享晚年',
        effects: [
          { type: 'career', value: 0, target: 'retired' },
          { type: 'happiness', value: 10 },
          { type: 'health', value: -5 },
        ]
      }
    ]
  }
];

for (const ev of events) {
  insertEvent(ev, false);
}

console.log('Seed data inserted successfully.');
