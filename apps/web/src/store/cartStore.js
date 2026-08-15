import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function getGuestCart() {
  try {
    const raw = localStorage.getItem('delux_guest_cart');
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function setGuestCart(cart) {
  try {
    localStorage.setItem('delux_guest_cart', JSON.stringify(cart));
  } catch {}
}

export const useCartStore = create((set, get) => ({
  cart: getGuestCart(),
  isLoading: false,

  fetchCart: async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      set({ cart: getGuestCart() });
      return;
    }

    set({ isLoading: true });
    try {
      const guestCart = getGuestCart();
      if (guestCart?.items?.length > 0) {
        for (const item of guestCart.items) {
          try {
            await api.post('/cart/items', { productId: item.productId, quantity: item.quantity });
          } catch {}
        }
        localStorage.removeItem('delux_guest_cart');
      }

      const { data } = await api.get('/cart');
      set({ cart: data.cart });
    } catch (e) {
      console.error('fetchCart error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1, productDetails = null) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestCart();
      const items = [...(current.items || [])];
      const existing = items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          id: `guest_${Date.now()}_${Math.random()}`,
          productId,
          quantity,
          product: productDetails || { id: productId },
        });
      }
      const updated = { ...current, items };
      setGuestCart(updated);
      set({ cart: updated });
      return;
    }

    try {
      const { data } = await api.post('/cart/items', { productId, quantity });
      set({ cart: data.cart });
    } catch (err) {
      console.error('addItem error:', err);
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestCart();
      let items = [...(current.items || [])];
      if (quantity <= 0) {
        items = items.filter((i) => i.id !== itemId && i.productId !== itemId);
      } else {
        const item = items.find((i) => i.id === itemId || i.productId === itemId);
        if (item) item.quantity = quantity;
      }
      const updated = { ...current, items };
      setGuestCart(updated);
      set({ cart: updated });
      return;
    }

    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
    set({ cart: data.cart });
  },

  removeItem: async (itemId) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestCart();
      const items = (current.items || []).filter((i) => i.id !== itemId && i.productId !== itemId);
      const updated = { ...current, items };
      setGuestCart(updated);
      set({ cart: updated });
      return;
    }

    const { data } = await api.delete(`/cart/items/${itemId}`);
    set({ cart: data.cart });
  },

  clearCart: async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      localStorage.removeItem('delux_guest_cart');
      set({ cart: { items: [] } });
      return;
    }

    const { data } = await api.delete('/cart');
    set({ cart: data.cart });
  },

  reset: () => set({ cart: getGuestCart() }),
}));
