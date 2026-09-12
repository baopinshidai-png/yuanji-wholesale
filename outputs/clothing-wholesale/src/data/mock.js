// ---------------------------------------------------------------------------
// 假数据：全部为演示数据，接后端时替换本文件即可（接口清单见 docs/产品与技术方案.md）
// ---------------------------------------------------------------------------

export const MARKETS = [
  '全部市场',
  '广州十三行',
  '广州沙河',
  '杭州四季青',
  '深圳南油',
  '濮院羊毛衫',
  '虎门富民',
  '常熟天虹',
  '义乌国际商贸城',
]

/** 一级分类 -> 二级分类 */
export const CATEGORIES = [
  { id: 'women', name: '女装', subs: ['连衣裙', 'T恤上衣', '衬衫', '针织衫', '卫衣', '牛仔', '裤装', '半身裙', '外套', '套装'] },
  { id: 'men', name: '男装', subs: ['男T恤', '男衬衫', '男卫衣', '男夹克', '男裤', '男套装'] },
  { id: 'kids', name: '童装', subs: ['童T恤', '童套装', '童裤', '亲子装'] },
  { id: 'shoes', name: '鞋包', subs: ['女鞋', '运动鞋', '单肩包', '拖鞋'] },
  { id: 'acc', name: '配饰', subs: ['项链', '耳饰', '帽子', '围巾', '发饰'] },
  { id: 'big', name: '大码女装', subs: ['大码连衣裙', '大码上衣', '大码裤装'] },
  { id: 'inner', name: '内衣家居', subs: ['文胸', '内裤', '家居服', '打底袜'] },
]

export const STALLS = [
  { id: 's1', name: 'ONE·快时尚', market: '广州十三行', address: '4F 4021-4023', main: '韩系快时尚 / 连衣裙', newCount: 36, fans: '2.1万', score: 4.9, shipRate: 98, tags: ['档口直供', '现货24H发', '支持7天退换'] },
  { id: 's2', name: '星野 STUDIO', market: '杭州四季青', address: '2F 2108', main: '通勤针织 / 秋冬打底', newCount: 28, fans: '1.6万', score: 4.8, shipRate: 97, tags: ['档口直供', '慢必赔', '买手推荐'] },
  { id: 's3', name: '沙河优选铺', market: '广州沙河', address: '3F 3120', main: '高性价比跑量款', newCount: 52, fans: '3.4万', score: 4.7, shipRate: 96, tags: ['跑量低价', '现货24H发'] },
  { id: 's4', name: '南油里·质衣', market: '深圳南油', address: '1F 1055', main: '中高端女装 / 真丝', newCount: 18, fans: '9800', score: 4.9, shipRate: 95, tags: ['中高端', '真丝专场', '支持7天退换'] },
  { id: 's5', name: '濮院羊绒世家', market: '濮院羊毛衫', address: 'A区 2216', main: '羊毛衫 / 羊绒衫', newCount: 22, fans: '1.2万', score: 4.8, shipRate: 94, tags: ['产业带工厂', '秋冬主推'] },
  { id: 's6', name: '虎门轻熟', market: '虎门富民', address: '5F 5027', main: '轻熟风套装 / 西装', newCount: 31, fans: '1.9万', score: 4.7, shipRate: 93, tags: ['一件起批', '套装好卖'] },
  { id: 's7', name: '常熟·衣念', market: '常熟天虹', address: 'B区 1106', main: '大码女装 / 显瘦', newCount: 26, fans: '2.6万', score: 4.8, shipRate: 97, tags: ['大码专营', '现货24H发'] },
  { id: 's8', name: '义乌·潮童', market: '义乌国际商贸城', address: '四区 28016', main: '童装 / 亲子装', newCount: 40, fans: '2.2万', score: 4.6, shipRate: 96, tags: ['童装', '一件起批'] },
  { id: 's9', name: '十三行·牛仔馆', market: '广州十三行', address: '3F 3088', main: '牛仔 / 裤装', newCount: 33, fans: '1.4万', score: 4.7, shipRate: 97, tags: ['档口直供', '跑量低价'] },
  { id: 's10', name: '四季青·白领衣橱', market: '杭州四季青', address: '1F 1032', main: '衬衫 / 西裤 / 通勤', newCount: 24, fans: '1.1万', score: 4.8, shipRate: 95, tags: ['通勤', '支持7天退换'] },
  { id: 's11', name: '沙河·男士基地', market: '广州沙河', address: '2F 2066', main: '男装 / 男女同款', newCount: 45, fans: '1.8万', score: 4.6, shipRate: 96, tags: ['跑量低价', '现货24H发'] },
  { id: 's12', name: '南油·配饰廊', market: '深圳南油', address: '2F 2088', main: '鞋包 / 饰品', newCount: 19, fans: '7600', score: 4.7, shipRate: 98, tags: ['一件起批', '可搭配'] },
]

