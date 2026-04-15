/**
 * 出生地系统 - 中国各省份及其历史事件
 */

export type BirthplaceType = 
  // 传统省份
  | 'beijing' | 'shanghai' | 'guangdong' | 'sichuan' | 'hongkong' | 'macau'
  | 'tianjin' | 'chongqing' | 'jiangsu' | 'zhejiang' | 'fujian' | 'shandong'
  // 自嘲戏谑类出生地
  | 'first_tier_city'      // 北上广深：一线城市卷王
  | 'small_county_town'    // 十八线小县城：躺平圣地
  | 'northeast_rust_belt'  // 东北老工业基地：重工业烧烤
  | 'urban_rural_fringe'   // 城乡结合部：城乡混血
  | 'viral_tourist_city'   // 网红旅游城市：蚌埠住了
  | 'xiongan_new_area';    // 雄安新区：未来可期

export interface Birthplace {
  id: BirthplaceType;
  name: string;
  emoji: string;
  region: string;
  description: string;
  events: BirthplaceEvent[];
}

export interface SideQuest {
  id: string;
  title: string;
  description: string;
  requirements: {
    minAge?: number;
    maxAge?: number;
    minStats?: Partial<Record<'money' | 'intelligence' | 'appearance' | 'health' | 'happiness', number>>;
  };
  effects: {
    money?: number;
    intelligence?: number;
    appearance?: number;
    health?: number;
    happiness?: number;
  };
  lifeStateChange?: string;
  successRate: number; // 0-1
  successNarrative: string;
  failureNarrative: string;
}

export interface BirthplaceEvent {
  year: number;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  statEffects?: {
    money?: number;
    intelligence?: number;
    happiness?: number;
    health?: number;
    appearance?: number;
  };
  sideQuests?: SideQuest[];
}

