/* ===========================================================
 * 干饭雷达 · 种子数据层
 * 纯静态 / 零依赖：全部数据在前端生成，配合 localStorage 持久化
 * =========================================================== */

/* ---------- 确定性随机（保证每次打开数据一致） ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261027);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const randInt = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const round1 = (n) => Math.round(n * 10) / 10;

/* ---------- 食堂 ---------- */
const CANTEENS = [
  { id: 'c1', name: '一食堂 · 学子餐厅', short: '一食堂', emoji: '🏫',
    location: '教学楼东侧 步行2分钟', floors: 3, avg: 12,
    hours: '06:30 - 20:00', walk: 2,
    tags: ['人最多', '性价比高', '出餐快'],
    intro: '全校人流量最大的食堂，三层楼、40+窗口，早中晚全时段供应，赶课首选。' },

  { id: 'c2', name: '二食堂 · 风味餐厅', short: '二食堂', emoji: '🍜',
    location: '图书馆北侧 步行5分钟', floors: 2, avg: 15,
    hours: '07:00 - 21:00', walk: 5,
    tags: ['口味丰富', '地方菜系', '适合聚餐'],
    intro: '汇集天南海北风味：广式烧腊、日韩料理、西北面食，想吃"好的"就来这儿。' },

  { id: 'c3', name: '三食堂 · 清真食堂', short: '三食堂', emoji: '🌙',
    location: '体育馆西侧 步行6分钟', floors: 2, avg: 14,
    hours: '06:30 - 20:30', walk: 6,
    tags: ['清真', '牛羊肉', '分量足'],
    intro: '清真食堂，牛羊肉现切现做，大盘鸡和拉面是招牌，分量实在。' },

  { id: 'c4', name: '四食堂 · 教工餐厅', short: '四食堂', emoji: '🍽️',
    location: '行政楼旁 步行8分钟', floors: 2, avg: 18,
    hours: '07:00 - 20:00', walk: 8,
    tags: ['环境好', '食材新鲜', '对学生开放'],
    intro: '环境最好、食材最讲究的一间，全天对学生开放，价格略高但值得。' },

  { id: 'c5', name: '夜宵广场 · 小吃街', short: '夜宵广场', emoji: '🌃',
    location: '宿舍区中心 步行1分钟', floors: 1, avg: 16,
    hours: '16:00 - 23:30', walk: 1,
    tags: ['夜宵', '自习后', '氛围感'],
    intro: '宿舍楼下的深夜食堂，16点开到23点半，自习结束的能量补给站。' }
];

