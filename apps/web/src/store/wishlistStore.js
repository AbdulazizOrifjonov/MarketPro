import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useWishlistStore = create((set, get) => ({
  wishlist: null,
  isLoading: false,

  isWishlisted: (productId) => {
    return Boolean(get().wishlist?.items?.some((i) => i.productId === productId));
  },

  fetchWishlist: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    set({ isLoading: true });
    try {
      const { data } = await api.get('/wishlist');
      set({ wishlist: data.wishlist });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId) => {
    const { data } = await api.post('/wishlist/items', { productId });
    set({ wishlist: data.wishlist });
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/wishlist/items/${productId}`);
    set({ wishlist: data.wishlist });
  },

  moveToCart: async (productId) => {
    await api.post(`/wishlist/items/${productId}/move-to-cart`);
    await get().fetchWishlist();
  },

  reset: () => set({ wishlist: null }),
}));
