-- 人生状态表（存档）
CREATE TABLE IF NOT EXISTS life_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  age INTEGER DEFAULT 0,
  money INTEGER DEFAULT 0,
  attributes TEXT DEFAULT '{}' CHECK(json_valid(attributes)), -- JSON: {intelligence, health, happiness, charm}
  career TEXT DEFAULT 'unemployed',
  family_class TEXT DEFAULT 'normal',
  education_level TEXT DEFAULT 'none',
  happiness INTEGER DEFAULT 50,
  health INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 事件定义表
CREATE TABLE IF NOT EXISTS event_def (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_age INTEGER DEFAULT 0,
  max_age INTEGER DEFAULT 999,
  repeatable INTEGER DEFAULT 0,
  once_per_life INTEGER DEFAULT 1,
  weight_formula TEXT DEFAULT '{"base":100}' CHECK(json_valid(weight_formula)),
  parent_event_id INTEGER DEFAULT NULL,
  is_ai_generated INTEGER DEFAULT 0
);

-- 中式幽默信息库
CREATE TABLE IF NOT EXISTS humor_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT DEFAULT '[]' CHECK(json_valid(tags)),
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 事件触发条件（复杂条件代码过滤）
CREATE TABLE IF NOT EXISTS event_condition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES event_def(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('attribute','money','career','family','age','education')),
  operator TEXT NOT NULL CHECK(operator IN ('>','<','=','>=','<=','in','!=')),
  target TEXT DEFAULT NULL,
  value TEXT NOT NULL
);

-- 事件选项
CREATE TABLE IF NOT EXISTS event_option (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES event_def(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT DEFAULT ''
);

-- 选项效果
CREATE TABLE IF NOT EXISTS event_effect (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_id INTEGER NOT NULL REFERENCES event_option(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('money','attribute','career','education','happiness','health','family')),
  target TEXT DEFAULT NULL,
  value INTEGER DEFAULT 0,
  probability REAL DEFAULT 1.0
);

-- 事件日志
CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  life_id INTEGER NOT NULL REFERENCES life_state(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  event_id INTEGER REFERENCES event_def(id),
  option_id INTEGER REFERENCES event_option(id),
  result TEXT DEFAULT '{}' CHECK(json_valid(result)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