/* ---------- 窗口（档口） ---------- */
// base: 综合评分基准 0-5；queue: 基准排队分钟；shake: 阿姨手抖指数(分量稳定性) 0-100
const STALLS = [
  // 一食堂
  { id: 's01', canteen: 'c1', name: '川味小炒', floor: '1F', cat: '炒菜', emoji: '🌶️', base: 4.3, queue: 9, shake: 62,
    desc: '现点现炒，锅气足，辣度可调，下课高峰要排队。' },
  { id: 's02', canteen: 'c1', name: '面食工坊', floor: '1F', cat: '面食', emoji: '🍜', base: 4.0, queue: 6, shake: 55,
    desc: '牛肉面、肥肠面、番茄鸡蛋面，面条现拉，汤头熬足4小时。' },
  { id: 's03', canteen: 'c1', name: '自选快餐', floor: '2F', cat: '快餐', emoji: '🍱', base: 3.6, queue: 3, shake: 40,
    desc: '两荤一素12元，出餐最快，赶时间的救命窗口。' },
  { id: 's04', canteen: 'c1', name: '麻辣香锅', floor: '2F', cat: '香锅', emoji: '🥘', base: 4.4, queue: 12, shake: 70,
    desc: '自选菜品称重，麻辣鲜香，人均稍高但好评稳定。' },
  { id: 's05', canteen: 'c1', name: '营养粥铺', floor: '1F', cat: '早餐', emoji: '🥣', base: 3.9, queue: 2, shake: 50,
    desc: '皮蛋瘦肉粥、南瓜粥、小米粥，早八人的温柔选择。' },

  // 二食堂
  { id: 's06', canteen: 'c2', name: '广式烧腊', floor: '1F', cat: '粤菜', emoji: '🍗', base: 4.5, queue: 10, shake: 75,
    desc: '叉烧、烧鸭、白切鸡，蜜汁叉烧饭是全校公认的顶流。' },
  { id: 's07', canteen: 'c2', name: '日式料理', floor: '2F', cat: '日料', emoji: '🍣', base: 4.1, queue: 8, shake: 68,
    desc: '豚骨拉面、照烧鸡排饭、咖喱饭，摆盘精致。' },
  { id: 's08', canteen: 'c2', name: '韩式石锅', floor: '2F', cat: '韩餐', emoji: '🍲', base: 3.8, queue: 7, shake: 52,
    desc: '石锅拌饭、部队锅、辣炒年糕，石锅很烫小心舌头。' },
  { id: 's09', canteen: 'c2', name: '西北面馆', floor: '1F', cat: '面食', emoji: '🍝', base: 4.2, queue: 5, shake: 72,
    desc: '油泼面、臊子面、肉夹馍，面条筋道，辣子香而不燥。' },
  { id: 's10', canteen: 'c2', name: '轻食沙拉', floor: '2F', cat: '轻食', emoji: '🥗', base: 3.4, queue: 2, shake: 60,
    desc: '减脂期友好，鸡胸肉、藜麦、牛油果，热量都标好了。' },

  // 三食堂（清真）
  { id: 's11', canteen: 'c3', name: '兰州拉面', floor: '1F', cat: '面食', emoji: '🍜', base: 4.6, queue: 11, shake: 65,
    desc: '一清二白三红四绿，牛肉给得大方，排队也认了。' },
  { id: 's12', canteen: 'c3', name: '新疆大盘鸡', floor: '2F', cat: '新疆菜', emoji: '🍗', base: 4.4, queue: 9, shake: 78,
    desc: '一份够两个人吃，皮带面拌进去才是灵魂吃法。' },
  { id: 's13', canteen: 'c3', name: '烤馕烤肉', floor: '1F', cat: '烧烤', emoji: '🍢', base: 4.2, queue: 6, shake: 58,
    desc: '羊肉串现烤，馕坑现打，孜然味飘满整层楼。' },
  { id: 's14', canteen: 'c3', name: '清真小炒', floor: '2F', cat: '炒菜', emoji: '🥘', base: 3.7, queue: 4, shake: 45,
    desc: '牛肉小炒、番茄牛腩，口味偏家常，性价比中等。' },

  // 四食堂
  { id: 's15', canteen: 'c4', name: '本帮小炒', floor: '1F', cat: '炒菜', emoji: '🍳', base: 4.3, queue: 7, shake: 80,
    desc: '浓油赤酱，红烧肉和油焖春笋做得地道，偏甜口。' },
  { id: 's16', canteen: 'c4', name: '铁板饭', floor: '2F', cat: '铁板', emoji: '🍛', base: 4.0, queue: 8, shake: 66,
    desc: '铁板牛肉饭、鸡排饭，滋滋作响上桌，锅巴很香。' },
  { id: 's17', canteen: 'c4', name: '老火靓汤', floor: '1F', cat: '汤煲', emoji: '🍲', base: 4.1, queue: 4, shake: 74,
    desc: '每日一款炖汤，玉米排骨、花胶鸡汤，养生局。' },
  { id: 's18', canteen: 'c4', name: '精品自助', floor: '2F', cat: '自助', emoji: '🍽️', base: 3.5, queue: 3, shake: 35,
    desc: '28元/位，菜品种类多但更新慢，适合什么都想尝一口。' },

  // 夜宵广场
  { id: 's19', canteen: 'c5', name: '炸鸡汉堡', floor: '1F', cat: '西式', emoji: '🍔', base: 3.9, queue: 5, shake: 48,
    desc: '现炸鸡排、汉堡薯条，深夜罪恶感担当。' },
  { id: 's20', canteen: 'c5', name: '关东煮', floor: '1F', cat: '小吃', emoji: '🍡', base: 4.0, queue: 3, shake: 42,
    desc: '萝卜、魔芋、鱼丸，热汤暖胃，冬天排队最长。' },
  { id: 's21', canteen: 'c5', name: '烧烤串串', floor: '1F', cat: '烧烤', emoji: '🍢', base: 4.3, queue: 13, shake: 55,
    desc: '烤五花、烤茄子、烤韭菜，配冰啤酒的快乐。' },
  { id: 's22', canteen: 'c5', name: '甜品饮品', floor: '1F', cat: '饮品', emoji: '🧋', base: 3.8, queue: 6, shake: 50,
    desc: '奶茶、水果捞、双皮奶，第二杯半价常有。' }
];

