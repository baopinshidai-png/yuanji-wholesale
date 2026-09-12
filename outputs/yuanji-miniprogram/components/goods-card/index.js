const store = require('../../utils/store.js')

Component({
  properties: {
    goods: { type: Object, value: {} },
  },
  data: { pv: { main: '', label: '' }, fav: false },
  observers: {
    goods(g) {
      if (g && g.id) this.setData({ pv: store.priceView(g), fav: store.isFav(g.id) })
    },
  },
  methods: {
    onTap() {
      wx.navigateTo({ url: '/pages/goods/index?id=' + this.data.goods.id })
    },
    onFav() {
      this.setData({ fav: store.toggleFav(this.data.goods.id) })
    },
  },
})
