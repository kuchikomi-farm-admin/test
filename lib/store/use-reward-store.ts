import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Reward } from '../types'
import { initialRewards } from '../mock-data'

interface RewardState {
    rewards: Reward[]
    addReward: (reward: Reward) => void
    updateReward: (id: string, reward: Partial<Reward>) => void
    deleteReward: (id: string) => void
}

export const useRewardStore = create<RewardState>()(
    persist(
        (set) => ({
            rewards: initialRewards,
            addReward: (reward) => set((state) => ({ rewards: [...state.rewards, reward] })),
            updateReward: (id, reward) => set((state) => ({
                rewards: state.rewards.map((r) => r.id === id ? { ...r, ...reward } : r)
            })),
            deleteReward: (id) => set((state) => ({
                rewards: state.rewards.filter((r) => r.id !== id)
            })),
        }),
        {
            name: 'tjm-reward-storage',
        }
    )
)
