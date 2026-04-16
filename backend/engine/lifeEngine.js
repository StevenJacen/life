const db = require('../db');

function parseValue(val) {
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== '') return num;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

function compare(a, op, b) {
  switch (op) {
    case '>': return a > b;
    case '<': return a < b;
    case '=': return a == b;
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '!=': return a != b;
    case 'in': return Array.isArray(b) ? b.includes(a) : String(b).split(',').map(s => s.trim()).includes(String(a));
    default: return false;
  }
}

function checkCondition(cond, state) {
  const type = cond.type;
  const op = cond.operator;
  const rawValue = cond.value;
  const value = parseValue(rawValue);

  let actual;
  switch (type) {
    case 'attribute':
      actual = state.attributes[cond.target] ?? 0;
      break;
    case 'money':
      actual = state.money;
      break;
    case 'career':
      actual = state.career;
      break;
    case 'family':
      actual = state.family_class;
      break;
    case 'age':
      actual = state.age;
      break;
    case 'education':
      actual = state.education_level;
      break;
    default:
      return false;
  }

  return compare(actual, op, value);
}

function evalConditionString(str, state) {
  // 解析如 "intelligence > 80" 或 "family = rich"
  const parts = str.trim().split(/\s+/);
  if (parts.length < 3) return false;
  const [key, op, ...rest] = parts;
  const valStr = rest.join(' ');
  const value = parseValue(valStr);

  let actual;
  if (state.attributes[key] !== undefined) {
    actual = state.attributes[key];
  } else if (key === 'money') {
    actual = state.money;
  } else if (key === 'career') {
    actual = state.career;
  } else if (key === 'family') {
    actual = state.family_class;
  } else if (key === 'age') {
    actual = state.age;
  } else if (key === 'education' || key === 'education_level') {
    actual = state.education_level;
  } else {
    return false;
  }

  return compare(actual, op, value);
}

function calculateWeight(event, state) {
  const formula = JSON.parse(event.weight_formula || '{"base":100}');
  let weight = formula.base || 0;

  for (const mod of formula.modifiers || []) {
    if (evalConditionString(mod.condition, state)) {
      weight *= mod.multiplier;
    }
  }

  return weight;
}

function weightedRandom(events) {
  const total = events.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return null;
  let rand = Math.random() * total;
  for (const e of events) {
    if (rand < e.weight) return e;
    rand -= e.weight;
  }
  return events[events.length - 1];
}

function applyEffects(effects, state) {
  const results = [];
  for (const eff of effects) {
    if (Math.random() > (eff.probability ?? 1)) continue;

    const type = eff.type;
    const target = eff.target;
    const val = eff.value;

    let actualChange = null;

    switch (type) {
      case 'money':
        state.money += val;
        actualChange = { type: 'money', delta: val, newValue: state.money };
        break;
      case 'attribute':
        state.attributes[target] = (state.attributes[target] ?? 0) + val;
        actualChange = { type: 'attribute', target, delta: val, newValue: state.attributes[target] };
        break;
      case 'career':
        state.career = target || String(val);
        actualChange = { type: 'career', newValue: state.career };
        break;
      case 'education':
        state.education_level = target || String(val);
        actualChange = { type: 'education', newValue: state.education_level };
        break;
      case 'family':
        state.family_class = target || String(val);
        actualChange = { type: 'family', newValue: state.family_class };
        break;
      case 'happiness':
        state.happiness += val;
        actualChange = { type: 'happiness', delta: val, newValue: state.happiness };
        break;
      case 'health':
        state.health += val;
        actualChange = { type: 'health', delta: val, newValue: state.health };
        break;
    }

    if (actualChange) {
      results.push(actualChange);
    }
  }
  return results;
}

function getLifeState(lifeId) {
  const row = db.prepare('SELECT * FROM life_state WHERE id = ?').get(lifeId);
  if (!row) return null;
  row.attributes = JSON.parse(row.attributes || '{}');
  return row;
}

function createLife() {
  const info = db.prepare(`
    INSERT INTO life_state (age, money, attributes, career, family_class, education_level, happiness, health)
    VALUES (0, 0, ?, 'unemployed', 'normal', 'none', 50, 50)
  `).run(JSON.stringify({ intelligence: 0, charm: 0 }));
  return getLifeState(info.lastInsertRowid);
}

function getEventsByAge(age) {
  return db.prepare(`
    SELECT * FROM event_def
    WHERE min_age <= ? AND max_age >= ?
  `).all(age, age);
}

function getConditions(eventId) {
  return db.prepare('SELECT * FROM event_condition WHERE event_id = ?').all(eventId);
}

function getOptions(eventId) {
  return db.prepare('SELECT * FROM event_option WHERE event_id = ?').all(eventId);
}