/* ---------- 菜品 ----------
 * p: 价格  sp: 辣度0-5  hot: 热度基数  base: 评分基准  isNew: 本周上新
 * tags: 荤/素/主食/汤/小吃/甜品/辣/清淡/高蛋白/低卡/早餐/夜宵
 */
const DISHES = [
  // 一食堂 · 川味小炒 s01
  { id: 'd001', stall: 's01', name: '鱼香肉丝', p: 9, e: '🍲', sp: 2, hot: 92, base: 4.4, tags: ['荤', '主食', '下饭'] },
  { id: 'd002', stall: 's01', name: '干煸豆角', p: 8, e: '🫛', sp: 3, hot: 78, base: 4.2, tags: ['素', '下饭', '辣'] },
  { id: 'd003', stall: 's01', name: '水煮肉片', p: 13, e: '🥘', sp: 5, hot: 88, base: 4.5, tags: ['荤', '辣', '下饭'] },
  { id: 'd004', stall: 's01', name: '宫保鸡丁', p: 11, e: '🍗', sp: 2, hot: 85, base: 4.1, tags: ['荤', '下饭', '高蛋白'] },
  { id: 'd005', stall: 's01', name: '麻婆豆腐', p: 7, e: '🧊', sp: 4, hot: 90, base: 4.3, tags: ['素', '辣', '下饭'], isNew: true },

  // 面食工坊 s02
  { id: 'd006', stall: 's02', name: '红烧牛肉面', p: 12, e: '🍜', sp: 1, hot: 95, base: 4.3, tags: ['主食', '荤', '汤'] },
  { id: 'd007', stall: 's02', name: '肥肠面', p: 14, e: '🍜', sp: 4, hot: 72, base: 4.0, tags: ['主食', '荤', '辣'] },
  { id: 'd008', stall: 's02', name: '番茄鸡蛋面', p: 9, e: '🍅', sp: 0, hot: 80, base: 3.9, tags: ['主食', '素', '清淡'] },
  { id: 'd009', stall: 's02', name: '炸酱面', p: 10, e: '🥜', sp: 1, hot: 68, base: 3.7, tags: ['主食', '荤'] },

  // 自选快餐 s03
  { id: 'd010', stall: 's03', name: '两荤一素套餐', p: 12, e: '🍱', sp: 1, hot: 96, base: 3.6, tags: ['主食', '荤', '快'] },
  { id: 'd011', stall: 's03', name: '红烧狮子头', p: 6, e: '🍖', sp: 0, hot: 70, base: 3.8, tags: ['荤', '下饭'] },
  { id: 'd012', stall: 's03', name: '清炒时蔬', p: 3, e: '🥬', sp: 0, hot: 65, base: 3.3, tags: ['素', '清淡', '低卡'] },
  { id: 'd013', stall: 's03', name: '番茄炒蛋', p: 5, e: '🍳', sp: 0, hot: 88, base: 3.9, tags: ['素', '下饭', '清淡'] },

  // 麻辣香锅 s04
  { id: 'd014', stall: 's04', name: '麻辣香锅（自选）', p: 22, e: '🥘', sp: 4, hot: 93, base: 4.5, tags: ['荤', '辣', '聚餐'] },
  { id: 'd015', stall: 's04', name: '酱香香锅', p: 20, e: '🍲', sp: 2, hot: 70, base: 4.2, tags: ['荤', '下饭'] },
  { id: 'd016', stall: 's04', name: '素菜香锅', p: 15, e: '🥗', sp: 3, hot: 60, base: 4.0, tags: ['素', '辣'] },

  // 营养粥铺 s05
  { id: 'd017', stall: 's05', name: '皮蛋瘦肉粥', p: 5, e: '🥣', sp: 0, hot: 85, base: 4.1, tags: ['早餐', '清淡', '汤'] },
  { id: 'd018', stall: 's05', name: '南瓜小米粥', p: 4, e: '🎃', sp: 0, hot: 62, base: 3.7, tags: ['早餐', '素', '清淡'] },
  { id: 'd019', stall: 's05', name: '鲜肉包 + 豆浆', p: 6, e: '🥟', sp: 0, hot: 90, base: 4.0, tags: ['早餐', '荤', '快'] },
  { id: 'd020', stall: 's05', name: '八宝粥', p: 4, e: '🍚', sp: 0, hot: 55, base: 3.5, tags: ['早餐', '素', '甜'] },

  // 二食堂 · 广式烧腊 s06
  { id: 'd021', stall: 's06', name: '蜜汁叉烧饭', p: 16, e: '🍖', sp: 0, hot: 98, base: 4.7, tags: ['荤', '主食', '招牌'] },
  { id: 'd022', stall: 's06', name: '烧鸭饭', p: 18, e: '🦆', sp: 0, hot: 90, base: 4.5, tags: ['荤', '主食', '招牌'] },
  { id: 'd023', stall: 's06', name: '白切鸡饭', p: 15, e: '🍗', sp: 0, hot: 82, base: 4.3, tags: ['荤', '主食', '清淡'] },
  { id: 'd024', stall: 's06', name: '双拼烧腊饭', p: 22, e: '🍱', sp: 0, hot: 86, base: 4.6, tags: ['荤', '主食', '聚餐'], isNew: true },

  // 日式料理 s07
  { id: 'd025', stall: 's07', name: '豚骨拉面', p: 20, e: '🍜', sp: 0, hot: 88, base: 4.2, tags: ['主食', '荤', '汤'] },
  { id: 'd026', stall: 's07', name: '照烧鸡排饭', p: 18, e: '🍗', sp: 0, hot: 80, base: 4.1, tags: ['主食', '荤', '高蛋白'] },
  { id: 'd027', stall: 's07', name: '咖喱牛肉饭', p: 19, e: '🍛', sp: 1, hot: 75, base: 4.0, tags: ['主食', '荤'] },
  { id: 'd028', stall: 's07', name: '三文鱼刺身饭', p: 28, e: '🍣', sp: 0, hot: 65, base: 3.9, tags: ['主食', '高蛋白', '招牌'] },

  // 韩式石锅 s08
  { id: 'd029', stall: 's08', name: '石锅拌饭', p: 17, e: '🍲', sp: 2, hot: 84, base: 3.9, tags: ['主食', '素', '辣'] },
  { id: 'd030', stall: 's08', name: '部队锅', p: 26, e: '🥘', sp: 3, hot: 70, base: 3.8, tags: ['荤', '辣', '聚餐'] },
  { id: 'd031', stall: 's08', name: '辣炒年糕', p: 12, e: '🧆', sp: 4, hot: 72, base: 3.6, tags: ['小吃', '辣', '甜'] },

  // 西北面馆 s09
  { id: 'd032', stall: 's09', name: '油泼面', p: 13, e: '🍝', sp: 3, hot: 91, base: 4.4, tags: ['主食', '辣', '招牌'] },
  { id: 'd033', stall: 's09', name: '臊子面', p: 12, e: '🍜', sp: 2, hot: 78, base: 4.2, tags: ['主食', '荤'] },
  { id: 'd034', stall: 's09', name: '肉夹馍', p: 8, e: '🥙', sp: 1, hot: 85, base: 4.3, tags: ['小吃', '荤', '快'] },
  { id: 'd035', stall: 's09', name: '羊肉泡馍', p: 20, e: '🍲', sp: 1, hot: 66, base: 4.0, tags: ['主食', '荤', '汤'] },

  // 轻食沙拉 s10
  { id: 'd036', stall: 's10', name: '鸡胸藜麦碗', p: 22, e: '🥗', sp: 0, hot: 58, base: 3.5, tags: ['素', '低卡', '高蛋白'] },
  { id: 'd037', stall: 's10', name: '牛油果三文鱼沙拉', p: 28, e: '🥑', sp: 0, hot: 52, base: 3.6, tags: ['低卡', '高蛋白', '清淡'] },
  { id: 'd038', stall: 's10', name: '水果燕麦杯', p: 12, e: '🍓', sp: 0, hot: 48, base: 3.2, tags: ['素', '低卡', '甜'] },

  // 三食堂 · 兰州拉面 s11
  { id: 'd039', stall: 's11', name: '兰州牛肉拉面', p: 13, e: '🍜', sp: 2, hot: 97, base: 4.7, tags: ['主食', '荤', '汤', '招牌'] },
  { id: 'd040', stall: 's11', name: '加肉牛肉面', p: 19, e: '🥩', sp: 2, hot: 80, base: 4.6, tags: ['主食', '荤', '高蛋白'] },
  { id: 'd041', stall: 's11', name: '凉拌牛肉', p: 15, e: '🥗', sp: 1, hot: 62, base: 4.3, tags: ['荤', '高蛋白', '清淡'] },

  // 新疆大盘鸡 s12
  { id: 'd042', stall: 's12', name: '新疆大盘鸡', p: 38, e: '🍗', sp: 3, hot: 94, base: 4.6, tags: ['荤', '聚餐', '招牌'] },
  { id: 'd043', stall: 's12', name: '大盘鸡拌面', p: 20, e: '🍝', sp: 3, hot: 88, base: 4.5, tags: ['主食', '荤', '辣'] },
  { id: 'd044', stall: 's12', name: '手抓饭', p: 18, e: '🍚', sp: 1, hot: 74, base: 4.2, tags: ['主食', '荤'] },

  // 烤馕烤肉 s13
  { id: 'd045', stall: 's13', name: '孜然羊肉串', p: 5, e: '🍢', sp: 2, hot: 92, base: 4.4, tags: ['荤', '小吃', '夜宵'] },
  { id: 'd046', stall: 's13', name: '烤馕', p: 4, e: '🫓', sp: 0, hot: 70, base: 4.0, tags: ['主食', '素'] },
  { id: 'd047', stall: 's13', name: '烤羊排', p: 25, e: '🍖', sp: 2, hot: 68, base: 4.3, tags: ['荤', '聚餐', '高蛋白'] },

  // 清真小炒 s14
  { id: 'd048', stall: 's14', name: '番茄牛腩', p: 16, e: '🍲', sp: 0, hot: 72, base: 3.9, tags: ['荤', '下饭', '清淡'] },
  { id: 'd049', stall: 's14', name: '葱爆羊肉', p: 18, e: '🥘', sp: 1, hot: 66, base: 3.7, tags: ['荤', '下饭'] },
  { id: 'd050', stall: 's14', name: '清炒西兰花', p: 7, e: '🥦', sp: 0, hot: 54, base: 3.4, tags: ['素', '低卡', '清淡'] },

  // 四食堂 · 本帮小炒 s15
  { id: 'd051', stall: 's15', name: '红烧肉', p: 20, e: '🍖', sp: 0, hot: 93, base: 4.5, tags: ['荤', '下饭', '招牌'] },
  { id: 'd052', stall: 's15', name: '油焖春笋', p: 16, e: '🎋', sp: 0, hot: 70, base: 4.2, tags: ['素', '清淡'] },
  { id: 'd053', stall: 's15', name: '糖醋小排', p: 22, e: '🍯', sp: 0, hot: 84, base: 4.4, tags: ['荤', '甜', '下饭'] },
  { id: 'd054', stall: 's15', name: '清炒虾仁', p: 26, e: '🍤', sp: 0, hot: 68, base: 4.1, tags: ['荤', '高蛋白', '清淡'], isNew: true },

  // 铁板饭 s16
  { id: 'd055', stall: 's16', name: '铁板黑椒牛柳饭', p: 21, e: '🍛', sp: 1, hot: 89, base: 4.2, tags: ['主食', '荤', '招牌'] },
  { id: 'd056', stall: 's16', name: '铁板鸡排饭', p: 18, e: '🍗', sp: 1, hot: 82, base: 4.0, tags: ['主食', '荤', '高蛋白'] },
  { id: 'd057', stall: 's16', name: '铁板豆腐', p: 14, e: '🧈', sp: 2, hot: 60, base: 3.8, tags: ['素', '主食'] },

  // 老火靓汤 s17
  { id: 'd058', stall: 's17', name: '玉米排骨汤', p: 12, e: '🌽', sp: 0, hot: 76, base: 4.2, tags: ['汤', '清淡', '荤'] },
  { id: 'd059', stall: 's17', name: '花胶鸡汤', p: 25, e: '🍲', sp: 0, hot: 58, base: 4.3, tags: ['汤', '高蛋白', '招牌'] },
  { id: 'd060', stall: 's17', name: '莲藕猪骨汤', p: 12, e: '🥣', sp: 0, hot: 62, base: 4.0, tags: ['汤', '清淡'] },

  // 精品自助 s18
  { id: 'd061', stall: 's18', name: '精品自助餐', p: 28, e: '🍽️', sp: 1, hot: 64, base: 3.5, tags: ['主食', '聚餐'] },
  { id: 'd062', stall: 's18', name: '现煮小火锅', p: 32, e: '🫕', sp: 3, hot: 70, base: 3.6, tags: ['荤', '辣', '聚餐'] },

  // 夜宵广场 · 炸鸡汉堡 s19
  { id: 'd063', stall: 's19', name: '香辣鸡腿堡', p: 15, e: '🍔', sp: 2, hot: 86, base: 4.0, tags: ['小吃', '荤', '夜宵'] },
  { id: 'd064', stall: 's19', name: '现炸鸡排', p: 12, e: '🍗', sp: 2, hot: 88, base: 4.1, tags: ['小吃', '荤', '夜宵'] },
  { id: 'd065', stall: 's19', name: '薯条大份', p: 8, e: '🍟', sp: 0, hot: 78, base: 3.7, tags: ['小吃', '素', '夜宵'] },

  // 关东煮 s20
  { id: 'd066', stall: 's20', name: '关东煮拼盘', p: 14, e: '🍡', sp: 0, hot: 84, base: 4.1, tags: ['小吃', '汤', '夜宵'] },
  { id: 'd067', stall: 's20', name: '萝卜 + 魔芋', p: 6, e: '🥕', sp: 0, hot: 66, base: 3.9, tags: ['小吃', '素', '低卡'] },
  { id: 'd068', stall: 's20', name: '鱼丸串', p: 4, e: '🍢', sp: 0, hot: 72, base: 3.8, tags: ['小吃', '夜宵'] },

  // 烧烤串串 s21
  { id: 'd069', stall: 's21', name: '烤五花肉', p: 6, e: '🥓', sp: 2, hot: 95, base: 4.5, tags: ['小吃', '荤', '夜宵', '招牌'] },
  { id: 'd070', stall: 's21', name: '烤茄子', p: 8, e: '🍆', sp: 2, hot: 80, base: 4.3, tags: ['素', '小吃', '夜宵'] },
  { id: 'd071', stall: 's21', name: '烤韭菜', p: 5, e: '🌿', sp: 2, hot: 68, base: 4.0, tags: ['素', '小吃', '夜宵'] },
  { id: 'd072', stall: 's21', name: '烤玉米', p: 6, e: '🌽', sp: 1, hot: 74, base: 4.2, tags: ['素', '小吃', '夜宵'] },

  // 甜品饮品 s22
  { id: 'd073', stall: 's22', name: '珍珠奶茶', p: 10, e: '🧋', sp: 0, hot: 90, base: 3.8, tags: ['甜品', '饮品'] },
  { id: 'd074', stall: 's22', name: '杨枝甘露', p: 14, e: '🥭', sp: 0, hot: 76, base: 4.1, tags: ['甜品', '饮品', '招牌'] },
  { id: 'd075', stall: 's22', name: '双皮奶', p: 9, e: '🍮', sp: 0, hot: 64, base: 3.9, tags: ['甜品', '清淡'] },
  { id: 'd076', stall: 's22', name: '水果捞', p: 16, e: '🍉', sp: 0, hot: 70, base: 3.7, tags: ['甜品', '低卡'], isNew: true }
];

