import { create } from 'zustand';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
    data: any;
    fetchedAt: number;
}

interface CacheState {
    cache: Record<string, CacheEntry>;
    getCache: (key: string) => any | null;
    setCache: (key: string, data: any) => void;
    invalidate: (key: string) => void;
    invalidateMatching: (prefix: string) => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
    cache: {},

    getCache: (key: string) => {
        const entry = get().cache[key];
        if (!entry) return null;
        const isStale = Date.now() - entry.fetchedAt > CACHE_TTL_MS;
        if (isStale) return null;
        return entry.data;
    },

    setCache: (key: string, data: any) => {
        set((state) => ({
            cache: {
                ...state.cache,
                [key]: { data, fetchedAt: Date.now() },
            },
        }));
    },

    invalidate: (key: string) => {
        set((state) => {
            const { [key]: _, ...rest } = state.cache;
            return { cache: rest };
        });
    },

    invalidateMatching: (prefix: string) => {
        set((state) => {
            const newCache = { ...state.cache };
            let changed = false;
            Object.keys(newCache).forEach((key) => {
                if (key.startsWith(prefix)) {
                    delete newCache[key];
                    changed = true;
                }
            });
            return changed ? { cache: newCache } : state;
        });
    },
}));
