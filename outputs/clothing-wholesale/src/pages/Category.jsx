import React, { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { TabBar } from '../components/ui.jsx'
import { GoodsGrid } from '../components/cards.jsx'
import { CATEGORIES, GOODS, goodsByCategory } from '../data/mock.js'
import { go, useRoute } from '../router.js'

export default function Category() {
  const route = useRoute()
  const [catId, setCatId] = useState(route.query.cat || CATEGORIES[0].id)
  const [sub, setSub] = useState('')
  const cat = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0]

  const list = useMemo(() => {
    const l = sub ? goodsByCategory(cat.id, sub) : goodsByCategory(cat.id)
    return l.length ? l : GOODS.filter((g) => g.categoryId === cat.id)
  }, [cat.id, sub])

  return (
    <div className="page page-category">
      <header className="cat-head">
        <div className="searchbar" onClick={() => go('#/search')}>
          <Icon name="search" size={16} color="#a5a5b0" />
          <span className="ph">搜索档口 / 商品</span>
        </div>
      </header>
      <div className="cat-body">
        <aside className="cat-rail">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={'rail-item' + (c.id === catId ? ' on' : '')}
              onClick={() => {
                setCatId(c.id)
                setSub('')
              }}
            >
              {c.name}
            </button>
          ))}
          <div className="rail-hint">共 {GOODS.length} 款在架</div>
        </aside>
        <main className="cat-main">
          <div className="cat-banner">
            <span className="cat-banner-title">{cat.name} · 源头档口</span>
            <span className="cat-banner-sub">一件起批 · 单款单色打包价</span>
          </div>
          <div className="sub-chips">
            <button className={'chip' + (sub === '' ? ' on' : '')} onClick={() => setSub('')}>
              全部
            </button>
            {cat.subs.map((s) => (
              <button key={s} className={'chip' + (sub === s ? ' on' : '')} onClick={() => setSub(s)}>
                {s}
              </button>
            ))}
          </div>
          {list.length ? (
            <GoodsGrid list={list} className="tight" />
          ) : (
            <p className="cat-empty">该分类暂无在架商品，换个分类看看</p>
          )}
        </main>
      </div>
      <TabBar active="category" />
    </div>
  )
}
