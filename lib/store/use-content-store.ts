import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Content } from '../types'
import { initialContents } from '../mock-data'

interface ContentState {
    contents: Content[]
    addContent: (content: Content) => void
    updateContent: (id: string, updates: Partial<Content>) => void
    deleteContent: (id: string) => void
    incrementViews: (id: string) => void
}

export const useContentStore = create<ContentState>()(
    persist(
        (set) => ({
            contents: initialContents,
            addContent: (content) =>
                set((state) => ({
                    contents: [content, ...state.contents],
                })),
            updateContent: (id, updates) =>
                set((state) => ({
                    contents: state.contents.map((c) =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                })),
            deleteContent: (id) =>
                set((state) => ({
                    contents: state.contents.filter((c) => c.id !== id),
                })),
            incrementViews: (id) =>
                set((state) => ({
                    contents: state.contents.map((c) =>
                        c.id === id ? { ...c, views: c.views + 1 } : c
                    ),
                })),
        }),
        {
            name: 'junkan-content-storage',
        }
    )
)