function getEffects(optionId) {
  return db.prepare('SELECT * FROM event_effect WHERE option_id = ?').all(optionId);
}

function hasEventOccurred(lifeId, eventId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM event_log WHERE life_id = ? AND event_id = ?').get(lifeId, eventId);
  return row.count > 0;
}

// ========== 突发事件系统 ==========

function getSuddenEventsByAge(age) {
  return db.prepare(`
    SELECT * FROM sudden_event_def
    WHERE min_age <= ? AND max_age >= ?
  `).all(age, age);
}

function hasSuddenEventOccurred(lifeId, eventId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM sudden_event_log WHERE life_id = ? AND event_id = ?').get(lifeId, eventId);
  return row.count > 0;
}

function hasSuddenEventInCooldown(lifeId, eventId, cooldownYears, currentAge) {
  if (!cooldownYears || cooldownYears <= 0) return false;
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM sudden_event_log
    WHERE life_id = ? AND event_id = ? AND age >= ?
  `).get(lifeId, eventId, currentAge - cooldownYears);
  return row.count > 0;
}

function evalSuddenStatConditions(conditions, state) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every(c => {
    let actual;
    if (c.stat === 'money') actual = state.money;
    else if (c.stat === 'health') actual = state.health;
    else if (c.stat === 'happiness') actual = state.happiness;
    else if (c.stat === 'intelligence') actual = state.attributes.intelligence ?? 0;
    else if (c.stat === 'charm') actual = state.attributes.charm ?? 0;
    else return false;
    return compare(actual, c.operator, c.value);
  });
}

function calculateSuddenProbability(event, state) {
  let prob = event.base_probability || 0;

  // 动态倍率（参考 reference 项目）
  if (state.health < 20) prob *= 2.0;
  else if (state.health < 40) prob *= 1.5;
  else if (state.health > 70) prob *= 0.3;

  if (state.money < 10) prob *= 1.8;

  if (state.happiness > 70) prob *= 0.8;
  else if (state.happiness < 20) prob *= 1.5;

  // 体制内保护：35岁裁员概率降低
  if (event.title === '35岁裁员' && state.career === 'civil') {
    prob *= 0.3;
  }

  return Math.min(0.8, Math.max(0, prob));
}

function checkSuddenEvents(lifeId, state) {
  const events = getSuddenEventsByAge(state.age);
  const triggered = [];

  for (const ev of events) {
    // 一生一次
    if (ev.once_per_life && hasSuddenEventOccurred(lifeId, ev.id)) continue;
    // 不可重复
    if (!ev.repeatable && hasSuddenEventOccurred(lifeId, ev.id)) continue;
    // 冷却期
    if (hasSuddenEventInCooldown(lifeId, ev.id, ev.cooldown_years, state.age)) continue;

    // 职业条件
    const careerConds = JSON.parse(ev.career_conditions || '[]');
    if (careerConds.length > 0 && !careerConds.includes(state.career)) continue;

    // 属性条件
    const statConds = JSON.parse(ev.stat_conditions || '[]');
    if (!evalSuddenStatConditions(statConds, state)) continue;

    // 前置事件链
    const requiredIds = JSON.parse(ev.required_event_ids || '[]');
    if (requiredIds.length > 0) {
      const allTriggered = requiredIds.every(id => hasSuddenEventOccurred(lifeId, id));
      if (!allTriggered) continue;
    }

    // 概率判定
    const finalProb = calculateSuddenProbability(ev, state);
    if (Math.random() < finalProb) {
      triggered.push(ev);
    }
  }

  // 每年最多触发 2 个突发事件
  return triggered.slice(0, 2);
}

function recordSuddenEvent(lifeId, age, eventId) {
  db.prepare(`
    INSERT INTO sudden_event_log (life_id, age, event_id)
    VALUES (?, ?, ?)
  `).run(lifeId, age, eventId);
}

function nextTurn(lifeId) {
  const state = getLifeState(lifeId);
  if (!state) throw new Error('Life not found');

  // 1. 基础 SQL 筛选
  let events = getEventsByAge(state.age);

  // 2. 代码条件过滤
  events = events.filter(e => {
    if (e.once_per_life && hasEventOccurred(lifeId, e.id)) return false;
    if (!e.repeatable && hasEventOccurred(lifeId, e.id)) return false;

    const conditions = getConditions(e.id);
    return conditions.every(c => checkCondition(c, state));
  });

  // 3. 计算权重
  events.forEach(e => {
    e.weight = calculateWeight(e, state);
  });

  // 过滤掉权重为 0 的事件
  events = events.filter(e => e.weight > 0);

  if (events.length === 0) {
    return { event: null, options: [] };
  }

  // 4. 抽取事件
  const event = weightedRandom(events);
  const options = getOptions(event.id);

  // 清理注入的 weight 字段，避免污染
  const cleanEvent = { ...event };
  delete cleanEvent.weight;

  // 随机附带 humor_quote
  const humor = getRandomHumor();
  if (humor) bumpHumorUsage(humor.id);

  return { event: cleanEvent, options, humor_quote: humor };
}

function chooseOption(lifeId, optionId) {
  const state = getLifeState(lifeId);
  if (!state) throw new Error('Life not found');

  const option = db.prepare('SELECT * FROM event_option WHERE id = ?').get(optionId);
  if (!option) throw new Error('Option not found');

  const event = db.prepare('SELECT * FROM event_def WHERE id = ?').get(option.event_id);

  const effects = getEffects(optionId);
  const results = applyEffects(effects, state);

  // 年龄增长
  state.age += 1;

  // 检查突发事件
  const suddenEvents = checkSuddenEvents(lifeId, state);
  let suddenResults = [];
  for (const se of suddenEvents) {
    const seEffects = JSON.parse(se.effects || '[]');
    const seRes = applyEffects(seEffects, state);
    suddenResults.push({ event: se, results: seRes });
    recordSuddenEvent(lifeId, state.age - 1, se.id);
  }

  // 更新 life_state
  db.prepare(`
    UPDATE life_state
    SET age = ?, money = ?, attributes = ?, career = ?, family_class = ?, education_level = ?, happiness = ?, health = ?
    WHERE id = ?
  `).run(
    state.age,
    state.money,
    JSON.stringify(state.attributes),
    state.career,
    state.family_class,
    state.education_level,
    state.happiness,
    state.health,
    lifeId
  );

  // 写入日志
  const suddenEventId = suddenEvents.length > 0 ? suddenEvents[0].id : null;
  db.prepare(`
    INSERT INTO event_log (life_id, age, event_id, option_id, result, sudden_event_id, sudden_result)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    lifeId,
    state.age - 1,
    event.id,
    option.id,
    JSON.stringify(results),
    suddenEventId,
    JSON.stringify(suddenResults)
  );

  const humor = getRandomHumor();
  if (humor) bumpHumorUsage(humor.id);

  return {
    state: getLifeState(lifeId),
    event,
    option,
    results,
    humor_quote: humor,
    sudden_events: suddenResults
  };
}

