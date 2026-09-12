// 价格闸门与档口阶梯满减：服务端统一计算，客户端只做展示
export function priceView(goods, user) {
  const certified = !!(user && user.certified)
  if (certified) {
    return {
      locked: false,
      main: Number(goods.price).toFixed(2),
      label: '拿货价',
      origin: Number(goods.suggestPrice).toFixed(2),
      boost: (Math.round(Number(goods.price) * 0.87 * 100) / 100).toFixed(2),
      boostLabel: '助力预估价',
      tip: '',
    }
  }
  return {
    locked: true,
    main: Number(goods.suggestPrice).toFixed(2),
    label: '建议零售价',
    origin: '',
    boost: '',
    boostLabel: '',
    tip: user ? '完成认证可看拿货价' : '登录看拿货价',
  }
}

// 按档口金额命中最高一档满减
export function stallDiscount(tiers, amount) {
  if (!tiers || !tiers.length) return 0
  const hit = tiers
    .filter((t) => amount >= t.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0]
  return hit ? hit.minus : 0
}

// 商品对外形状：未认证用户不带拿货价
export function publicGoods(goods, user) {
  const pv = priceView(goods, user)
  const out = Object.assign({}, goods, {
    pv,
    price: pv.locked ? undefined : goods.price,
  })
  if (pv.locked) delete out.price
  return out
}
