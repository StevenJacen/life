const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'life.db');
const db = new Database(dbPath);

const textPath = path.join(__dirname, '..', '..', 'text.md');

function seedHumor() {
  const insert = db.prepare('INSERT INTO humor_library (content, category, tags) VALUES (?, ?, ?)');

  // 从 text.md 读取
  if (fs.existsSync(textPath)) {
    const lines = fs.readFileSync(textPath, 'utf-8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    for (const line of lines) {
      // 简单去重：检查是否已存在相同内容
      const existing = db.prepare('SELECT id FROM humor_library WHERE content = ?').get(line);
      if (!existing) {
        insert.run(line, 'general', JSON.stringify(['text_md']));
      }
    }
    console.log(`Inserted/updated ${lines.length} humor entries from text.md`);
  }

  // 生成 30 条初始幽默段子
  const initialHumors = [
    { content: '小时候以为“人到中年”是件很遥远的事，现在发现它不但不远，还带着体检报告一起来的。', category: 'daily', tags: ['health','age'] },
    { content: '上班的意义在于：让你深刻体会到，周末为什么是周末。', category: 'work', tags: ['weekend'] },
    { content: '我妈说我不结婚是因为太挑，其实我只是太穷。', category: 'family', tags: ['marriage','money'] },
    { content: '健身卡办了三年的，身体还是一年的，主打一个精神健身。', category: 'daily', tags: ['health'] },
    { content: '相亲对象问我有什么爱好，我说躺着。她说这不叫爱好，叫墓志铭。', category: 'social', tags: ['marriage'] },
    { content: '老板画的大饼，我不仅吃了，还学会了反刍。', category: 'work', tags: ['career'] },
    { content: '我的存款和头发一样，都在以肉眼可见的速度消失。', category: 'money', tags: ['daily'] },
    { content: '别人996是奋斗，我996是生存。区别就在于，人家有期权，我只有腰椎间盘突出。', category: 'work', tags: ['health'] },
    { content: '我妈问我什么时候买房，我说等房价降下来。她叹了口气，说那你可能要先买个墓地。', category: 'family', tags: ['money','housing'] },
    { content: '年轻人的崩溃从静音开始：手机静音，情绪静音，最后人生也静音了。', category: 'daily', tags: ['mental'] },
    { content: '朋友劝我理财，我说我的理财方式就是：不花。他说那叫守财奴，我说那叫苟延残喘。', category: 'money', tags: ['daily'] },
    { content: '小时候最怕考试，长大最怕体检。前者决定你上什么学，后者决定你还能上几天班。', category: 'daily', tags: ['health','work'] },
    { content: '有人说钱买不来快乐，那是因为他的钱还没多到可以不买票就进场。', category: 'money', tags: ['happiness'] },
    { content: '过年回家亲戚三连：有对象了吗？买房了吗？什么时候要孩子？我建议他们转行做人口普查。', category: 'family', tags: ['social'] },
    { content: '我的职业规划很简单：先活着，其他的以后再说。', category: 'work', tags: ['career'] },
    { content: '外卖软件知道我喜欢吃什么，支付软件知道我有多穷，它们比我妈还了解我。', category: 'daily', tags: ['money','consumption'] },
    { content: '领导说要有狼性，我说狼性得有肉吃。领导说要有梦想，我说我的梦想就是不加班。', category: 'work', tags: ['career'] },
    { content: '当代年轻人的养生：啤酒泡枸杞，可乐加党参，熬夜涂眼霜，蹦迪穿护膝。', category: 'daily', tags: ['health'] },
    { content: '我爸说我这一代太娇气，我说你那个年代分房，我们现在分的是花呗账单。', category: 'family', tags: ['money','housing'] },
    { content: '别人的人生是剧本杀，我的人生是恐怖密室——没有提示，还不能退出。', category: 'daily', tags: ['mental'] },
    { content: '每次打开衣柜都觉得自己没衣服穿，但每次搬家都发现衣服能装满一货车。', category: 'daily', tags: ['consumption'] },
    { content: '工资到账的五分钟是我一个月中最富有的时刻，之后我就回归赤贫。', category: 'money', tags: ['work'] },
    { content: '我妈让我少看手机，说对眼睛不好。我说不看手机，对生活不好。', category: 'family', tags: ['daily'] },
    { content: '曾经以为长大就可以自由支配时间，现在发现时间确实自由了——它自由地从指缝溜走了。', category: 'daily', tags: ['age'] },
    { content: '我朋友说他要裸辞gap year，我说你那叫失业，他说你不懂，那叫寻找人生意义。', category: 'work', tags: ['career'] },
    { content: '相亲市场上，我的条件是“三观正”，对方的要求是“全款房”。我们用的好像不是同一种货币。', category: 'social', tags: ['marriage','money'] },
    { content: '小时候想考清华北大，长大后想准时下班。梦想确实缩水了，但更接地气了。', category: 'work', tags: ['daily'] },
    { content: '父母的爱情：媒人介绍，一眼定终身。我们的爱情：左滑不喜欢，右滑没匹配。', category: 'social', tags: ['marriage'] },
    { content: '有人说生活不止眼前的苟且，还有诗和远方。我说远方需要车票，诗需要情怀，而我只有眼前的苟且。', category: 'daily', tags: ['mental','money'] },
    { content: '我的运动计划：买了瑜伽垫、办了健身卡、下了Keep。现在的运动量主要来自于在这些App之间切换。', category: 'daily', tags: ['health'] },
  ];

  for (const h of initialHumors) {
    const existing = db.prepare('SELECT id FROM humor_library WHERE content = ?').get(h.content);
    if (!existing) {
      insert.run(h.content, h.category, JSON.stringify(h.tags));
    }
  }
  console.log(`Inserted ${initialHumors.length} initial humor entries.`);
}

seedHumor();
db.close();
