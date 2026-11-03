import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) => {
        const existing = get().items.find((item) => item.product.id === product.id)
        const max = product.stock ?? 99
        if (existing) {
          set({
            items: get().items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: Math.min(item.quantity + quantity, max) }
                : item
            )
          })
          return
        }
        set({ items: [...get().items, { product, quantity: Math.min(quantity, max) }] })
      },
      setQuantity: (productId, quantity) =>
        set({
          items: get().items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock ?? 99)) }
              : item
          )
        }),
      remove: (productId) =>
        set({ items: get().items.filter((item) => item.product.id !== productId) }),
      clear: () => set({ items: [] })
    }),
    { name: 'proforma-cart' }
  )
)

export const cartCount = (state) => state.items.reduce((total, item) => total + item.quantity, 0)

export const cartSubtotal = (state) =>
  state.items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0)