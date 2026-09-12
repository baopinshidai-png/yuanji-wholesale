import React, { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Empty } from '../components/ui.jsx'
import { GoodsGrid } from '../components/cards.jsx'
import { searchGoods } from '../data/mock.js'
import { useRoute } from '../router.js'
import { useStore } from '../store.jsx'

const HOT = ['连衣裙', '羊绒衫', '阔腿裤', '小香风', '大码', '童装套装', '牛仔', '衬衫', '帽子']

export default function Search() {
  const route = useRoute()
  const { toast } = useStore()
  const [kw, setKw] = useState(route.query.kw || '')
  const [history, setHistory] = useState(['针织开衫', '阔腿裤'])
  const results = useMemo(() => searchGoods(kw), [kw])
  const scanning = route.query.scan === '1'

  const submit = (word) => {
    const w = (word ?? kw).trim()
    if (!w) return
    setKw(w)
    setHistory((h) => [w, ...h.filter((x) => x !== w)].slice(0, 8))
  }

  return (
    <div className="page page-search">
      <header className="search-head">
        <button className="back" onClick={() => window.history.back()}>
          <Icon name="back" size={20} />
        </button>
        <div className="searchbar solid">
          <Icon name="search" size={16} color="#a5a5b0" />
          <input
            autoFocus
            value={kw}
            placeholder="搜款号 / 连衣裙 / 羊绒衫"
            onChange={(e) => setKw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {kw ? (
            <span className="clear" onClick={() => setKw('')}>
              <Icon name="close" size={14} color="#b6b6c0" />
            </span>
          ) : null}
        </div>
        <button className="search-btn" onClick={() => submit()}>
          搜索
        </button>
      </header>

      {scanning ? (
        <div className="scan-tip">
          <Icon name="scan" size={16} color="var(--c-brand)" />
          以图搜款：上传/拍摄商品图，平台自动匹配同款档口货源
          <button onClick={() => toast('演示环境：图搜引擎需后端支持（方案见 docs）')}>上传图片</button>
        </div>
      ) : null}

      {!kw ? (
        <div className="search-body">
          <div className="search-block">
            <div className="search-block-head">
              <span>历史搜索</span>
              <button onClick={() => setHistory([])}>
                <Icon name="trash" size={14} color="#b0b0ba" />
              </button>
            </div>
            <div className="chips-row wrap">
              {history.map((h) => (
                <button key={h} className="chip plain" onClick={() => submit(h)}>
                  {h}
                </button>
              ))}
              {!history.length ? <span className="muted">暂无历史</span> : null}
            </div>
          </div>
          <div className="search-block">
            <div className="search-block-head">
              <span>
                <Icon name="fire" size={14} color="var(--c-brand)" /> 热门拿货
              </span>
            </div>
            <div className="chips-row wrap">
              {HOT.map((h) => (
                <button key={h} className="chip" onClick={() => submit(h)}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <button className="imgsearch-btn" onClick={() => toast('演示环境：图搜引擎需后端支持（方案见 docs）')}>
            <Icon name="camera" size={16} color="var(--c-brand)" />
            用图片找同款（以图搜款）
          </button>
        </div>
      ) : (
        <div className="search-result">
          <p className="search-result-head">
            找到 <b>{results.length}</b> 个相关货源
          </p>
          {results.length ? (
            <GoodsGrid list={results} className="tight" />
          ) : (
            <Empty
              icon="search"
              title="没有找到相关货源"
              desc="换个关键词试试，或用在「以图搜款」上传图片"
              actionText="去逛上新"
              actionTo="#/new"
            />
          )}
        </div>
      )}
    </div>
  )
}
