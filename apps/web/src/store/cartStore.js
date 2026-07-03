import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,

  get itemCount() {
    return get().cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  },

  fetchCart: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.cart });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    set({ cart: data.cart });
  },

  updateQuantity: async (itemId, quantity) => {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
    set({ cart: data.cart });
  },

  removeItem: async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    set({ cart: data.cart });
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart');
    set({ cart: data.cart });
  },

  reset: () => set({ cart: null }),
}));
