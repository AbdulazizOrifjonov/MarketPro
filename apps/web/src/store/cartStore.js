import { create } from 'zustand';
import { toast } from 'sonner';
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
      toast.success('🛒 Mahsulot savatga qo\'shildi!');
      return;
    }

    try {
      const { data } = await api.post('/cart/items', { productId, quantity });
      set({ cart: data.cart });
      toast.success('🛒 Mahsulot savatga qo\'shildi!');
    } catch (err) {
      console.error('addItem error:', err);
      toast.error(err.friendlyMessage || 'Savatga qo\'shishda xatolik');
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
        toast.info('🗑️ Mahsulot savatdan olib tashlandi');
      } else {
        const item = items.find((i) => i.id === itemId || i.productId === itemId);
        if (item) item.quantity = quantity;
      }
      const updated = { ...current, items };
      setGuestCart(updated);
      set({ cart: updated });
      return;
    }

    try {
      const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
      set({ cart: data.cart });
      if (quantity <= 0) {
        toast.info('🗑️ Mahsulot savatdan olib tashlandi');
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  removeItem: async (itemId) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestCart();
      const items = (current.items || []).filter((i) => i.id !== itemId && i.productId !== itemId);
      const updated = { ...current, items };
      setGuestCart(updated);
      set({ cart: updated });
      toast.info('🗑️ Mahsulot savatdan olib tashlandi');
      return;
    }

    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      set({ cart: data.cart });
      toast.info('🗑️ Mahsulot savatdan olib tashlandi');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  clearCart: async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      localStorage.removeItem('delux_guest_cart');
      set({ cart: { items: [] } });
      toast.info('🗑️ Savat tozalandi');
      return;
    }

    try {
      const { data } = await api.delete('/cart');
      set({ cart: data.cart });
      toast.info('🗑️ Savat tozalandi');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  reset: () => set({ cart: getGuestCart() }),
}));
