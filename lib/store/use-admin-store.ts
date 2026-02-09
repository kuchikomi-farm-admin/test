import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserStats, GrowthData, WeeklyRegistrationData } from '../types'
import { initialUserStats, initialGrowthData, initialWeeklyData } from '../mock-data'

interface AdminState {
    stats: UserStats
    growthData: GrowthData[]
    weeklyData: WeeklyRegistrationData[]
    updateStats: (updates: Partial<UserStats>) => void
    addWeeklyData: (data: WeeklyRegistrationData) => void
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            stats: initialUserStats,
            growthData: initialGrowthData,
            weeklyData: initialWeeklyData,
            updateStats: (updates) =>
                set((state) => ({
                    stats: { ...state.stats, ...updates },
                })),
            addWeeklyData: (data) =>
                set((state) => ({
                    weeklyData: [...state.weeklyData, data],
                })),
        }),
        {
            name: 'junkan-admin-storage',
        }
    )
)
