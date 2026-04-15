const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const lifeEngine = require('./engine/lifeEngine');
const aiService = require('./services/aiService');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 创建新人生
app.post('/api/life', (req, res) => {
  try {
    const life = lifeEngine.createLife();
    res.json({ success: true, data: life });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取人生状态
app.get('/api/life/:id', (req, res) => {
  try {
    const life = lifeEngine.getLifeState(Number(req.params.id));
    if (!life) return res.status(404).json({ success: false, error: 'Life not found' });
    res.json({ success: true, data: life });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 下一年：获取事件和选项
app.post('/api/life/:id/next-turn', (req, res) => {
  try {
    const result = lifeEngine.nextTurn(Number(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 选择选项
app.post('/api/life/:id/choose', (req, res) => {
  try {
    const { optionId } = req.body;
    if (!optionId) return res.status(400).json({ success: false, error: 'optionId required' });
    const result = lifeEngine.chooseOption(Number(req.params.id), Number(optionId));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 跳过平淡的一年
app.post('/api/life/:id/skip-year', (req, res) => {
  try {
    const result = lifeEngine.skipYear(Number(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI 生成事件
app.post('/api/life/:id/generate-ai-event', async (req, res) => {
  try {
    const lifeId = Number(req.params.id);
    const state = lifeEngine.getLifeState(lifeId);
    if (!state) return res.status(404).json({ success: false, error: 'Life not found' });

    // 限制：同一人生每3年最多生成1次
    const recentAiLogs = db.prepare(`
      SELECT COUNT(*) as count FROM event_log
      WHERE life_id = ? AND event_id IN (
        SELECT id FROM event_def WHERE is_ai_generated = 1
      ) AND age >= ?
    `).get(lifeId, state.age - 3);

    if (recentAiLogs.count > 0) {
      return res.status(429).json({ success: false, error: '每3年最多生成1次AI事件，请稍后再试' });
    }

    const aiEvent = await aiService.generateEventByState(state);
    const eventId = db.insertEvent(aiEvent, true);

    res.json({ success: true, data: { eventId, ...aiEvent } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 刷新幽默库（读取 text.md）
app.post('/api/humor/refresh', (req, res) => {
  try {
    const textPath = path.join(__dirname, '..', 'text.md');
    if (!fs.existsSync(textPath)) {
      return res.json({ success: true, data: { inserted: 0, message: 'text.md not found' } });
    }

    const lines = fs.readFileSync(textPath, 'utf-8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const insert = db.prepare('INSERT INTO humor_library (content, category, tags) VALUES (?, ?, ?)');
    let inserted = 0;
    for (const line of lines) {
      const existing = db.prepare('SELECT id FROM humor_library WHERE content = ?').get(line);
      if (!existing) {
        insert.run(line, 'general', JSON.stringify(['text_md']));
        inserted++;
      }
    }

    res.json({ success: true, data: { inserted, total: lines.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 获取日志
app.get('/api/life/:id/logs', (req, res) => {
  try {
    const logs = lifeEngine.getLogs(Number(req.params.id));
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
