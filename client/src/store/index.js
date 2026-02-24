import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Dark mode
      darkMode: false,
      toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),

      // Current repository
      currentRepo: null,
      setCurrentRepo: (repo) => set({ currentRepo: repo }),

      // Repositories list
      repos: [],
      setRepos: (repos) => set({ repos }),

      // Status
      status: null,
      setStatus: (status) => set({ status }),

      // Branches
      branches: null,
      setBranches: (branches) => set({ branches }),

      // Commit history
      commits: [],
      setCommits: (commits) => set({ commits }),

      // Selected commit
      selectedCommit: null,
      setSelectedCommit: (commit) => set({ selectedCommit: commit }),

      // Loading states
      loading: {
        repos: false,
        status: false,
        branches: false,
        commits: false,
        operation: false
      },
      setLoading: (key, value) => set(state => ({
        loading: { ...state.loading, [key]: value }
      })),

      // Error state
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Refresh callback
      refreshCallback: null,
      setRefreshCallback: (callback) => set({ refreshCallback: callback }),

      // Trigger refresh
      refresh: async () => {
        const { refreshCallback } = get();
        if (refreshCallback) {
          await refreshCallback();
        }
      }
    }),
    {
      name: 'mygit-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        currentRepo: state.currentRepo
      })
    }
  )
);

export default useAppStore;
