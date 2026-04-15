
# 一、事件引擎整体流程（核心逻辑）

每一“年/回合”执行一次：

```text
1️⃣ 获取当前 life_state  
2️⃣ 筛选可触发事件（SQL过滤基础条件）  
3️⃣ 进一步用代码过滤复杂条件  
4️⃣ 计算每个事件概率权重  
5️⃣ 抽取一个事件（加权随机）  
6️⃣ 返回事件 + 选项  
7️⃣ 玩家选择 option  
8️⃣ 执行 event_effect（更新状态）  
9️⃣ 写入 event_log  
🔁 进入下一回合
```

---

# 二、事件筛选（SQL + 条件）

## 🎯 第一步：基础筛选（用SQL做80%过滤）

```sql
SELECT *
FROM event_def
WHERE 
  min_age <= :age
  AND max_age >= :age
```

👉 只做：

* 年龄
* 是否可重复

---

## 🎯 第二步：条件过滤（代码做）

从 `event_condition` 表取出：

```sql
SELECT * FROM event_condition WHERE event_id = ?
```

---

## 🧠 条件解析逻辑（核心）

支持这些类型：

| type      | 示例                |
| --------- | ----------------- |
| attribute | intelligence > 80 |
| money     | money >= 10000    |
| career    | career = doctor   |
| family    | family = rich     |
| age       | age > 18          |

---

## 🧩 条件判断伪代码

```javascript
function checkCondition(condition, state) {
  const { type, operator, value } = condition;

  let actual;

  switch (type) {
    case "attribute":
      actual = state.attributes[value.key];
      break;
    case "money":
      actual = state.money;
      break;
    case "career":
      actual = state.career;
      break;
    case "family":
      actual = state.family_class;
      break;
    case "age":
      actual = state.age;
      break;
  }

  return compare(actual, operator, value);
}
```

---

## ⚙️ compare函数

```javascript
function compare(a, op, b) {
  switch (op) {
    case ">": return a > b;
    case "<": return a < b;
    case "=": return a == b;
    case ">=": return a >= b;
    case "<=": return a <= b;
    case "in": return b.includes(a);
  }
}
```

---

# 三、概率计算（核心差异点🔥）

## 🎯 基础模型

```text
最终权重 = 基础权重 × 属性修正 × 环境修正
```

---

## 🧠 示例

```text
高考事件：
base_weight = 100

如果 intelligence > 80 → ×1.5
如果 family=rich → ×1.2
如果 happiness < 30 → ×0.8
```

---

## 🧩 实现方式（推荐）

在 `event_def` 增加：

```sql
weight_formula JSONB
```

示例：

```json
{
  "base": 100,
  "modifiers": [
    {
      "condition": "intelligence > 80",
      "multiplier": 1.5
    },
    {
      "condition": "family = rich",
      "multiplier": 1.2
    }
  ]
}
```

---

## 🧠 权重计算伪代码

```javascript
function calculateWeight(event, state) {
  let weight = event.base_weight;

  for (let mod of event.modifiers) {
    if (evalCondition(mod.condition, state)) {
      weight *= mod.multiplier;
    }
  }

  return weight;
}
```

---

# 四、事件抽取（加权随机）

## 🎯 标准算法

```javascript
function weightedRandom(events) {
  const total = events.reduce((sum, e) => sum + e.weight, 0);

  let rand = Math.random() * total;

  for (let e of events) {
    if (rand < e.weight) return e;
    rand -= e.weight;
  }
}
```

---

# 五、选项执行（核心）

## 🎯 获取选项

```sql
SELECT * FROM event_option WHERE event_id = ?
```

---

## 🎯 获取效果

```sql
SELECT * FROM event_effect WHERE option_id = ?
```

---

## 🧠 执行 effect

```javascript
function applyEffect(effect, state) {
  switch (effect.type) {
    case "money":
      state.money += effect.value;
      break;

    case "attribute":
      state.attributes[effect.target] += effect.value;
      break;

    case "career":
      state.career = effect.value;
      break;
  }
}
```

---

## 🎲 概率效果（关键）

```javascript
if (Math.random() < effect.probability) {
  applyEffect(effect);
}
```

---

# 六、状态更新 + 日志

## 🎯 更新 life_state

```sql
UPDATE life_state
SET 
  money = ?,
  intelligence = ?,
  career = ?
WHERE life_id = ?
```

---

## 🎯 插入 event_log

```sql
INSERT INTO event_log (
  life_id,
  age,
  event_id,
  option_id,
  result
) VALUES (?, ?, ?, ?, ?)
```

---

# 七、完整流程伪代码（可直接改代码🔥）

```javascript
function nextTurn(lifeId) {
  const state = getLifeState(lifeId);

  // 1. 获取候选事件
  let events = getEventsByAge(state.age);

  // 2. 条件过滤
  events = events.filter(e =>
    checkAllConditions(e.conditions, state)
  );

  // 3. 计算权重
  events.forEach(e => {
    e.weight = calculateWeight(e, state);
  });

  // 4. 抽取事件
  const event = weightedRandom(events);

  // 5. 返回给前端
  return {
    event,
    options: getOptions(event.id)
  };
}
```

---

# 八、进阶优化（你后面一定会用到）

## ⭐ 1. 事件冷却（避免重复）

在 `event_log` 里判断：

```sql
SELECT COUNT(*) FROM event_log
WHERE life_id = ?
AND event_id = ?
```

---

## ⭐ 2. 事件互斥

比如：

* 上大学后不能再触发“高中事件”

👉 在 condition 加：

```text
education_level != highschool
```

---

## ⭐ 3. 事件链（剧情）

👉 增加字段：

```sql
parent_event_id
```

---

## ⭐ 4. AI事件（未来扩展）

你可以：

* 用LLM生成事件
* 存入 event_def

---

# 九、你现在可以直接做的事（强烈建议）

先实现：

### ✅ MVP事件链（10个事件）

* 出生
* 上学
* 高考
* 工作
* 结婚
* 投资
* 生病
* 创业
* 破产
* 退休

👉 跑通一轮人生

---

# 十、如果你继续往下，我可以帮你👇

我可以直接帮你做：

