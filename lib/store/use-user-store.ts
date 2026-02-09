import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  name: string
  email: string
  memberId: string
  rank: string
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Set default mock user data
      user: {
        name: "田中 太郎",
        email: "tanaka@example.com",
        memberId: "JK-00247",
        rank: "ゴールド",
      },
      isAuthenticated: true,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'junkan-user-storage',
    }
  )
)
