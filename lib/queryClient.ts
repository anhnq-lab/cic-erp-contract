import { QueryClient, keepPreviousData } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Default to LIVE tier (30 s stale / 5 min gc).
            // Per-query overrides should use QUERY_TIMES from lib/queryDefaults.ts.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});

// Re-export keepPreviousData for convenience in list-page hooks
// Usage: useQuery({ ..., placeholderData: keepPreviousData })
export { keepPreviousData };

// Query keys for consistent caching
export const queryKeys = {
    employees: {
        all: ['employees'] as const,
        byUnit: (unitId: string) => ['employees', 'unit', unitId] as const,
        detail: (id: string) => ['employees', 'detail', id] as const,
    },
    units: {
        all: ['units'] as const,
    },
};