const COLOR_POOL = [
  { name: '米白', hex: '#efe9df' },
  { name: '雾霾蓝', hex: '#8fa6bd' },
  { name: '燕麦杏', hex: '#d8c3a5' },
  { name: '黑色', hex: '#2b2b2b' },
  { name: '奶咖', hex: '#b79b83' },
  { name: '橄榄绿', hex: '#7b8a63' },
  { name: '烟灰粉', hex: '#d9a7ac' },
  { name: '酒红', hex: '#8d3b45' },
  { name: '藏青', hex: '#33415c' },
  { name: '浅卡其', hex: '#cbb28e' },
]

// 商品种子：t 标题 / c 二级分类 / s 档口 / p 批发价 / m 建议零售价 / img 主图序号 / sold 已售
const SEED = [
  { t: '法式复古泡泡袖衬衫 早秋新款', c: '衬衫', s: 's1', p: 36, m: 129, img: 3, sold: 1286 },
  { t: '小众设计感收腰连衣裙 显瘦气质', c: '连衣裙', s: 's1', p: 46, m: 168, img: 2, sold: 2431 },
  { t: '韩系慵懒风宽松卫衣 字母刺绣', c: '卫衣', s: 's1', p: 42, m: 139, img: 9, sold: 908 },
  { t: '基础款圆领棉T 打底百搭', c: 'T恤上衣', s: 's3', p: 15, m: 59, img: 1, sold: 5620 },
  { t: '高腰直筒牛仔裤 显腿长不挑人', c: '牛仔', s: 's9', p: 43, m: 149, img: 6, sold: 3175 },
  { t: '薄款防晒衬衫外套 通勤防晒', c: '衬衫', s: 's10', p: 29, m: 99, img: 3, sold: 1870 },
  { t: '羊绒混纺圆领针织衫 秋冬打底', c: '针织衫', s: 's5', p: 68, m: 219, img: 7, sold: 1420 },
  { t: '通勤西装阔腿裤 垂感不易皱', c: '裤装', s: 's10', p: 49, m: 169, img: 5, sold: 2260 },
  { t: '气质小香风粗花呢外套', c: '外套', s: 's6', p: 89, m: 299, img: 8, sold: 760 },
  { t: '轻熟风两件套 上衣+半身裙', c: '套装', s: 's6', p: 79, m: 258, img: 12, sold: 1180 },
  { t: '日系A字半身裙 遮肉显瘦', c: '半身裙', s: 's3', p: 32, m: 109, img: 4, sold: 3040 },
  { t: '真丝质感缎面吊带连衣裙', c: '连衣裙', s: 's4', p: 128, m: 429, img: 2, sold: 520 },
  { t: '重磅纯棉落肩T恤 男女同款', c: 'T恤上衣', s: 's11', p: 26, m: 89, img: 1, sold: 4210 },
  { t: '美式复古水洗工装夹克 男', c: '男夹克', s: 's11', p: 76, m: 259, img: 10, sold: 690 },
  { t: '商务免烫长袖衬衫 男 修身', c: '男衬衫', s: 's11', p: 45, m: 149, img: 3, sold: 1520 },
  { t: '男款宽松直筒休闲裤 垂感', c: '男裤', s: 's11', p: 52, m: 169, img: 5, sold: 2060 },
  { t: '男装两件套 卫衣+运动裤', c: '男套装', s: 's3', p: 89, m: 279, img: 12, sold: 830 },
  { t: '大码显瘦V领连衣裙 200斤可穿', c: '大码连衣裙', s: 's7', p: 55, m: 189, img: 2, sold: 2410 },
  { t: '大码宽松针织开衫 遮肉', c: '大码上衣', s: 's7', p: 62, m: 209, img: 7, sold: 1330 },
  { t: '大码高腰阔腿裤 弹力舒适', c: '大码裤装', s: 's7', p: 48, m: 159, img: 6, sold: 1860 },
  { t: '童装纯棉T恤 亲子款 春秋', c: '童T恤', s: 's8', p: 18, m: 69, img: 11, sold: 3320 },
  { t: '儿童运动两件套 卫衣+卫裤', c: '童套装', s: 's8', p: 45, m: 149, img: 12, sold: 1740 },
  { t: '亲子装母女连衣裙 春秋款', c: '亲子装', s: 's8', p: 68, m: 219, img: 2, sold: 880 },
  { t: '儿童加绒休闲裤 秋冬保暖', c: '童裤', s: 's8', p: 32, m: 109, img: 5, sold: 2110 },
  { t: '软皮小方包 通勤单肩斜挎', c: '单肩包', s: 's12', p: 39, m: 139, img: 13, sold: 1580 },
  { t: '法式珍珠项链 叠戴锁骨链', c: '项链', s: 's12', p: 12, m: 49, img: 14, sold: 4620 },
  { t: '复古金属质感耳环 小众设计', c: '耳饰', s: 's12', p: 8.5, m: 39, img: 14, sold: 6120 },
  { t: '素色针织帽 秋冬保暖', c: '帽子', s: 's12', p: 16, m: 59, img: 15, sold: 2430 },
  { t: '羊毛混纺格子围巾 加厚', c: '围巾', s: 's5', p: 28, m: 99, img: 15, sold: 1930 },
  { t: '真皮软底乐福鞋 百搭通勤', c: '女鞋', s: 's12', p: 78, m: 269, img: 16, sold: 720 },
  { t: '无痕无钢圈文胸 舒适聚拢', c: '文胸', s: 's2', p: 22, m: 79, img: 17, sold: 5240 },
  { t: '德绒保暖打底衫 秋冬内搭', c: '家居服', s: 's2', p: 26, m: 89, img: 9, sold: 3860 },
  { t: '珊瑚绒加厚家居服套装', c: '家居服', s: 's2', p: 56, m: 189, img: 18, sold: 1670 },
  { t: '薄款打底袜 抗起球 5双装', c: '打底袜', s: 's2', p: 19, m: 69, img: 17, sold: 4180 },
  { t: '小香风针织开衫 甜酷风', c: '针织衫', s: 's1', p: 52, m: 179, img: 7, sold: 1460 },
  { t: '缎面衬衫 通勤温柔风', c: '衬衫', s: 's4', p: 58, m: 199, img: 3, sold: 1030 },
]

