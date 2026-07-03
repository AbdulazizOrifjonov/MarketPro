import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      theme: 'light',
      isSidebarOpen: false,
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', next === 'dark');
          return { theme: next };
        }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
    }),
    { name: 'marketpro-ui' }
  )
);
