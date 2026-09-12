import React from 'react'
import Icon from '../components/Icon.jsx'
import { Card, SectionHead, TabBar, Tags } from '../components/ui.jsx'
import { GoodsCard, GoodsGrid, StallCard } from '../components/cards.jsx'
import { BANNERS, CATEGORIES, GOODS, LIVES, QUICK_ENTRIES, STALLS, hotGoods, newArrivals } from '../data/mock.js'
import { go } from '../router.js'

export default function Home() {
  const news = newArrivals().slice(0, 6)
  const hots = hotGoods().slice(0, 6)
  const stalls = STALLS.slice(0, 8)

  return (
    <div className="page">
      <header className="home-head">
        <div className="home-top">
          <div className="brand">
            源集<em>·源头档口</em>
          </div>
          <button className="loc" onClick={() => go('#/new')}>
            <Icon name="location" size={13} color="var(--c-brand)" />
            全国一批市场
            <Icon name="down" size={12} color="#9a9aa3" />
          </button>
          <div className="home-actions">
            <button onClick={() => go('#/coupons')} aria-label="消息">
              <Icon name="bell" size={20} color="#fff" />
            </button>
          </div>
        </div>
        <div className="searchbar" onClick={() => go('#/search')}>
          <Icon name="search" size={16} color="#a5a5b0" />
          <span className="ph">搜款号 / 连衣裙 / 羊绒衫</span>
          <span className="searchbar-scan" onClick={(e) => { e.stopPropagation(); go('#/search?scan=1') }}>
            <Icon name="scan" size={15} color="var(--c-brand)" />
            图搜
          </span>
        </div>
      </header>

      <div className="home-banners">
        {BANNERS.map((b) => (
          <div key={b.id} className={'banner banner-' + b.tone} onClick={() => go(b.link)}>
            <p className="banner-title">{b.title}</p>
            <p className="banner-sub">{b.sub}</p>
            <span className="banner-btn">立即查看</span>
          </div>
        ))}
      </div>

      <div className="quick-row">
        {QUICK_ENTRIES.map((q) => (
          <button key={q.id} className="quick" onClick={() => go(q.link)}>
            <span className="quick-icon">
              <Icon name={q.icon} size={17} color="var(--c-brand)" />
            </span>
            <span className="quick-text">
              <b>{q.name}</b>
              <i>{q.desc}</i>
            </span>
          </button>
        ))}
      </div>

      <Card className="kingkong">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="kk" onClick={() => go('#/category?cat=' + c.id)}>
            <span className="kk-icon">{c.name.slice(0, 1)}</span>
            <span className="kk-name">{c.name}</span>
          </button>
        ))}
        <button className="kk" onClick={() => go('#/category')}>
          <span className="kk-icon ghost">
            <Icon name="grid" size={18} color="#a5a5b0" />
          </span>
          <span className="kk-name">全部</span>
        </button>
      </Card>

      <section className="block">
        <SectionHead title="今日上新" sub="每日 6000+ 款" more="全部上新" to="#/new" icon="spark" />
        <div className="hscroll">
          {news.map((g) => (
            <div key={g.id} className="hscroll-item">
              <GoodsCard g={g} />
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <SectionHead title="爆款榜单" sub="近 7 日拿货最多" more="查看更多" to="#/new?sort=hot" icon="fire" />
        <div className="rankcard">
          {hots.map((g, i) => (
            <div key={g.id} className="rankrow" onClick={() => go('#/goods/' + g.id)}>
              <span className={'rankno r' + (i + 1)}>{i + 1}</span>
              <img src={`goods/g${g.img}.svg`} alt={g.title} loading="lazy" />
              <div className="rankbody">
                <p>{g.title}</p>
                <div className="rankmeta">
                  <span className="rankprice">
                    ¥{g.price}
                    <i>起批</i>
                  </span>
                  <span className="ranksold">已售 {g.sold}</span>
                </div>
              </div>
              <button className="btn ghost xs">去拿货</button>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <SectionHead title="源头档口推荐" sub="平台已验资质" more="全部档口" to="#/category" icon="tag" />
        <div className="hscroll">
          {stalls.map((s) => (
            <div key={s.id} className="hscroll-item wide">
              <StallCard s={s} />
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <SectionHead title="档口直播拿货" sub="边看边拿" more="全部直播" to="#/live" icon="live" />
        <div className="hscroll">
          {LIVES.slice(0, 3).map((l) => (
            <div key={l.id} className="livecard" onClick={() => go('#/live')}>
              <div className="livecard-cover">
                <img src={`goods/g${(Number(l.stallId.slice(1)) % 18) + 1}.svg`} alt="" />
                <span className="livecard-badge">
                  <i className="dot" />
                  {l.status === 'living' ? '直播中' : '即将开播'}
                </span>
                <span className="livecard-viewers">{l.viewers} 人看</span>
              </div>
              <p className="livecard-title">{l.title}</p>
              <p className="livecard-host">{l.host}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <SectionHead title="全部货源" sub={`共 ${GOODS.length} 款在架`} icon="box" />
        <GoodsGrid list={GOODS} />
      </section>

      <div className="trust-strip">
        <span>
          <Icon name="shield" size={13} color="#12b76a" />
          档口资质已验
        </span>
        <span>
          <Icon name="clock" size={13} color="#12b76a" />
          现货 24H 发
        </span>
        <span>
          <Icon name="wallet" size={13} color="#12b76a" />
          断货赔付
        </span>
      </div>

      <TabBar active="" />
    </div>
  )
}