const CAT_OF = { 连衣裙: 'women', T恤上衣: 'women', 衬衫: 'women', 针织衫: 'women', 卫衣: 'women', 牛仔: 'women', 裤装: 'women', 半身裙: 'women', 外套: 'women', 套装: 'women', 男T恤: 'men', 男衬衫: 'men', 男卫衣: 'men', 男夹克: 'men', 男裤: 'men', 男套装: 'men', 童T恤: 'kids', 童套装: 'kids', 童裤: 'kids', 亲子装: 'kids', 女鞋: 'shoes', 运动鞋: 'shoes', 单肩包: 'shoes', 拖鞋: 'shoes', 项链: 'acc', 耳饰: 'acc', 帽子: 'acc', 围巾: 'acc', 发饰: 'acc', 大码连衣裙: 'big', 大码上衣: 'big', 大码裤装: 'big', 文胸: 'inner', 内裤: 'inner', 家居服: 'inner', 打底袜: 'inner' }

const SIZE_BY_CAT = (cat) => {
  if (cat === 'kids') return ['100', '110', '120', '130', '140']
  if (cat === 'shoes') return ['35', '36', '37', '38', '39']
  if (cat === 'acc') return ['均码']
  if (cat === 'big') return ['XL', '2XL', '3XL', '4XL']
  return ['S', 'M', 'L', 'XL']
}

const FABRIC = ['聚酯纤维 95% 氨纶 5%', '纯棉 100%', '棉+聚酯纤维混纺', '醋酸+涤纶', '羊毛混纺', '德绒发热面料']
const FIT = ['修身', '宽松', '直筒', 'A字', '收腰']
const SEASON = ['春秋', '夏季', '秋冬', '四季']
const TAG_POOL = [
  ['现货24H发', '一件起批', '支持7天退换'],
  ['档口直供', '慢必赔', '断货赔付'],
  ['买手推荐', '现货24H发'],
  ['一件起批', '支持7天退换'],
  ['跑量低价', '现货24H发'],
  ['一件代发', '支持7天退换'],
]

