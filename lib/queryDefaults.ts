/**
 * lib/queryDefaults.ts
 *
 * Centralized TanStack Query staleTime / gcTime settings.
 *
 * Rationale for each tier:
 * - STATIC   (Infinity / 30 min gc): reference data that almost never changes (units, org chart)
 * - MASTER   (10 min / 30 min gc): employees, products — changes a few times per day at most
 * - STANDARD (2 min / 10 min gc): customers, contracts list — frequently edited
 * - LIVE     (30 s / 5 min gc): active transactions (payments, tasks, notifications)
 * - REALTIME (0 / 1 min gc): push-fed data — always considered stale so refetch is minimal
 *
 * Usage:
 * ```ts
 * import { QUERY_TIMES } from '@/lib/queryDefaults';
 *
 * useQuery({
 *   queryKey: ['contracts'],
 *   queryFn: ContractService.list,
 *   ...QUERY_TIMES.contracts,
 * });
 * ```
 */

export interface QueryTimes {
  staleTime: number;
  gcTime: number;
}

// ── Tiers ────────────────────────────────────────────────────────────────────

/** Data that almost never changes — safe to cache until tab close */
const STATIC: QueryTimes = {
  staleTime: Infinity,
  gcTime: 30 * 60_000, // 30 min
};

/** Master / reference data — changes a few times per day */
const MASTER: QueryTimes = {
  staleTime: 10 * 60_000, // 10 min
  gcTime: 30 * 60_000,
};

/** Standard transactional data — may change any time a user saves */
const STANDARD: QueryTimes = {
  staleTime: 2 * 60_000, // 2 min
  gcTime: 10 * 60_000,
};

/** Fast-moving data — short staleness, smaller cache window */
const LIVE: QueryTimes = {
  staleTime: 30_000, // 30 s
  gcTime: 5 * 60_000,
};

/** Realtime-fed data — always refetch, keep a short gc window */
const REALTIME: QueryTimes = {
  staleTime: 0,
  gcTime: 60_000,
};

// ── Per-domain defaults ───────────────────────────────────────────────────────

export const QUERY_TIMES = {
  // Static reference
  units: STATIC,
  permissions: STATIC,
  roles: STATIC,

  // Master data
  employees: MASTER,
  products: MASTER,
  brands: MASTER,
  executionCostTypes: MASTER,

  // Standard transactional
  customers: STANDARD,
  contracts: STANDARD,
  projects: STANDARD,
  contractDetails: STANDARD,

  // Live transactional
  payments: LIVE,
  tasks: LIVE,
  auditLogs: LIVE,
  documents: LIVE,

  // Realtime / push-fed
  notifications: REALTIME,
  chat: REALTIME,
  presence: REALTIME,
} as const satisfies Record<string, QueryTimes>;

export type QueryDomain = keyof typeof QUERY_TIMES;
