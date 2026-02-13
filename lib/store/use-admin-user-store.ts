import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AdminUser } from '../types'
import { initialAdminUsers } from '../mock-data'

interface AdminUserState {
    users: AdminUser[]
    updateUserStatus: (id: string, status: "active" | "pending") => void
}

export const useAdminUserStore = create<AdminUserState>()(
    persist(
        (set) => ({
            users: initialAdminUsers,
            updateUserStatus: (id, status) => set((state) => ({
                users: state.users.map((u) => u.id === id ? { ...u, status } : u)
            })),
        }),
        {
            name: 'tjm-admin-user-storage',
        }
    )
)
