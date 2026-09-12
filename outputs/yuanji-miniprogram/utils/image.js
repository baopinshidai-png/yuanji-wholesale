// 商品图统一成可直接给 <image src> 用的地址：
// 平台内置图是 /images/goods/gN.jpg，档口上传的是后端返回的绝对地址
const LOCAL_PREFIX = '/images/goods/'

function one(id) {
  const v = String(id || '')
  if (!v) return ''
  if (v.indexOf('http') === 0 || v.indexOf('/uploads/') === 0) return v
  if (v.indexOf(LOCAL_PREFIX) === 0) return v
  return LOCAL_PREFIX + v + '.jpg'
}

// 就地补上 imgUrl，并把 imgs 里每一张也转成可用地址
function normalizeGoods(goods) {
  if (!goods || typeof goods !== 'object') return goods
  goods.imgUrl = one(goods.imgUrl || goods.img)
  if (goods.imgs && goods.imgs.length) {
    goods.imgs.forEach(function (tab) {
      if (tab && tab.list) tab.list = tab.list.map(one)
    })
  }
  return goods
}

function normalizeList(list) {
  return (list || []).map(normalizeGoods)
}

// 订单/进货车条目
function normalizeItem(item) {
  if (!item || typeof item !== 'object') return item
  item.imgUrl = one(item.imgUrl || item.img)
  return item
}

module.exports = { one, normalizeGoods, normalizeList, normalizeItem }
