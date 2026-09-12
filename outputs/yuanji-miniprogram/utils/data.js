// 假数据（全部来自「一手」实测结构的等价示例，接后端时替换本文件）
const MARKETS = [
  { id: 'sh', name: '沙河' },
  { id: 'hz', name: '杭州' },
  { id: 'py', name: '濮院' },
  { id: 'ny', name: '南油' },
  { id: 'xb', name: '鞋包' },
  { id: 'zf', name: '中纺' },
  { id: 'jm', name: '金马市场' },
  { id: 'ph', name: '平湖羽绒' },
  { id: '456', name: '4-6楼' },
  { id: 'ks', name: '昆山' },
  { id: 'nz', name: '男装' },
  { id: 'tz', name: '童装频道' },
]

const FILTERS = ['全部', '十三行', '沙河', '杭州', '24h发货', '南油', '鞋包配', '源头厂牌', '男装', '大码']

const CATEGORIES = [
  { id: 'rec', name: '为你推荐', subs: [] },
  { id: 'market', name: '热门市场', subs: [] },
  { id: 'style', name: '风格', subs: [] },
  { id: 'top', name: '上装', subs: ['针织马甲', '衬衫', '长袖T恤', '卫衣', '西装', '针织开衫', '针织衫', '短袖T恤', '小衫', '雪纺衫', '风衣', '牛仔外套', '背心', '马甲', '打底衫', '防晒衫', '短外套', '羽绒服', '棉服', '毛衣', '羊毛外套', '大衣', '皮衣', '皮草'] },
  { id: 'bottom', name: '下装', subs: ['西裤', '休闲裤', '牛仔短裤', '连体裤', '背带裤', '休闲短裤', '打底裤', '皮裤'] },
  { id: 'skirt', name: '裙装', subs: ['连衣裙', '半身裙', '背带裙', '裙裤', '牛仔裙'] },
  { id: 'suit', name: '套装', subs: ['套装'] },
  { id: 'inner', name: '居家内衣', subs: ['内衣套装', '文胸', '内裤', '美背内衣', '睡衣'] },
  { id: 'bag', name: '女包', subs: ['斜挎包', '单肩包', '手提包', '手拿包', '双肩包', '帆布包'] },
  { id: 'necklace', name: '首饰', subs: ['短项链', '长项链', '手镯'] },
  { id: 'acc', name: '饰品', subs: ['帽子', '墨镜', '围脖', '手表', '手套', '披肩'] },
  { id: 'casual-shoe', name: '休闲鞋', subs: ['德训鞋', '勃肯鞋', '休闲鞋', '小白鞋', '帆布鞋'] },
  { id: 'single-shoe', name: '单鞋', subs: ['高跟单鞋', '中跟单鞋', '低平跟单鞋'] },
  { id: 'slipper', name: '拖鞋', subs: ['半拖鞋', '人字拖'] },
  { id: 'sandal', name: '凉鞋', subs: ['高跟凉鞋', '中跟凉鞋', '低平跟凉鞋', '坡跟凉鞋', '粗跟凉鞋', '休闲凉鞋'] },
  { id: 'boot', name: '靴子', subs: ['长靴', '短靴', '马丁靴'] },
  { id: 'feature-shoe', name: '特色鞋', subs: ['穆勒鞋', '玛丽珍鞋', '乐福鞋', '豆豆鞋'] },
]

const HOT_CATEGORIES = ['羽绒服', '牛仔裤', '羊毛外套', '毛衣', '休闲裤', '短外套', '针织衫', '半身裙', '套装', '连衣裙', '打底衫', '卫衣']

// 实测拿到的档口阶梯满减（一手真实档位）
const SUBSIDY = [
  { threshold: 30000, minus: 1050 }, { threshold: 25000, minus: 875 }, { threshold: 19999, minus: 700 },
  { threshold: 18999, minus: 665 }, { threshold: 17999, minus: 630 }, { threshold: 15999, minus: 560 },
  { threshold: 12999, minus: 455 }, { threshold: 11999, minus: 420 }, { threshold: 10999, minus: 385 },
  { threshold: 9999, minus: 350 }, { threshold: 8999, minus: 225 }, { threshold: 6999, minus: 175 },
  { threshold: 5999, minus: 150 }, { threshold: 3999, minus: 100 }, { threshold: 3699, minus: 76 },
  { threshold: 2699, minus: 56 }, { threshold: 1699, minus: 35 }, { threshold: 699, minus: 5 },
]

