import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

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
