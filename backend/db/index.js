const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? '/tmp/life.db' : path.join(__dirname, '..', 'life.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);

// 初始化表结构
try {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
} catch (err) {
  console.error('Failed to init schema:', err);
  if (!isVercel) process.exit(1);
}

function insertEvent(ev, isAiGenerated = false) {
  const insertEventStmt = db.prepare(`
    INSERT INTO event_def (title, description, min_age, max_age, repeatable, once_per_life, weight_formula, is_ai_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = insertEventStmt.run(
    ev.title,
    ev.description,
    ev.min_age ?? 0,
    ev.max_age ?? 999,
    ev.repeatable ? 1 : 0,
    ev.once_per_life ? 1 : 0,
    JSON.stringify(ev.weight_formula || { base: 100 }),
    isAiGenerated ? 1 : 0
  );
  const eventId = info.lastInsertRowid;

  const insertCond = db.prepare(`INSERT INTO event_condition (event_id, type, operator, target, value) VALUES (?, ?, ?, ?, ?)`);
  for (const c of ev.conditions || []) {
    insertCond.run(eventId, c.type, c.operator, c.target || null, String(c.value));
  }

  const insertOpt = db.prepare(`INSERT INTO event_option (event_id, text, description) VALUES (?, ?, ?)`);
  const insertEff = db.prepare(`INSERT INTO event_effect (option_id, type, target, value, probability) VALUES (?, ?, ?, ?, ?)`);
  for (const opt of ev.options || []) {
    const optInfo = insertOpt.run(eventId, opt.text, opt.description || '');
    const optId = optInfo.lastInsertRowid;
    for (const eff of opt.effects || []) {
      insertEff.run(optId, eff.type, eff.target || null, eff.value, eff.probability ?? 1.0);
    }
  }

  return eventId;
}

module.exports = db;
module.exports.insertEvent = insertEvent;

// 迁移：确保 event_log 有 sudden 相关列
try {
  const cols = db.prepare("PRAGMA table_info(event_log)").all();
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('sudden_event_id')) {
    db.exec('ALTER TABLE event_log ADD COLUMN sudden_event_id INTEGER REFERENCES sudden_event_def(id)');
  }
  if (!colNames.includes('sudden_result')) {
    db.exec("ALTER TABLE event_log ADD COLUMN sudden_result TEXT DEFAULT '[]' CHECK(json_valid(sudden_result))");
  }
} catch (err) {
  console.error('Migration check failed:', err);
}

// 迁移：确保 life_state 有 is_active / ended_at / cause_of_death
try {
  const cols = db.prepare("PRAGMA table_info(life_state)").all();
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('is_active')) {
    db.exec('ALTER TABLE life_state ADD COLUMN is_active INTEGER DEFAULT 1');
  }
  if (!colNames.includes('ended_at')) {
    db.exec('ALTER TABLE life_state ADD COLUMN ended_at DATETIME DEFAULT NULL');
  }
  if (!colNames.includes('cause_of_death')) {
    db.exec('ALTER TABLE life_state ADD COLUMN cause_of_death TEXT DEFAULT NULL');
  }
} catch (err) {
  console.error('Life state migration failed:', err);
}

// 自动 seed，如果数据库为空
try {
  const hasData = db.prepare("SELECT COUNT(*) as count FROM event_def").get();
  if (!hasData || hasData.count === 0) {
    require('./seed');
  }
} catch (err) {
  console.error('Seed check failed:', err);
}

// 自动 seed 突发事件
try {
  const hasSudden = db.prepare("SELECT COUNT(*) as count FROM sudden_event_def").get();
  if (!hasSudden || hasSudden.count === 0) {
    require('./suddenSeed');
  }
} catch (err) {
  console.error('Sudden seed check failed:', err);
}