const STALLS = [
  { id: 's1', name: 'HERS', market: '沙河', address: '沙河南城 3F 318', score: 4.9, shipRate: 98, subsidy: SUBSIDY, shipCity: '广州', returns: false, newCount: 36 },
  { id: 's2', name: 'Sinsa×SUSAN', market: '沙河', address: '沙河金马 2F 208', score: 4.8, shipRate: 97, subsidy: SUBSIDY, shipCity: '广州', returns: true, newCount: 22 },
  { id: 's3', name: 'FIFTEEN', market: '沙河', address: '沙河南城 1F 106', score: 4.7, shipRate: 96, subsidy: SUBSIDY, shipCity: '广州', returns: false, newCount: 18 },
  { id: 's4', name: 'I am 沐', market: '杭州', address: '四季青 2F 2108', score: 4.9, shipRate: 97, subsidy: SUBSIDY, shipCity: '杭州', returns: true, newCount: 28 },
  { id: 's5', name: 'LUMI', market: '杭州', address: '意法 4F 4021', score: 4.8, shipRate: 95, subsidy: SUBSIDY, shipCity: '杭州', returns: true, newCount: 24 },
  { id: 's6', name: '辛迪.AmoreAngel', market: '濮院', address: '濮院 A区 2216', score: 4.8, shipRate: 94, subsidy: SUBSIDY, shipCity: '桐乡', returns: false, newCount: 16 },
  { id: 's7', name: 'MEI ZI 美姿', market: '南油', address: '南油 1F 1055', score: 4.7, shipRate: 95, subsidy: SUBSIDY, shipCity: '深圳', returns: true, newCount: 20 },
  { id: 's8', name: '西柚/KAKABO', market: '十三行', address: '十三行 4-6楼 5066', score: 4.6, shipRate: 96, subsidy: SUBSIDY, shipCity: '广州', returns: false, newCount: 30 },
]

