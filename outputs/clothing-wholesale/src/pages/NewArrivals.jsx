import React, { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { TabBar } from '../components/ui.jsx'
import { GoodsGrid } from '../components/cards.jsx'
import { GOODS, MARKETS, STALLS } from '../data/mock.js'
import { useRoute } from '../router.js'

const SORTS = [
  { key: 'new', label: '最新上架' },
  { key: 'hot', label: '拿货最多' },
  { key: 'price', label: '批发价低' },
]

export default function NewArrivals() {
  const route = useRoute()
  const [market, setMarket] = useState('全部市场')
  const [sort, setSort] = useState(route.query.sort || 'new')
  const [quick, setQuick] = useState(route.query.filter || '')

  const list = useMemo(() => {
    let l = GOODS.filter((g) => market === '全部市场' || g.market === market)
    if (quick === 'stock') l = l.filter((g) => g.tags.includes('现货24H发'))
    if (quick === 'moq') l = l.filter((g) => g.moq <= 1)
    if (quick === 'buyer') l = l.filter((g) => g.tags.includes('买手推荐'))
    const by = { new: (a, b) => a.newHours - b.newHours, hot: (a, b) => b.hot - a.hot, price: (a, b) => a.price - b.price }
    return [...l].sort(by[sort] || by.new)
  }, [market, sort, quick])

  const quickFilters = [
    { key: '', label: '全部' },
    { key: 'stock', label: '现货24H发' },
    { key: 'moq', label: '一件起批' },
    { key: 'buyer', label: '买手推荐' },
  ]

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-head-top">
          <h1>每日上新</h1>
          <span className="page-head-sub">
            <Icon name="clock" size={13} color="#9a9aa3" />
            今日已上新 {GOODS.filter((g) => g.newHours <= 24).length} 款
          </span>
        </div>
        <div className="chips-row">
          {quickFilters.map((q) => (
            <button key={q.key} className={'chip' + (quick === q.key ? ' on' : '')} onClick={() => setQuick(q.key)}>
              {q.label}
            </button>
          ))}
        </div>
      </header>

      <div className="filter-bar">
        <div className="market-scroll">
          {MARKETS.map((m) => (
            <button key={m} className={'chip plain' + (market === m ? ' on' : '')} onClick={() => setMarket(m)}>
              {m}
            </button>
          ))}
        </div>
        <div className="sort-row">
          {SORTS.map((s) => (
            <button key={s.key} className={'sort' + (sort === s.key ? ' on' : '')} onClick={() => setSort(s.key)}>
              {s.label}
            </button>
          ))}
          <span className="sort-count">共 {list.length} 款</span>
        </div>
      </div>

      <div className="new-list">
        {list.map((g) => (
          <div key={g.id} className="newrow" onClick={() => (location.hash = '#/goods/' + g.id)}>
            <div className="newrow-img">
              <img src={`goods/g${g.img}.svg`} alt={g.title} loading="lazy" />
              {g.newHours <= 24 ? <span className="newrow-badge">今天上新</span> : null}
            </div>
            <div className="newrow-body">
              <p className="newrow-title">{g.title}</p>
              <p className="newrow-stall">
                {STALLS.find((s) => s.id === g.stallId)?.name} · {g.market}
              </p>
              <div className="newrow-tags">
                {g.tags.map((t) => (
                  <span key={t} className="mini-tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="newrow-foot">
                <span className="gcard-price">
                  <i>¥</i>
                  {g.price}
                  <em>/件</em>
                </span>
                <span className="newrow-time">{g.newHours} 小时前上架</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="new" />
    </div>
  )
}
