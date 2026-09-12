import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ADDRESSES, DEFAULT_ADDRESS } from './data/mock.js'

const KEY = 'yuanji_wholesale_state_v1'

const StoreContext = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* ignore */
  }
  return null
}

const initialState = {
  user: null, // { phone, name, certified, level }
  cart: [], // { goodsId, color, size, qty }
  favorites: [], // goodsId[]
  orders: [],
  coupons: [], // 已领取的券 id
  addresses: ADDRESSES,
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => ({ ...initialState, ...(loadState() || {}) }))
  const [toast, setToast] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      /* ignore */
    }
  }, [state])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const api = useMemo(() => {
    const login = (phone, name) => {
      setState((s) => ({ ...s, user: { phone, name: name || '新店主', certified: true, level: '批发会员 V2' }, coupons: Array.from(new Set([...s.coupons, 'c1', 'c2', 'c3'])) }))
      setToast('认证成功，批发价已解锁')
    }
    const logout = () => setState((s) => ({ ...s, user: null }))
    const addToCart = (goodsId, color, size, qty = 1, silent) => {
      setState((s) => {
        const idx = s.cart.findIndex((i) => i.goodsId === goodsId && i.color === color && i.size === size)
        const cart = [...s.cart]
        if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty }
        else cart.push({ goodsId, color, size, qty })
        return { ...s, cart }
      })
      if (!silent) setToast('已加入进货单')
    }
    const setQty = (goodsId, color, size, qty) => {
      setState((s) => ({
        ...s,
        cart: s.cart
          .map((i) => (i.goodsId === goodsId && i.color === color && i.size === size ? { ...i, qty } : i))
          .filter((i) => i.qty > 0),
      }))
    }
    const removeFromCart = (goodsId, color, size) =>
      setState((s) => ({ ...s, cart: s.cart.filter((i) => !(i.goodsId === goodsId && i.color === color && i.size === size)) }))
    const clearCart = () => setState((s) => ({ ...s, cart: [] }))
    const toggleFavorite = (goodsId) => {
      setState((s) => {
        const has = s.favorites.includes(goodsId)
        setToast(has ? '已取消收藏' : '已收藏')
        return { ...s, favorites: has ? s.favorites.filter((id) => id !== goodsId) : [...s.favorites, goodsId] }
      })
    }
    const claimCoupon = (id) => {
      setState((s) => (s.coupons.includes(id) ? s : { ...s, coupons: [...s.coupons, id] }))
      setToast('领取成功')
    }
    const createOrder = (items, address, amount) => {
      const id = 'YJ' + Date.now().toString().slice(-10)
      const order = {
        id,
        items,
        address,
        amount,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
        logistics: [],
      }
      setState((s) => ({ ...s, orders: [order, ...s.orders] }))
      return id
    }
    const updateOrder = (id, status) =>
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      }))
    const addAddress = (addr) =>
      setState((s) => ({ ...s, addresses: [...s.addresses, { ...addr, id: 'a' + Date.now() }] }))
    const setToast2 = (msg) => setToast(msg)
    return {
      login,
      logout,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleFavorite,
      claimCoupon,
      createOrder,
      updateOrder,
      addAddress,
      toast: setToast2,
      defaultAddress: DEFAULT_ADDRESS,
    }
  }, [])

  const value = useMemo(() => ({ ...state, ...api }), [state, api])
  return (
    <StoreContext.Provider value={value}>
      {children}
      {toast ? <div className="toast">{toast}</div> : null}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** 进货单数量合计 */
export function cartCount(cart) {
  return cart.reduce((n, i) => n + i.qty, 0)
}
