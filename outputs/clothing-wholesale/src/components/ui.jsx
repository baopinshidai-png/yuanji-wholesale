import React from 'react'
import Icon from './Icon.jsx'
import { go } from '../router.js'
import { cartCount, useStore } from '../store.jsx'

/** 通用卡片 */
export function Card({ children, className = '', onClick, style }) {
  return (
    <div className={'card ' + className} onClick={onClick} style={style}>
      {children}
    </div>
  )
}

export function NavBar({ title, right, onBack }) {
  return (
    <div className="navbar">
      <button className="navbar-back" onClick={() => (onBack ? onBack() : window.history.back())} aria-label="返回">
        <Icon name="back" size={20} />
      </button>
      <div className="navbar-title">{title}</div>
      <div className="navbar-right">{right}</div>
    </div>
  )
}

const TABS = [
  { key: '', label: '首页', icon: 'home' },
  { key: 'category', label: '分类', icon: 'grid' },
  { key: 'new', label: '上新', icon: 'spark' },
  { key: 'cart', label: '进货单', icon: 'cart', badge: true },
  { key: 'mine', label: '我的', icon: 'user' },
]

export function TabBar({ active }) {
  const { cart } = useStore()
  const n = cartCount(cart)
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = active === t.key
        return (
          <button key={t.key} className={'tab' + (on ? ' on' : '')} onClick={() => go('#/' + t.key)}>
            <span className="tab-icon">
              <Icon name={on ? (t.icon === 'grid' ? 'grid-fill' : t.icon === 'spark' ? 'spark-fill' : t.icon === 'home' ? 'home-fill' : t.icon) : t.icon} size={22} />
              {t.badge && n > 0 ? <i className="tab-badge">{n > 99 ? '99+' : n}</i> : null}
            </span>
            <span className="tab-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function SectionHead({ title, sub, more, to, icon }) {
  return (
    <div className="sec-head">
      <div className="sec-title">
        {icon ? <Icon name={icon} size={16} color="var(--c-brand)" /> : null}
        <span>{title}</span>
        {sub ? <em>{sub}</em> : null}
      </div>
      {more ? (
        <button className="sec-more" onClick={() => to && go(to)}>
          {more}
          <Icon name="right" size={13} />
        </button>
      ) : null}
    </div>
  )
}

export function Tags({ list, tone = 'plain', size = 10 }) {
  if (!list || !list.length) return null
  return (
    <span className="tags">
      {list.map((t) => (
        <span key={t} className={'tag tag-' + tone} style={{ fontSize: size }}>
          {t}
        </span>
      ))}
    </span>
  )
}

export function Price({ value, size = 16, className = '' }) {
  return (
    <span className={'price ' + className} style={{ fontSize: size }}>
      <i>¥</i>
      {value}
    </span>
  )
}

export function Stepper({ value, onChange, min = 1, max = 9999, small }) {
  return (
    <span className={'stepper' + (small ? ' sm' : '')}>
      <button disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="减少">
        <Icon name="minus" size={small ? 12 : 14} />
      </button>
      <input value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value.replace(/\D/g, '')) || min)))} />
      <button disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="增加">
        <Icon name="plus" size={small ? 12 : 14} />
      </button>
    </span>
  )
}

export function Empty({ icon = 'box', title, desc, actionText, actionTo, onAction }) {
  return (
    <div className="empty">
      <Icon name={icon} size={52} color="#d8d8de" strokeWidth={1.2} />
      <p className="empty-title">{title}</p>
      {desc ? <p className="empty-desc">{desc}</p> : null}
      {actionText ? (
        <button className="btn primary sm" onClick={() => (onAction ? onAction() : actionTo && go(actionTo))}>
          {actionText}
        </button>
      ) : null}
    </div>
  )
}

export function Row({ label, value, onClick, arrow, className = '' }) {
  return (
    <div className={'row ' + className} onClick={onClick}>
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
      {arrow ? <Icon name="right" size={14} color="#c9c9d1" /> : null}
    </div>
  )
}