/* ---------- 点评生成 ---------- */
const GOOD_TAGS = ['分量足', '阿姨手松', '入味', '锅气足', '性价比高', '出餐快', '食材新鲜', '摆盘好看', '值得回购'];
const BAD_TAGS = ['太咸了', '分量偏少', '阿姨手抖', '排队久', '有点油', '性价比一般', '凉了', '踩雷了', '味道不稳定'];
const POSITIVE_TEXT = [
  '这学期吃过最满意的一顿，价格也很能打。',
  '分量真的足，男生吃一份能撑到晚上。',
  '闭眼点不踩雷，已经回购无数次。',
  '味道稳定，是我食堂清单里的常驻选手。',
  '性价比超高，这个价格在校外根本吃不到。',
  '出餐很快，赶课的时候首选。',
  '第一次点就被惊艳到了，推荐大家试试。',
  '热乎的，端上来还冒着热气。'
];
const NEUTRAL_TEXT = [
  '中规中矩，饿的时候可以吃。',
  '无功无过，偶尔换换口味还行。',
  '味道还行，就是排队有点久。',
  '正常水平，没有惊喜也没有踩雷。',
  '偶尔吃一次可以，天天吃会腻。'
];
const NEGATIVE_TEXT = [
  '这次明显没上次好吃，味道不太稳定。',
  '分量比想象中少，男生可能不够吃。',
  '有点咸，建议让阿姨少放点盐。',
  '排队排了二十分钟，有点不值。',
  '不太推荐，同样的价格隔壁更香。',
  '踩雷了，可能不会再点第二次。'
];
const NICKNAMES = ['干饭小王', '不吃香菜', '东区常驻民', '减脂第三天', '赶课人', '深夜饿鬼', '一颗西兰花',
  '今天也要吃饭', '食堂活地图', '匿名干饭人', '辣味爱好者', '米饭仙人', '面食主义', '排队恐惧症',
  '大一新生', '考研人', '吃了四年', '嘴挑星人', '正在长身体', '碳水教信徒'];

