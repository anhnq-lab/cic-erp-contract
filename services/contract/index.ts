/**
 * Contract Service — Modular Exports
 *
 * Barrel re-exports for direct, tree-shakable imports AND the assembled
 * ContractService object for backward compatibility with existing callers.
 *
 * Usage (tree-shakable):
 *   import { calculateRevenueFromPayments } from '@/services/contract';
 *   import { mapContract } from '@/services/contract/contractMapper';
 *   import { linkContracts } from '@/services/contract/contractRelations';
 *
 * Usage (legacy object):
 *   import { ContractService } from '@/services/contractService';
 */

// ─── Financial calculators (pure functions) ───────────────────────────────────
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
} from './contractFinancials';

// ─── DB → Frontend mapper ─────────────────────────────────────────────────────
export { mapContract } from './contractMapper';

// ─── Contract relations (link/unlink with approval) ──────────────────────────
export {
    getRelatedContracts,
    getOutgoingPendingLinks,
    getIncomingPendingLinks,
    linkContracts,
    approveLink,
    rejectLink,
    unlinkContracts,
} from './contractRelations';

// ─── CRUD utilities (retry, validation, payload builder, audit log) ───────────
export {
    ERROR_MESSAGES,
    withRetry,
    validateContract,
    buildPayload,
    logOperation,
} from './contractUtils';

// ─── Named exports for tree-shaking ──────────────────────────────────────────
export * from './queries';
export * from './aggregates';
// Note: mutations are accessed via ContractService object (backward compat)
// Direct imports: import { create, update } from '@/services/contract/mutations';

// ─── Assembled ContractService object — backward compatibility ────────────────
import * as Queries from './queries';
import * as Aggregates from './aggregates';
import * as Mutations from './mutations';
import * as Relations from './contractRelations';

// Rename deleteContract → delete (reserved word can't be a named export)
const { deleteContract, ...otherMutations } = Mutations;

export const ContractService = {
    // Read-only queries
    ...Queries,
    // Aggregate / stats
    ...Aggregates,
    // Mutations (create, update, batchDelete, duplicate)
    ...otherMutations,
    // Map deleteContract back to the expected 'delete' key
    delete: deleteContract,
    // Relations (bidirectional linking)
    getRelatedContracts: Relations.getRelatedContracts,
    getOutgoingPendingLinks: Relations.getOutgoingPendingLinks,
    getIncomingPendingLinks: Relations.getIncomingPendingLinks,
    linkContracts: Relations.linkContracts,
    approveLink: Relations.approveLink,
    rejectLink: Relations.rejectLink,
    unlinkContracts: Relations.unlinkContracts,
};
