// Contract Form Sub-components
export { default as StepIndicator } from './StepIndicator';
export { default as FinancialSummary } from './FinancialSummary';
export { default as FormHeader } from './FormHeader';
export { PAKDImportButton } from './PAKDImportButton';

// Hooks
export {
    useContractCalculations,
    formatVND,
    calculateLineMargin,
    generateContractId,
    getClientInitials,
} from './useContractCalculations';

// Types
export type { ContractTotals, UseContractCalculationsProps } from './useContractCalculations';

export interface FinancialTotals {
    signingValue: number;
    estimatedRevenue: number;
    totalCosts: number;
    grossProfit: number;
    profitMargin: number;
}