const SEED = [
  { t: '叠穿好美~气质温柔韩系小衫(韩标)', s: 's1', p: 39.9, img: 3, joined: 340, day: '09.10' },
  { t: '简约温柔气质日常无袖拉毛保暖毛衣', s: 's1', p: 59.9, img: 7, joined: 1416, day: '09.10' },
  { t: '韩系日常通勤小花苞长款半身裙', s: 's1', p: 49.9, img: 4, joined: 454, day: '09.11' },
  { t: '简约古早氛围感连帽开衫保暖毛衣(配可拆卸仿毛毛领)', s: 's1', p: 79.9, img: 7, joined: 553, day: '09.11' },
  { t: '复古日系气球九分灯芯绒休闲裤(配腰带)', s: 's1', p: 55.0, img: 5, joined: 209, day: '09.10' },
  { t: '韩系无袖洋气显瘦背心(不含项链和裤子)', s: 's3', p: 35.0, img: 1, joined: 33, day: '09.11' },
  { t: '韩国加厚口袋洗水短外套(不含内搭)', s: 's3', p: 129.0, img: 10, joined: 54, day: '09.09' },
  { t: '休闲轻运动感两件套 卫衣外套+半身裙套装', s: 's1', p: 99.0, img: 12, joined: 533, day: '09.08' },
  { t: '气质淡人感两件套 微高领背心+开衫套装', s: 's1', p: 89.0, img: 12, joined: 556, day: '09.08' },
  { t: '秋冬费尔岛复古韩系提花毛衣(含29.3%绵羊毛)', s: 's2', p: 76.0, img: 7, joined: 35, day: '09.11' },
  { t: '海盐蓝条娃娃领 韩系慵懒拉满撞色毛衣', s: 's2', p: 72.0, img: 7, joined: 32, day: '09.11' },
  { t: '简约日常通勤撞色V领修身打底衫', s: 's1', p: 42.0, img: 1, joined: 588, day: '09.10' },
  { t: '日系压线气球九分牛仔休闲裤', s: 's1', p: 62.0, img: 6, joined: 428, day: '09.10' },
  { t: '好气质~超美两件套 抹胸+绑带小衫套装', s: 's1', p: 68.0, img: 12, joined: 516, day: '09.09' },
  { t: '韩系简约百搭毛呢半身裙(含25%羊毛)', s: 's1', p: 58.0, img: 4, joined: 133, day: '09.09' },
  { t: '拿破仑麂皮绒短外套+A字半身裙两件套(配腰带)', s: 's7', p: 138.0, img: 8, joined: 32, day: '09.11' },
  { t: '千金风复古气质三件套 衬衫+半身裙+马甲套装', s: 's7', p: 158.0, img: 12, joined: 30, day: '09.10' },
  { t: '可解锁2种领口穿法抓绒卫衣', s: 's1', p: 46.0, img: 9, joined: 213, day: '09.10' },
  { t: '斜扣设计感门襟高腰休闲裤', s: 's1', p: 59.0, img: 5, joined: 81, day: '09.09' },
  { t: '简约气质配腰带显瘦短款直筒半身裙', s: 's5', p: 56.0, img: 4, joined: 143, day: '09.11' },
  { t: '复古美拉德麂皮绒开叉显瘦半身裙(不含上衣)', s: 's5', p: 48.0, img: 4, joined: 33, day: '09.11' },
  { t: '老钱调性麻花真两件拼接针织衫', s: 's1', p: 86.0, img: 7, joined: 236, day: '09.08' },
  { t: '高密有厚度圆领打底衫(韩标)', s: 's1', p: 36.0, img: 1, joined: 331, day: '09.11' },
  { t: '法式温柔碎花晕染V领蕾丝拼接连衣裙', s: 's4', p: 78.0, img: 2, joined: 32, day: '09.11' },
  { t: '强推款 韩系温柔竖坑条宽松蝙蝠袖针织开衫', s: 's4', p: 69.0, img: 7, joined: 32, day: '09.10' },
  { t: '气质领口设计感 可斜肩平领针织衫', s: 's1', p: 49.0, img: 7, joined: 563, day: '09.10' },
  { t: '气质日常杂色可斜肩穿荡领保暖毛衣', s: 's1', p: 56.0, img: 7, joined: 377, day: '09.09' },
  { t: '穿搭设计感工装假两件屁帘卫裤休闲裤(松紧腰)', s: 's8', p: 62.0, img: 5, joined: 31, day: '09.11' },
  { t: '乖巧娃娃领设计 高品质排扣毛衣', s: 's2', p: 58.0, img: 7, joined: 46, day: '09.11' },
  { t: '经典廓形大翻领双排扣风衣(配腰绳)', s: 's6', p: 168.0, img: 8, joined: 42, day: '09.10' },
  { t: '复古麂皮绒翻领不规则短外套(配腰带)', s: 's6', p: 132.0, img: 10, joined: 52, day: '09.10' },
  { t: '复古日常街头感皮夹克短外套', s: 's1', p: 108.0, img: 10, joined: 394, day: '09.09' },
  { t: '复古简约百搭格子长款半身裙(含15%羊毛)', s: 's1', p: 66.0, img: 4, joined: 110, day: '09.08' },
  { t: '翻领排扣豹纹时尚衬衫(不含披肩和包)', s: 's3', p: 43.0, img: 3, joined: 41, day: '09.11' },
  { t: '爱心图案宽松牛仔裤(不含上衣)', s: 's3', p: 62.0, img: 6, joined: 39, day: '09.10' },
  { t: '多巴胺色系撞色条纹新款排扣保暖毛衣(只卖上衣)', s: 's2', p: 66.0, img: 7, joined: 31, day: '09.11' },
]

const COLOR_POOL = [
  { name: '米白', hex: '#efe9df' }, { name: '雾霾蓝', hex: '#8fa6bd' }, { name: '燕麦杏', hex: '#d8c3a5' },
  { name: '黑色', hex: '#2b2b2b' }, { name: '奶咖', hex: '#b79b83' }, { name: '橄榄绿', hex: '#7b8a63' },
  { name: '烟灰粉', hex: '#d9a7ac' }, { name: '酒红', hex: '#8d3b45' },
]

