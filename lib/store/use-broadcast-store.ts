import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Broadcast } from '../types'
import { initialBroadcasts } from '../mock-data'

interface BroadcastState {
    broadcasts: Broadcast[]
    sendBroadcast: (broadcast: Broadcast) => void
}

export const useBroadcastStore = create<BroadcastState>()(
    persist(
        (set) => ({
            broadcasts: initialBroadcasts,
            sendBroadcast: (broadcast) => set((state) => ({
                broadcasts: [broadcast, ...state.broadcasts]
            })),
        }),
        {
            name: 'junkan-broadcast-storage',
        }
    )
)
