const db = require('./db');

try {
  db.exec(`CREATE TABLE IF NOT EXISTS humor_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]' CHECK(json_valid(tags)),
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('humor_library table ensured');
} catch (e) {
  console.log('humor_library error:', e.message);
}

try {
  db.exec(`ALTER TABLE event_def ADD COLUMN is_ai_generated INTEGER DEFAULT 0`);
  console.log('is_ai_generated column added');
} catch (e) {
  console.log('is_ai_generated error:', e.message);
}

const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', JSON.stringify(rows.map(r => r.name)));
