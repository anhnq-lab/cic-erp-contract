import { useQuery } from '@tanstack/react-query';
import { UnitService } from '../services';
import { queryKeys } from '../lib/queryClient';
import { QUERY_TIMES } from '../lib/queryDefaults';

// Get all units — static tier (staleTime: Infinity, units rarely change)
export function useUnits() {
    return useQuery({
        queryKey: queryKeys.units.all,
        queryFn: () => UnitService.getAll(),
        ...QUERY_TIMES.units, // staleTime: Infinity
    });
}

// Get units with stats (signing, revenue, profit) — standard tier (2 min stale)
export function useUnitsWithStats(year?: number) {
    return useQuery({
        queryKey: [...queryKeys.units.all, 'withStats', year || new Date().getFullYear()],
        queryFn: () => UnitService.getWithStats(year),
        ...QUERY_TIMES.contracts, // Stats change as contracts are signed
    });
}
