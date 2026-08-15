import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

function getGuestWishlist() {
  try {
    const raw = localStorage.getItem('delux_guest_wishlist');
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function setGuestWishlist(wishlist) {
  try {
    localStorage.setItem('delux_guest_wishlist', JSON.stringify(wishlist));
  } catch {}
}

export const useWishlistStore = create((set, get) => ({
  wishlist: getGuestWishlist(),
  isLoading: false,

  isWishlisted: (productId) => {
    return Boolean(get().wishlist?.items?.some((i) => i.productId === productId));
  },

  fetchWishlist: async () => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      set({ wishlist: getGuestWishlist() });
      return;
    }

    set({ isLoading: true });
    try {
      const guestWishlist = getGuestWishlist();
      if (guestWishlist?.items?.length > 0) {
        for (const item of guestWishlist.items) {
          try {
            await api.post('/wishlist/items', { productId: item.productId });
          } catch {}
        }
        localStorage.removeItem('delux_guest_wishlist');
      }

      const { data } = await api.get('/wishlist');
      set({ wishlist: data.wishlist });
    } catch (e) {
      console.error('fetchWishlist error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, productDetails = null) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestWishlist();
      const items = [...(current.items || [])];
      if (!items.some((i) => i.productId === productId)) {
        items.push({
          id: `guest_wl_${Date.now()}_${Math.random()}`,
          productId,
          product: productDetails || { id: productId },
        });
      }
      const updated = { ...current, items };
      setGuestWishlist(updated);
      set({ wishlist: updated });
      toast.success('❤️ Mahsulot sevimlilarga qo\'shildi!');
      return;
    }

    try {
      const { data } = await api.post('/wishlist/items', { productId });
      set({ wishlist: data.wishlist });
      toast.success('❤️ Mahsulot sevimlilarga qo\'shildi!');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  removeItem: async (productId) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      const current = getGuestWishlist();
      const items = (current.items || []).filter((i) => i.productId !== productId);
      const updated = { ...current, items };
      setGuestWishlist(updated);
      set({ wishlist: updated });
      toast.info('🤍 Mahsulot sevimlilardan olib tashlandi');
      return;
    }

    try {
      const { data } = await api.delete(`/wishlist/items/${productId}`);
      set({ wishlist: data.wishlist });
      toast.info('🤍 Mahsulot sevimlilardan olib tashlandi');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  moveToCart: async (productId) => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (!isAuth) {
      await get().removeItem(productId);
      await useCartStore.getState().addItem(productId, 1);
      toast.success('🛒 Mahsulot savatga o\'tkazildi!');
      return;
    }

    try {
      await api.post(`/wishlist/items/${productId}/move-to-cart`);
      await get().fetchWishlist();
      toast.success('🛒 Mahsulot savatga o\'tkazildi!');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Xatolik yuz berdi');
    }
  },

  reset: () => set({ wishlist: getGuestWishlist() }),
}));
