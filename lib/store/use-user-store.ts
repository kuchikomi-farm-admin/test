import { create } from 'zustand'

export interface UserProfile {
  id: string
  name: string
  email: string
  memberId: string
  rank: string
  role: "member" | "admin"
  status: "pending" | "active" | "suspended"
  avatarUrl: string | null
  phone: string | null
  bio: string | null
  location: string | null
  company: string | null
  position: string | null
}

interface UserState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    setUser: (user) => set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
    setLoading: (isLoading) => set({ isLoading }),
    updateProfile: (updates) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    logout: () => set({ user: null, isAuthenticated: false }),
  })
)
