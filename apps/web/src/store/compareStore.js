import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_COMPARE = 4;

export const useCompareStore = create(
  persist(
    (set, get) => ({
      productIds: [],

      isComparing: (productId) => get().productIds.includes(productId),

      toggleCompare: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          set({ productIds: productIds.filter((id) => id !== productId) });
        } else {
          if (productIds.length >= MAX_COMPARE) return false;
          set({ productIds: [...productIds, productId] });
        }
        return true;
      },

      remove: (productId) => set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) })),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'marketpro-compare' }
  )
);

export { MAX_COMPARE };