const PARAM_POOL = [
  '面料:人棉|配件:无配件|面料厚度:常规|加绒情况:不加绒|季节:秋|版型:宽松|廓形:H|领型:圆领|门襟:套头|口袋情况:无口袋|里布情况:无里布|袖型:喇叭袖|袖长:长袖|衣长:常规款|图案:纯色|工艺:无|尺码偏差:正常',
  '面料:针织|配件:腰带|面料厚度:厚|加绒情况:加绒|季节:秋冬|版型:修身|廓形:X|领型:V领|门襟:套头|口袋情况:无口袋|里布情况:无里布|袖型:常规袖|袖长:长袖|衣长:常规款|图案:条纹|工艺:提花|尺码偏差:正常',
  '面料:牛仔|配件:无配件|面料厚度:常规|加绒情况:不加绒|季节:四季|版型:直筒|廓形:H|领型:无|门襟:拉链|口袋情况:四袋|里布情况:无里布|袖型:无|袖长:无|衣长:长裤|图案:纯色|工艺:水洗|尺码偏差:正常',
]

const GOODS = SEED.map((s, i) => {
  const n = i + 1
  const stall = STALLS.find((x) => x.id === s.s) || STALLS[0]
  const paramsArr = PARAM_POOL[i % PARAM_POOL.length].split('|').map((kv) => {
    const [k, v] = kv.split(':')
    return { k, v }
  })
  const colors = [COLOR_POOL[i % 8], COLOR_POOL[(i + 3) % 8], COLOR_POOL[(i + 5) % 8]]
  const isPants = /裤|半身裙|牛仔/.test(s.t)
  return {
    id: 'g' + n,
    title: s.t + ' ' + (66000 + n) + '#',
    goodsNo: String(66000 + n),
    stallId: stall.id,
    stallName: stall.name,
    market: stall.market,
    price: s.p, // 拿货价（认证后可见）
    suggestPrice: Math.round(s.p * (2.6 + (i % 4) * 0.25) * 100) / 100, // 建议零售价
    img: `g${s.img}`,
    imgs: ['模特图', '实拍图', '尺码'].map((label) => ({
      label,
      list: [`g${s.img}`, `g${((s.img + 3) % 18) + 1}`, `g${((s.img + 6) % 18) + 1}`],
    })),
    joined: s.joined,
    day: s.day,
    isNew: s.day === '09.11',
    hasVideo: i % 3 === 0,
    fastShip: i % 2 === 0,
    colors,
    sizes: isPants ? ['S', 'M', 'L', 'XL'] : ['S', 'M', 'L', 'XL'],
    params: paramsArr,
    services: i % 4 === 0 ? ['24H发货', '慢必赔', '批量采购价'] : i % 3 === 0 ? ['24H发货', '满减', '红包'] : ['慢必赔', '实拍视频'],
    subsidy: stall.subsidy,
    shipCity: stall.shipCity,
    returns: stall.returns,
    lastShipDate: '09月21日',
  }
})

const HOTS = GOODS.filter((g) => g.joined > 300).slice(0, 6)
const NEWS = GOODS.filter((g) => g.isNew).slice(0, 8)

const COUPONS = [
  { id: 'c1', type: '红包', amount: 30, threshold: 339, title: '新人红包', desc: '全平台商品可用，领取后 168 小时内有效', expire: '2026-12-31' },
  { id: 'c2', type: '包邮券', amount: 0, threshold: 899, title: '全平台包邮券', desc: '单笔满 899 免运费，全平台通用', expire: '2026-12-31' },
  { id: 'c3', type: '退货卡', amount: 0, threshold: 0, title: '退货卡', desc: '满额 3 倍可用，支持无理由退货的商品可用', expire: '2026-12-31' },
  { id: 'c4', type: '优惠券', amount: 15, threshold: 199, title: '档口通用券', desc: '满 199 减 15，可与档口阶梯满减叠加', expire: '2026-12-31' },
]

module.exports = {
  MARKETS, FILTERS, CATEGORIES, HOT_CATEGORIES, STALLS, GOODS, SUBSIDY, HOTS, NEWS, COLOR_POOL, COUPONS,
  getStall: (id) => STALLS.find((s) => s.id === id),
  getGoods: (id) => GOODS.find((g) => g.id === id),
  goodsByStall: (id) => GOODS.filter((g) => g.stallId === id),
  searchGoods: (kw) => (kw ? GOODS.filter((g) => g.title.indexOf(kw) > -1 || g.stallName.indexOf(kw) > -1 || g.market.indexOf(kw) > -1) : []),
}