export const BIRTHPLACES: Birthplace[] = [
  {
    id: 'beijing',
    name: '北京',
    emoji: '🏛️',
    region: 'north',
    description: '祖国的首都，政治文化中心',
    events: [
      { 
        year: 2001, 
        title: '北京申奥成功', 
        description: '2001年7月13日，北京获得2008年奥运会主办权', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'olympic_athlete',
            title: '投身奥运梦想',
            description: '申奥成功的消息点燃了你的运动热情，你决定成为运动员为国争光',
            requirements: { minAge: 6, maxAge: 16, minStats: { health: 60 } },
            effects: { money: -20, health: -15, happiness: 20, appearance: 10 },
            lifeStateChange: 'athlete',
            successRate: 0.3,
            successNarrative: '经过多年苦练，你终于在省队崭露头角，成为了一名职业运动员。虽然训练艰苦，但每当想起2001年那个激动人心的夜晚，你就充满了力量。',
            failureNarrative: '现实是残酷的，你的天赋并不出众，多年的苦练只换来一身伤病。你黯然退役，但那段为梦想拼搏的日子，成了你人生中最珍贵的回忆。'
          },
          {
            id: 'olympic_volunteer',
            title: '成为奥运志愿者',
            description: '你想亲身体验奥运，报名成为一名志愿者',
            requirements: { minAge: 16, maxAge: 30 },
            effects: { money: -5, happiness: 15, intelligence: 5 },
            successRate: 0.8,
            successNarrative: '你幸运地成为了一名奥运志愿者，亲历了那场盛会。虽然辛苦，但那种与全世界一起欢呼的感觉，让你终生难忘。',
            failureNarrative: '报名的人太多了，你没有被选上。但你在家门口感受到了奥运的氛围，也算不虚此行。'
          }
        ]
      },
      { 
        year: 2008, 
        title: '北京奥运会', 
        description: '2008年8月8日，第29届夏季奥林匹克运动会在北京开幕', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'watch_opening',
            title: '现场观看开幕式',
            description: '你想亲眼见证这历史性的时刻，哪怕要花掉所有积蓄',
            requirements: { minAge: 10 },
            effects: { money: -30, happiness: 25 },
            successRate: 0.9,
            successNarrative: '当你亲眼看到那29个脚印烟花走向鸟巢时，泪水模糊了双眼。这一晚，你为自己的祖国感到无比自豪。',
            failureNarrative: '票价被炒得太高了，你只能在电视机前观看。但当国歌响起时，你依然热泪盈眶。'
          }
        ]
      },
      { 
        year: 2015, 
        title: '雾霾红色预警', 
        description: '2015年12月，北京首次发布空气重污染红色预警', 
        impact: 'negative',
        sideQuests: [
          {
            id: 'leave_beijing',
            title: '逃离北京',
            description: '雾霾让你窒息，你决定离开这座城市',
            requirements: { minAge: 18 },
            effects: { money: -10, health: 10, happiness: 5 },
            lifeStateChange: 'migrant',
            successRate: 0.7,
            successNarrative: '你南下到了深圳，虽然一切从头开始，但每天都能呼吸到新鲜空气，你觉得这个决定是对的。',
            failureNarrative: '你尝试了其他城市，但发现哪里都有各自的问题。最终还是回到了北京，学会了在雾霾中生存。'
          },
          {
            id: 'buy_mask',
            title: '投资防霾产业',
            description: '你嗅到了商机，决定投资防霾口罩和空气净化器',
            requirements: { minAge: 18, minStats: { money: 40 } },
            effects: { money: 20, health: -5, happiness: -5 },
            successRate: 0.5,
            successNarrative: '你的投资眼光独到，防霾产品大卖，你赚了一笔。但看着窗外灰蒙蒙的天空，你心情复杂。',
            failureNarrative: '市场竞争太激烈了，你的投资血本无归。你戴着自己滞销的口罩，在雾霾中苦笑。'
          }
        ]
      }
    ]
  },
  {
    id: 'shanghai',
    name: '上海',
    emoji: '🌃',
    region: 'east',
    description: '魔都，国际金融中心',
    events: [
      { 
        year: 1990, 
        title: '浦东开发开放', 
        description: '1990年4月18日，中共中央宣布开发开放上海浦东', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'invest_pudong',
            title: '投资浦东房产',
            description: '你看到了机会，决定借钱在浦东买房',
            requirements: { minAge: 18, minStats: { money: 20 } },
            effects: { money: 50, happiness: 10 },
            successRate: 0.4,
            successNarrative: '你的眼光超前，浦东房价翻了几十倍。你成了千万富翁，在陆家嘴有了一套江景房。',
            failureNarrative: '你看对了方向，但时机不对，背负了多年的房贷压力。不过最终房子还是升值了，只是没有想象中那么多。'
          },
          {
            id: 'work_pudong',
            title: '去浦东闯荡',
            description: '你决定辞去铁饭碗，去浦东寻找机会',
            requirements: { minAge: 18 },
            effects: { money: 10, happiness: 15, health: -5 },
            lifeStateChange: 'business',
            successRate: 0.6,
            successNarrative: '你在浦东从销售做起，赶上了外企涌入的黄金年代，成了外企高管，年薪百万。',
            failureNarrative: '浦东的机会多，竞争也激烈。你折腾了几年，最终还是回到了原来的单位，但那段经历让你眼界大开。'
          }
        ]
      },
      { 
        year: 2010, 
        title: '上海世博会', 
        description: '2010年5月1日，第41届世界博览会在上海开幕', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'expo_guide',
            title: '做世博讲解员',
            description: '你想成为世博会的一名讲解员，向世界介绍中国',
            requirements: { minAge: 18, maxAge: 28, minStats: { intelligence: 50, appearance: 50 } },
            effects: { money: 5, happiness: 20, intelligence: 5 },
            successRate: 0.6,
            successNarrative: '你凭借出色的外语和仪态，成为了中国馆的讲解员。那段日子你接待了无数外宾，结识了各国朋友。',
            failureNarrative: '面试很严格，你没有被选上。但你买了张门票，参观了世博会，看到了世界各地的新奇事物。'
          }
        ]
      }
    ]
  },
  {
    id: 'guangdong',
    name: '广东',
    emoji: '🔥',
    region: 'south',
    description: '改革开放的前沿阵地，经济第一大省',
    events: [
      { 
        year: 1978, 
        title: '改革开放', 
        description: '广东作为改革开放先行区，深圳、珠海、汕头设立经济特区', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'go_shenzhen',
            title: '下海经商',
            description: '你决定辞去工作，去深圳闯一闯',
            requirements: { minAge: 18 },
            effects: { money: 30, happiness: 10, health: -10 },
            lifeStateChange: 'business',
            successRate: 0.4,
            successNarrative: '你从摆地摊开始，逐步有了自己的工厂。九十年代，你成了"万元户"，后来又成了千万富翁。',
            failureNarrative: '深圳的机遇多，陷阱也多。你被骗光了积蓄，狼狈地回到了老家。但你不甘心，后来又去了几次，终于站稳了脚跟。'
          },
          {
            id: 'factory_worker',
            title: '进厂打工',
            description: '你听说深圳的工厂招工，决定去做打工仔',
            requirements: { minAge: 16 },
            effects: { money: 15, happiness: -10, health: -15 },
            lifeStateChange: 'worker',
            successRate: 0.7,
            successNarrative: '你在电子厂干了几年，省吃俭用攒下了一笔钱。后来你用这笔钱开了个小店，成了小老板。',
            failureNarrative: '工厂的生活枯燥辛苦，你干了两年就坚持不下去了。但你见识了外面的世界，这改变了你的人生观。'
          }
        ]
      },
      { 
        year: 2003, 
        title: '非典疫情', 
        description: '2003年，广东是非典疫情的重灾区', 
        impact: 'negative',
        sideQuests: [
          {
            id: 'sars_doctor',
            title: '投身抗疫一线',
            description: '你是一名医护人员，主动请缨去抗击非典',
            requirements: { minAge: 22, minStats: { health: 60, intelligence: 50 } },
            effects: { money: 5, health: -20, happiness: 30 },
            lifeStateChange: 'medical',
            successRate: 0.8,
            successNarrative: '你在隔离病房奋战了几个月，虽然感染了病毒，但你救活了很多病人。康复后，你成了人们心中的英雄。',
            failureNarrative: '你太年轻了，医院没有批准你去一线。你只能在后方做后勤，但那段日子依然让你终生难忘。'
          },
          {
            id: 'sars_evacuate',
            title: '逃离广东',
            description: '疫情太可怕了，你决定暂时离开广东',
            requirements: { minAge: 18 },
            effects: { money: -10, health: 5, happiness: -5 },
            successRate: 0.9,
            successNarrative: '你回到了老家躲过了疫情。三个月后你回来，发现物是人非，但庆幸自己还活着。',
            failureNarrative: '你想逃，但交通封锁了。你被困在广东，和所有人一起度过了那段艰难的日子。'
          }
        ]
      }
    ]
  },
  {
    id: 'sichuan',
    name: '四川',
    emoji: '🐼',
    region: 'west',
    description: '天府之国，美食天堂',
    events: [
      { 
        year: 2008, 
        title: '汶川地震', 
        description: '2008年5月12日，汶川发生8.0级特大地震', 
        impact: 'negative',
        sideQuests: [
          {
            id: 'quake_rescue',
            title: '参与救援',
            description: '地震发生后，你立即前往灾区参与救援',
            requirements: { minAge: 18, minStats: { health: 50 } },
            effects: { money: -5, health: -15, happiness: 25 },
            successRate: 0.7,
            successNarrative: '你在废墟中救出了三名幸存者。虽然手上磨出了血泡，但当你看到被救者眼中的泪光时，你觉得一切都值得。',
            failureNarrative: '你想去救援，但道路被毁，你无法进入灾区。你只能在后方捐款捐物，默默祈祷。'
          },
          {
            id: 'quake_donate',
            title: '倾囊相助',
            description: '你捐出了所有积蓄帮助灾区重建',
            requirements: { minAge: 18 },
            effects: { money: -50, happiness: 20 },
            successRate: 0.95,
            successNarrative: '你捐的钱帮助了一个失学儿童重返校园。十年后，那个孩子考上重点大学，特意写信感谢你。',
            failureNarrative: '你的积蓄不多，捐款后生活更加拮据。但看着灾区的孩子们重新走进教室，你觉得这钱花得值。'
          }
        ]
      },
      { year: 1997, title: '重庆直辖', description: '1997年，原属四川的重庆市成为直辖市', impact: 'neutral' }
    ]
  },
  {
    id: 'hongkong',
    name: '香港',
    emoji: '🌟',
    region: 'special',
    description: '东方之珠，国际金融中心',
    events: [
      { 
        year: 1997, 
        title: '香港回归', 
        description: '1997年7月1日，香港回归祖国，结束英国殖民统治', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'hk_ceremony',
            title: '参加回归庆典',
            description: '你想亲眼见证这个历史时刻',
            requirements: { minAge: 6 },
            effects: { happiness: 15, intelligence: 5 },
            successRate: 0.5,
            successNarrative: '你在人群中看着英国国旗降下，五星红旗升起，那一刻你为自己是中国人而自豪。',
            failureNarrative: '你没有拿到庆典的入场券，只能在电视前观看。但那种激动人心的感觉，你至今难忘。'
          },
          {
            id: 'hk_immigrate',
            title: '移民海外',
            description: '你对回归后的前景担忧，决定移民',
            requirements: { minAge: 18, minStats: { money: 60 } },
            effects: { money: -40, happiness: -10 },
            successRate: 0.6,
            successNarrative: '你移民到了加拿大，过上了平静的生活。但每当看到香港的新闻，你总会想起那个决定。',
            failureNarrative: '移民申请被拒了。你留在了香港，发现回归后的生活并没有想象中那么糟。'
          }
        ]
      },
      { 
        year: 2003, 
        title: '非典疫情', 
        description: '2003年，香港受非典严重影响', 
        impact: 'negative',
        sideQuests: [
          {
            id: 'hk_stock',
            title: '抄底股市',
            description: '股市暴跌，你觉得这是抄底的好机会',
            requirements: { minAge: 18, minStats: { money: 40, intelligence: 60 } },
            effects: { money: 40, health: -10, happiness: -5 },
            successRate: 0.4,
            successNarrative: '你赌对了，疫情过后股市反弹，你赚了一大笔。但你付出的代价是差点感染病毒。',
            failureNarrative: '你以为到底了，结果还有地下室。股市继续下跌，你损失惨重。'
          }
        ]
      }
    ]
  },
  {
    id: 'macau',
    name: '澳门',
    emoji: '🎰',
    region: 'special',
    description: '东方拉斯维加斯',
    events: [
      { 
        year: 1999, 
        title: '澳门回归', 
        description: '1999年12月20日，澳门回归祖国', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'casino_work',
            title: '进入博彩业',
            description: '回归后澳门博彩业开放，你想去赌场工作',
            requirements: { minAge: 21, minStats: { appearance: 50 } },
            effects: { money: 25, happiness: -10, health: -5 },
            lifeStateChange: 'casino',
            successRate: 0.6,
            successNarrative: '你成了威尼斯人酒店的荷官，见识了人性的贪婪与欲望。你学会了在金钱面前保持冷静。',
            failureNarrative: '你没有通过背景调查，没能进入赌场。你转向了旅游服务业，同样过得不错。'
          }
        ]
      }
    ]
  },
  {
    id: 'tianjin',
    name: '天津',
    emoji: '🏭',
    region: 'north',
    description: '渤海明珠，工业重镇',
    events: [
      { 
        year: 2015, 
        title: '天津港爆炸', 
        description: '2015年8月12日，天津港发生特别重大火灾爆炸事故', 
        impact: 'negative',
        sideQuests: [
          {
            id: 'tianjin_rescue',
            title: '参与救援',
            description: '爆炸发生后，你立即前往现场参与救援',
            requirements: { minAge: 18, minStats: { health: 60 } },
            effects: { money: -5, health: -20, happiness: 30 },
            successRate: 0.8,
            successNarrative: '你在火场边缘救出了几名被困群众，但吸入了大量有毒气体。医生说你的肺留下了永久损伤，但你不后悔。',
            failureNarrative: '你想去救援，但现场已经被封锁。你只能在医院做志愿者，照顾受伤的市民。'
          },
          {
            id: 'tianjin_relocate',
            title: '搬离天津',
            description: '这次爆炸让你对这座城市失去了安全感，你决定离开',
            requirements: { minAge: 18 },
            effects: { money: -15, health: 5, happiness: 5 },
            successRate: 0.8,
            successNarrative: '你搬到了南方的一座小城，虽然收入减少了，但睡眠质量好了很多。',
            failureNarrative: '你想离开，但工作和孩子都在这里。你留了下来，学会了与不安共存。'
          }
        ]
      }
    ]
  },
  {
    id: 'chongqing',
    name: '重庆',
    emoji: '🌉',
    region: 'west',
    description: '山城，火锅之都',
    events: [
      { year: 1997, title: '重庆直辖', description: '1997年，重庆成为直辖市', impact: 'positive' }
    ]
  },
  {
    id: 'jiangsu',
    name: '江苏',
    emoji: '🏞️',
    region: 'east',
    description: '鱼米之乡，教育大省',
    events: []
  },
  {
    id: 'zhejiang',
    name: '浙江',
    emoji: '💰',
    region: 'east',
    description: '民营经济发达，电商之都杭州所在地',
    events: [
      { 
        year: 2016, 
        title: 'G20杭州峰会', 
        description: '2016年9月，二十国集团领导人第十一次峰会在杭州举行', 
        impact: 'positive',
        sideQuests: [
          {
            id: 'g20_volunteer',
            title: '成为G20志愿者',
            description: '你想参与这场国际盛会，展现杭州青年的风采',
            requirements: { minAge: 18, maxAge: 28, minStats: { intelligence: 60, appearance: 60 } },
            effects: { happiness: 20, intelligence: 5, appearance: 5 },
            successRate: 0.4,
            successNarrative: '你经过层层选拔，成为了G20的志愿者。你接待了几位外国元首，还上了电视新闻。',
            failureNarrative: '报名人数太多，你没有被选上。但你守在电视机前看完了全程直播。'
          },
          {
            id: 'g20_business',
            title: '借机做生意',
            description: '你想趁着峰会游客多，做点小生意',
            requirements: { minAge: 18 },
            effects: { money: 15, happiness: 5 },
            successRate: 0.6,
            successNarrative: '你在西湖边摆摊卖纪念品，峰会那几天生意特别好，赚了不少。',
            failureNarrative: '城管管得很严，你的摊子被没收了几次。最后只赚了个辛苦钱。'
          }
        ]
      }
    ]
  },
  {
    id: 'fujian',
    name: '福建',
    emoji: '🏔️',
    region: 'east',
    description: '八闽大地，海上丝绸之路起点',
    events: []
  },
  {
    id: 'shandong',
    name: '山东',
    emoji: '🌊',
    region: 'east',
    description: '孔孟之乡，齐鲁大地',
    events: []
  },
  // ===== 自嘲戏谑类出生地 =====
  {
    id: 'first_tier_city',
    name: '北上广深',
    emoji: '🏙️',
    region: 'special',
    description: '出生自带房奴光环，幼儿园开始刷KPI，主打一个"卷得体面"',
    events: [
      { 
        year: 2008, 
        title: '天价学区房', 
        description: '你爸妈为了让你上重点小学，卖了老家的房子，在城中村租了间十平米的隔断间。', 
        impact: 'negative',
        statEffects: { money: -30, happiness: -10 }
      },
      { 
        year: 2015, 
        title: '早教军备竞赛', 
        description: '三岁的你已经掌握了英语、钢琴、编程和马术。别的小朋友还在玩泥巴，你已经在准备幼升小面试了。', 
        impact: 'negative',
        statEffects: { intelligence: 10, happiness: -20, health: -5 }
      },
      { 
        year: 2020, 
        title: '内卷元年', 
        description: '你终于明白，在一线城市，连呼吸都是要排队的。', 
        impact: 'neutral',
        statEffects: { happiness: -5 }
      }
    ]
  },
  {
    id: 'small_county_town',
    name: '十八线小县城',
    emoji: '🏘️',
    region: 'special',
    description: '出门左转是网吧，右转是沙场，人生选择不多但容错率极高',
    events: [
      { 
        year: 2005, 
        title: '县城文学觉醒', 
        description: '你在县图书馆发现了《平凡的世界》，突然觉得自己也能去外面的世界看看。但想了想，还是网吧的空调比较凉快。', 
        impact: 'positive',
        statEffects: { intelligence: 5, happiness: 5 }
      },
      { 
        year: 2010, 
        title: '拆迁梦碎', 
        description: '听说要修高速公路，全村人都在等拆迁。结果路线改道了，你的富豪梦推迟了至少三代人。', 
        impact: 'negative',
        statEffects: { happiness: -10, money: -5 }
      },
      { 
        year: 2018, 
        title: '直播带货风口', 
        description: '你二舅开始在快手上卖土特产，三个月赚了你在工厂三年的工资。你陷入了深深的自我怀疑。', 
        impact: 'positive',
        statEffects: { money: 10, happiness: 5 }
      }
    ]
  },
  {
    id: 'northeast_rust_belt',
    name: '东北老工业基地',
    emoji: '🍖',
    region: 'special',
    description: '轻工业直播，重工业烧烤，人生哲学是"凑合过呗，还能离咋地"',
    events: [
      { 
        year: 1998, 
        title: '下岗潮余波', 
        description: '你爸从工厂下岗了，但他并不难过，因为终于可以专心研究烧烤配方了。', 
        impact: 'neutral',
        statEffects: { money: -10, happiness: 5 }
      },
      { 
        year: 2010, 
        title: '直播元年', 
        description: '你发现东北人似乎天生适合直播。你表姐在快手教人说话，月入十万，靠的是那股东北碴子味儿。', 
        impact: 'positive',
        statEffects: { appearance: 5, money: 5 }
      },
      { 
        year: 2019, 
        title: '烧烤之王', 
        description: '你家楼下的烧烤摊成了网红打卡点。老板告诉你："小子，知道啥叫工业底蕴不？这炭火里烧的都是咱厂子的情怀。"', 
        impact: 'positive',
        statEffects: { happiness: 10, health: -3 }
      }
    ]
  },
  {
    id: 'urban_rural_fringe',
    name: '城乡结合部',
    emoji: '🚜',
    region: 'special',
    description: '一脚踩泥一脚踩柏油，既是城市边缘人也是农村叛徒，定位常年显示"地球表面"',
    events: [
      { 
        year: 2005, 
        title: '身份认同危机', 
        description: '城里人说你是乡巴佬，村里人说你忘本。你发现自己既不会种地也不会点星巴克，处于一种量子叠加态。', 
        impact: 'negative',
        statEffects: { happiness: -10 }
      },
      { 
        year: 2012, 
        title: '拆迁暴富', 
        description: '你家那片终于被划进了开发区！你成了"拆二代"，但看着银行卡里的数字，你突然不知道人生该干啥了。', 
        impact: 'positive',
        statEffects: { money: 50, happiness: 5 }
      },
      { 
        year: 2018, 
        title: '快递集散中心', 
        description: '你们村成了全城的快递分拣中心。你发现这里的人说话都带着条形码，"您的快递已到达【某某村地球表面站点】"。', 
        impact: 'neutral',
        statEffects: { money: 5 }
      }
    ]
  },
  {
    id: 'viral_tourist_city',
    name: '网红旅游城市',
    emoji: '📸',
    region: 'special',
    description: '本地人吃不上饭，游客排不上队，一座城市养活了大半个互联网',
    events: [
      { 
        year: 2018, 
        title: '抖音带火', 
        description: '你家乡突然在抖音上爆火，原因是有人拍了一个"最火打卡点"，其实是你们家门口的垃圾桶。', 
        impact: 'positive',
        statEffects: { happiness: 5, money: 3 }
      },
      { 
        year: 2019, 
        title: '本地人吃不上饭', 
        description: '那家你吃了二十年的苍蝇馆子，现在排队要三小时。你站在人群外，像个异乡人。', 
        impact: 'negative',
        statEffects: { happiness: -10, money: -5 }
      },
      { 
        year: 2021, 
        title: '网红反噬', 
        description: '游客们发现这里其实没那么好玩，热度过去了。你看着满街的"旺铺转让"，心里五味杂陈。', 
        impact: 'negative',
        statEffects: { money: -10, happiness: -5 }
      }
    ]
  },
  {
    id: 'xiongan_new_area',
    name: '雄安新区',
    emoji: '🏗️',
    region: 'special',
    description: '千年大计，未来可期，现在除了塔吊和尘土，啥都没有',
    events: [
      { 
        year: 2017, 
        title: '新区设立', 
        description: '2017年4月1日，雄安新区设立。你爸连夜去买了几套房，结果发现买的是保定郊区的。', 
        impact: 'positive',
        statEffects: { money: 20, happiness: 10 }
      },
      { 
        year: 2020, 
        title: '塔吊森林', 
        description: '你家窗外全是塔吊，比树还多。你每天听着打桩机的声音起床，觉得自己像个住在工地里的公主/王子。', 
        impact: 'neutral',
        statEffects: { happiness: -5, health: -3 }
      },
      { 
        year: 2025, 
        title: '未来已来', 
        description: '无人驾驶车开始在路上跑了，虽然经常撞树。你觉得这就是未来——高科技，但还不太智能。', 
        impact: 'positive',
        statEffects: { intelligence: 5, happiness: 5 }
      }
    ]
  }
];