export const GOODS = SEED.map((row, i) => {
  const n = i + 1
  const stall = STALLS.find((s) => s.id === row.s) || STALLS[0]
  const catId = CAT_OF[row.c] || 'women'
  const colors = [COLOR_POOL[i % COLOR_POOL.length], COLOR_POOL[(i + 3) % COLOR_POOL.length], COLOR_POOL[(i + 6) % COLOR_POOL.length]]
  return {
    id: 'g' + n,
    title: row.t,
    categoryId: catId,
    subName: row.c,
    stallId: stall.id,
    stallName: stall.name,
    market: stall.market,
    price: row.p,
    marketPrice: row.m,
    img: row.img,
    images: [row.img, ((row.img + 3) % 18) + 1, ((row.img + 6) % 18) + 1, ((row.img + 9) % 18) + 1],
    sold: row.sold,
    moq: 1,
    unit: '件',
    stock: 300 + ((i * 137) % 1200),
    colors: colors.filter((c, idx, arr) => arr.findIndex((x) => x.name === c.name) === idx),
    sizes: SIZE_BY_CAT(catId),
    tags: TAG_POOL[i % TAG_POOL.length],
    newHours: (i % 20) + 1, // 距上架多少小时（用于"上新"排序与标记）
    hot: Math.round((row.sold / 62) + ((i * 7) % 30)),
    params: {
      面料成分: FABRIC[i % FABRIC.length],
      版型: FIT[i % FIT.length],
      货号: 'YJ' + String(2300 + n),
      上市季节: SEASON[i % SEASON.length],
      产地: stall.market.slice(0, 2),
    },
  }
})

export const BANNERS = [
  { id: 'b1', title: '秋冬上新专场', sub: '每日 6000+ 新款 · 一件起批', tone: 'warm', link: '#/new' },
  { id: 'b2', title: '现货专区 24H 发货', sub: '免排单 · 慢必赔 · 断货赔付', tone: 'blue', link: '#/new?filter=stock' },
  { id: 'b3', title: '首单红包 ¥10', sub: '新店主认证即领 · 无门槛', tone: 'pink', link: '#/coupons' },
]

export const QUICK_ENTRIES = [
  { id: 'q1', name: '现货专区', desc: '24H发货', icon: 'bolt', link: '#/new?filter=stock' },
  { id: 'q2', name: '一件起批', desc: '不压货', icon: 'tag', link: '#/new?filter=moq' },
  { id: 'q3', name: '买手推荐', desc: '好卖款', icon: 'spark', link: '#/new?filter=buyer' },
  { id: 'q4', name: '首单红包', desc: '新人专享', icon: 'gift', link: '#/coupons' },
]

export const COUPONS = [
  { id: 'c1', title: '首单红包', amount: 10, threshold: 0, desc: '新店主认证专享，无门槛', expire: '2026-12-31' },
  { id: 'c2', title: '满 199 减 20', amount: 20, threshold: 199, desc: '全场通用（特价商品除外）', expire: '2026-12-31' },
  { id: 'c3', title: '满 499 减 60', amount: 60, threshold: 499, desc: '全场通用，可与满减叠加', expire: '2026-12-31' },
]

export const LIVES = [
  { id: 'l1', stallId: 's1', title: '十三行新款首播｜早秋连衣裙专场', host: '买手 · 阿May', viewers: 3218, status: 'living' },
  { id: 'l2', stallId: 's5', title: '濮院羊绒工厂价｜羊毛衫清仓', host: '档口 · 老周', viewers: 1860, status: 'living' },
  { id: 'l3', stallId: 's3', title: '沙河跑量款｜9.9 起拿货', host: '买手 · 小林', viewers: 5420, status: 'living' },
  { id: 'l4', stallId: 's8', title: '义乌童装｜秋冬亲子装上新', host: '档口 · 圆圆', viewers: 780, status: 'preview' },
]

export const DEFAULT_ADDRESS = {
  id: 'a1',
  name: '王小美',
  phone: '138****8899',
  region: '浙江省 杭州市 江干区',
  detail: '四季青服装市场旁 幸福里 2 栋 1801',
  tag: '默认',
}

export const ADDRESSES = [
  DEFAULT_ADDRESS,
  { id: 'a2', name: '李强', phone: '139****2211', region: '广东省 广州市 荔湾区', detail: '十三行新中国大厦 12 楼 1208 档', tag: '档口' },
]

// ---------------------------------------------------------------------------
// 查询工具
// ---------------------------------------------------------------------------
export const getGoods = (id) => GOODS.find((g) => g.id === id)
export const getStall = (id) => STALLS.find((s) => s.id === id)
export const goodsByStall = (stallId) => GOODS.filter((g) => g.stallId === stallId)
export const goodsByCategory = (catId, subName) =>
  GOODS.filter((g) => g.categoryId === catId && (!subName || g.subName === subName))
export const newArrivals = () => [...GOODS].sort((a, b) => a.newHours - b.newHours)
export const hotGoods = () => [...GOODS].sort((a, b) => b.hot - a.hot)
export const searchGoods = (kw) => {
  const k = (kw || '').trim()
  if (!k) return []
  return GOODS.filter((g) => g.title.includes(k) || g.subName.includes(k) || g.stallName.includes(k) || g.market.includes(k))
}
export const stallOfGoods = (g) => getStall(g.stallId)
