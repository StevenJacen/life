需求：中式人生模拟器 Demo

1. 题目目标利用 Vibe Coding的力量，在3天时间内搭建一个好玩、丝滑、充满“中式幽默”的人生模拟器网页版。

2. 需要交付一个完整的 Web Demo，包含以下两个部分：
前端展示：用户填写名字后自动生成初始属性。
人生推进：点击按钮屏幕上滚出这一年的离奇经历（可自动显示内容，也可以用户点击后才跳转）。

视觉风格：不限。

后端支撑：
随机事件引擎：根据玩家属性动态筛选事件（例如：家里没钱可能触发“搬砖”，颜值高可能触发“出道”）。
AI 叙事集成：这是加分项， 尝试接入 AI 接口，根据当前年份和玩家状态，实时生成一段带有吐槽风格的文案。

3. 技术栈建议你可以自由组合，但我们团队比较擅长以下工具（建议优先考虑以便后续交流）：TypeScript / Next.js / Node.js / Python    方案:# 🎯 一、出生家庭系统定位

> ❗不是背景设定，而是**长期影响人生概率的“底层参数”**

---

# 🧩 二、家庭系统设计（最终方案）

---

## 1️⃣ 数据结构

```ts id="b1r4p0"
type Family = {
  type: string
  moneyBase: number
  intelligenceBase: number
  networkBase: number   // 人脉/资源（隐藏属性）
  description: string
}
```

---

## 2️⃣ 家庭类型（推荐6类）

---

## 🟦 1. 富裕家庭（RICH）【高起点】

```ts id="u0yyzz"
{
  type: "RICH",
  moneyBase: 80,
  intelligenceBase: 60,
  networkBase: 80,
  description: "你出生在一个富裕家庭"
}
```

特点：

* 💰 钱多
* 🤝 资源多
* 🎯 容错率高

---

## 🟩 2. 体制内家庭（SYSTEM）【稳定】

```ts id="0mj4ss"
{
  type: "SYSTEM",
  moneyBase: 60,
  intelligenceBase: 65,
  networkBase: 70,
  description: "你出生在体制内家庭"
}
```

特点：

* 📈 稳定路线
* 🧾 更容易“上岸”

---

## 🟨 3. 教师家庭（EDUCATED）【重教育】

```ts id="2i8ryj"
{
  type: "EDUCATED",
  moneyBase: 50,
  intelligenceBase: 75,
  networkBase: 50,
  description: "你出生在教师家庭"
}
```

特点：

* 📚 学习加成
* 💰 钱一般

---

## 🟥 4. 普通家庭（NORMAL）

```ts id="r0x7rf"
{
  type: "NORMAL",
  moneyBase: 50,
  intelligenceBase: 50,
  networkBase: 50,
  description: "你出生在普通家庭"
}
```

---

## 🟧 5. 贫困家庭（POOR）

```ts id="j9pjk3"
{
  type: "POOR",
  moneyBase: 20,
  intelligenceBase: 45,
  networkBase: 20,
  description: "你出生在一个拮据的家庭"
}
```

特点：

* 💸 压力大
* 🎯 更容易进入“打工/极端路径”

---

## 🟪 6. 经商家庭（BUSINESS）

```ts id="8cggjn"
{
  type: "BUSINESS",
  moneyBase: 65,
  intelligenceBase: 50,
  networkBase: 75,
  description: "你出生在经商家庭"
}
```

特点：

* 💼 更容易创业
* 📉 风险也更大

---

# 🎲 三、出生逻辑

---

## 随机分布（建议）

```ts id="k6j9r6"
RICH: 5%
SYSTEM: 15%
EDUCATED: 15%
NORMAL: 40%
POOR: 20%
BUSINESS: 5%
```

---

## 初始化玩家

```ts id="vrb4oa"
player.money = family.moneyBase + rand(-10, 10)
player.intelligence = family.intelligenceBase + rand(-10, 10)
```

---

👉 并输出：

```text id="ymhflj"
👉 你出生在一个教师家庭
👉 家里对你寄予厚望
```

---

# 🌍 四、家庭如何影响人生（核心）

---

# 1️⃣ 影响事件概率

---

### 🎓 学习路径

```ts id="54mzyu"
if (family === "EDUCATED") {
  → 学习类事件权重 +30%
}
```

---

### 💼 体制路线

```ts id="03dbu4"
if (family === "SYSTEM") {
  → 考公/稳定工作概率 ↑
}
```

---

### 🚀 创业

```ts id="41np0j"
if (family === "BUSINESS") {
  → 创业事件权重 ↑
}
```

---

### 🟥 贫困路径

```ts id="8wy65z"
if (family === "POOR") {
  → 打工 / 搬砖 / 早入社会 ↑
}
```

---

# 2️⃣ 影响“容错率”（很关键）

---

### 💰 富裕家庭

```text id="rqntzv"
创业失败：
👉 家里帮你兜底
```

---

### 🟥 贫困家庭

```text id="j67vwe"
创业失败：
👉 直接负债
👉 进入拮据/乞讨路径
```

---

👉 这就是：

> ❗同样选择，不同出身 → 不同人生

---

# 3️⃣ 影响隐藏属性（network）

---

👉 你可以用一个隐藏值：

```ts id="v3i6g2"
network
```

---

### 用法：

```ts id="q9nxzo"
if (network > 70) {
  → 更容易：
    "被推荐工作"
    "获得机会"
}
```

---

# 🧠 五、与人生路径系统融合

---

## 示例流程

---

### 👶 出生

```text id="7smqzw"
👉 你出生在普通家庭
```

---

### 🎓 成长

```text id="x3f9km"
👉 家庭资源有限
👉 你更早开始考虑赚钱
```

---

### 💼 选择

```text id="wx7vho"
👉 你选择创业
```

---

👉 不同家庭结果：

---

#### 富裕家庭：

```text id="7jowkq"
👉 家里支持你创业
👉 你有试错空间
```

---

#### 贫困家庭：

```text id="1otx6t"
👉 你孤注一掷
👉 失败后生活陷入困境
```

---

# 🎮 六、事件扩展（家庭专属事件）

---

## 🟦 富裕家庭

```ts id="7avwsy"
[
"家里帮你安排了实习",
"你不用为房租发愁",
"你有更多试错机会",
"你开始思考人生意义"
]
```

---

## 🟥 贫困家庭

```ts id="v0ryhn"
[
"你很早就开始打工",
"你需要承担家庭压力",
"你对钱更加敏感",
"你更早面对现实"
]
```

---

## 🟩 体制家庭

```ts id="c4xq6l"
[
"家里建议你考公",
"你开始关注编制信息",
"你被安排参加考试",
"你逐渐接受稳定路线"
]
```

---

# ⚠️ 七、设计注意点（很重要）

---

## ❌ 不要让“出身决定一切”

必须保证：

```text id="gn7xt5"
低出身 → 仍然可以逆袭
高出身 → 也可能失败
```

---

## ✅ 正确设计：

> 出身影响“概率”，不是“结果”

---

# 🚀 八、最终系统整合

---

```text id="94j0oe"
出生 →
  家庭决定初始属性 →

人生推进 →
  lifeState + money + family →

影响：
  事件概率
  选择结果
  容错率

→ 形成不同人生路径
```

---

# 🎯 九、最终体验提升点

用户会感受到：

* “这局出生不错/不太行”
* “同样选择结果不同”
* “想重开试不同出身”

👉 这就是**重玩动力**

---