export function getBirthplaceById(id: BirthplaceType): Birthplace {
  return BIRTHPLACES.find(b => b.id === id) || BIRTHPLACES[0];
}

export function getBirthplaceEvent(birthplaceId: BirthplaceType, year: number): BirthplaceEvent | null {
  const birthplace = getBirthplaceById(birthplaceId);
  return birthplace.events.find(e => e.year === year) || null;
}

export function getBirthplacePreviewCommentary(id: BirthplaceType): string {
  const commentary: Record<BirthplaceType, string> = {
    beijing: '教育资源和大城市滤镜都很足，主线常常是“卷得体面”。',
    shanghai: '从小就容易见世面，也更早学会“精致”和“成本”是一起出现的。',
    guangdong: '空气里多少带点搞钱气质，别人聊理想，这边先问能不能落地。',
    sichuan: '生活感拉满，嘴上摆得开，真到大事也扛得住，顺手还能把日子过出香味。',
    hongkong: '节奏快、机会多、压力也实在，主打一个见招拆招。',
    macau: '纸醉金迷只是表象，真相往往是离热闹很近，离躺赢很远。',
    tianjin: '自带点松弛和逗贫，嘴上像在聊天，心里门儿清。',
    chongqing: '坡多、桥多、火锅多，人生也容易走成一条又烫又猛的上坡路。',
    jiangsu: '教育氛围在线，稳定感也在线，属于很容易被期待“别掉链子”的剧本。',
    zhejiang: '民营经济氛围浓，耳边常年环绕“要不你也试试做点生意？”。',
    fujian: '海风和闯劲都不缺，低调归低调，真到机会面前未必会慢。',
    shandong: '人情、面子、规矩都挺足，适合把朴实和倔劲一起练出来。',
    // 自嘲戏谑类
    first_tier_city: '出生自带房奴光环，幼儿园开始刷KPI，主打一个"卷得体面，累得有尊严"。',
    small_county_town: '出门左转是网吧，右转是沙场，人生选择不多但容错率极高，躺平无压力。',
    northeast_rust_belt: '轻工业直播，重工业烧烤，人生哲学是"凑合过呗，还能离咋地"。',
    urban_rural_fringe: '一脚踩泥一脚踩柏油，既是城市边缘人也是农村叛徒，定位常年显示"地球表面"。',
    viral_tourist_city: '本地人吃不上饭，游客排不上队，一座城市养活了大半个互联网。',
    xiongan_new_area: '千年大计，未来可期，现在除了塔吊和尘土，啥都没有，但梦想是满的。'
  };

  return commentary[id];
}

// 戏谑类出生地列表（用于UI显示）
export const HUMOR_BIRTHPLACES: Birthplace[] = [
  getBirthplaceById('first_tier_city'),
  getBirthplaceById('small_county_town'),
  getBirthplaceById('northeast_rust_belt'),
  getBirthplaceById('urban_rural_fringe'),
  getBirthplaceById('viral_tourist_city'),
  getBirthplaceById('xiongan_new_area'),
];