function skipYear(lifeId) {
  const state = getLifeState(lifeId);
  if (!state) throw new Error('Life not found');

  state.age += 1;

  // 检查突发事件（平淡的一年里也可能有意外）
  const suddenEvents = checkSuddenEvents(lifeId, state);
  let suddenResults = [];
  for (const se of suddenEvents) {
    const seEffects = JSON.parse(se.effects || '[]');
    const seRes = applyEffects(seEffects, state);
    suddenResults.push({ event: se, results: seRes });
    recordSuddenEvent(lifeId, state.age - 1, se.id);
  }

  db.prepare(`
    UPDATE life_state SET age = ? WHERE id = ?
  `).run(state.age, lifeId);

  db.prepare(`
    INSERT INTO event_log (life_id, age, event_id, option_id, result, sudden_event_id, sudden_result)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    lifeId,
    state.age - 1,
    null,
    null,
    JSON.stringify([{ type: 'age', delta: 1, newValue: state.age }]),
    suddenEvents.length > 0 ? suddenEvents[0].id : null,
    JSON.stringify(suddenResults)
  );

  const humor = getRandomHumor();
  if (humor) bumpHumorUsage(humor.id);

  return { state: getLifeState(lifeId), humor_quote: humor, sudden_events: suddenResults };
}

function getRandomHumor() {
  const row = db.prepare(`
    SELECT * FROM humor_library
    ORDER BY RANDOM()
    LIMIT 1
  `).get();
  return row || null;
}

function bumpHumorUsage(id) {
  db.prepare(`UPDATE humor_library SET usage_count = usage_count + 1 WHERE id = ?`).run(id);
}

function getLogs(lifeId) {
  return db.prepare(`
    SELECT el.*, ed.title as event_title, eo.text as option_text, sed.title as sudden_title
    FROM event_log el
    LEFT JOIN event_def ed ON el.event_id = ed.id
    LEFT JOIN event_option eo ON el.option_id = eo.id
    LEFT JOIN sudden_event_def sed ON el.sudden_event_id = sed.id
    WHERE el.life_id = ?
    ORDER BY el.created_at DESC
  `).all(lifeId);
}

module.exports = {
  createLife,
  getLifeState,
  nextTurn,
  chooseOption,
  skipYear,
  getLogs,
  getRandomHumor,
  bumpHumorUsage,
};
