/**
 * contractService.ts — Thin re-export for backward compatibility.
 *
 * Full implementation has been split into services/contract/ sub-modules:
 *   queries.ts      — read operations
 *   aggregates.ts   — stats & chart data
 *   mutations.ts    — create / update / delete / duplicate
 *   contractMapper.ts, contractUtils.ts, contractFinancials.ts, contractRelations.ts
 *
 * Consumers that `import { ContractService } from '@/services/contractService'`
 * continue to work without any changes.
 */

// Main service object
export { ContractService } from './contract';

// Financial helper re-exports (kept for callers that import these directly)
export {
    isAll,
    getUnitSharePct,
    calculateRevenueFromPayments,
    calculateInvoicedFromPayments,
    calculateCashReceived,
    calculateAdvanceAmount,
    calculateReceivables,
    calculatePayables,
    getEmployeeSharePct,
} from './contract/contractFinancials';