function buildReviews() {
  const reviews = [];
  let rid = 1;
  DISHES.forEach((d) => {
    const n = randInt(3, 7);
    for (let i = 0; i < n; i++) {
      // 以菜品基准分为中心波动，生成四维评分
      const badLuck = rnd() < 0.18 ? -1.3 : 0;
      const wobble = () => (rnd() - 0.5) * 2.6 + badLuck;
      const taste = Math.max(1, Math.min(5, d.base + wobble()));
      const portion = Math.max(1, Math.min(5, d.base + (rnd() - 0.55) * 1.8));
      const value = Math.max(1, Math.min(5, d.base - (d.p - 14) * 0.03 + (rnd() - 0.5) * 1.4));
      const look = Math.max(1, Math.min(5, d.base + (rnd() - 0.5) * 1.2));
      const overall = taste * 0.4 + portion * 0.2 + value * 0.3 + look * 0.1;

      const tags = [];
      if (overall >= 4.0) { tags.push(pick(GOOD_TAGS)); if (rnd() > 0.5) tags.push(pick(GOOD_TAGS)); }
      else if (overall < 3.3) { tags.push(pick(BAD_TAGS)); if (rnd() > 0.6) tags.push(pick(BAD_TAGS)); }
      else if (rnd() > 0.6) tags.push(pick(GOOD_TAGS));

      let text;
      if (overall >= 4.1) text = pick(POSITIVE_TEXT);
      else if (overall >= 3.3) text = pick(NEUTRAL_TEXT);
      else text = pick(NEGATIVE_TEXT);

      reviews.push({
        id: 'r' + String(rid++).padStart(4, '0'),
        dish: d.id,
        user: pick(NICKNAMES),
        r: {
          taste: round1(taste),
          portion: round1(portion),
          value: round1(value),
          look: round1(look)
        },
        overall: round1(overall),
        tags: [...new Set(tags)],
        text,
        daysAgo: randInt(0, 60),
        likes: randInt(0, 46)
      });
    }
  });
  return reviews;
}

const REVIEWS = buildReviews();
