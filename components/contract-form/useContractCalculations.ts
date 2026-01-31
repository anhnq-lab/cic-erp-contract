import { useMemo } from 'react';
import { LineItem, AdministrativeCosts } from '../../types';

export interface ContractTotals {
    signingValue: number;
    estimatedRevenue: number;
    totalCosts: number;
    grossProfit: number;
    profitMargin: number;
    totalInput: number;
    totalDirectCosts: number;
    adminSum: number;
}

export interface UseContractCalculationsProps {
    lineItems: LineItem[];
    adminCosts: AdministrativeCosts;
    vatRate?: number; // Default 10%
}

/**
 * Hook to calculate contract financial totals
 * Extracted from ContractForm for reusability
 */
export function useContractCalculations({
    lineItems,
    adminCosts,
    vatRate = 0.1,
}: UseContractCalculationsProps): ContractTotals {
    return useMemo(() => {
        // Sum of all output prices (signing value)
        const signingValue = lineItems.reduce(
            (acc, item) => acc + (item.quantity * item.outputPrice),
            0
        );

        // Sum of all input prices
        const totalInput = lineItems.reduce(
            (acc, item) => acc + (item.quantity * item.inputPrice),
            0
        );

        // Sum of all direct costs
        const totalDirectCosts = lineItems.reduce(
            (acc, item) => acc + item.directCosts,
            0
        );

        // Sum of administrative costs
        const adminSum = (Object.values(adminCosts) as number[]).reduce(
            (acc: number, val: number) => acc + val,
            0
        );

        // Revenue after VAT deduction
        const estimatedRevenue = signingValue / (1 + vatRate);

        // Total costs
        const totalCosts = totalInput + totalDirectCosts + adminSum;

        // Gross profit and margin
        const grossProfit = signingValue - totalCosts;
        const profitMargin = signingValue > 0 ? (grossProfit / signingValue) * 100 : 0;

        return {
            signingValue,
            estimatedRevenue,
            totalCosts,
            grossProfit,
            profitMargin,
            totalInput,
            totalDirectCosts,
            adminSum,
        };
    }, [lineItems, adminCosts, vatRate]);
}

/**
 * Utility to format numbers as VND currency
 */
export function formatVND(val: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val));
}

/**
 * Calculate line item margin
 */
export function calculateLineMargin(item: LineItem): { margin: number; marginRate: number } {
    const inputTotal = item.quantity * item.inputPrice;
    const outputTotal = item.quantity * item.outputPrice;
    const margin = outputTotal - inputTotal - item.directCosts;
    const marginRate = outputTotal > 0 ? (margin / outputTotal) * 100 : 0;

    return { margin, marginRate };
}

/**
 * Generate contract ID from components
 */
export function generateContractId(
    unitCode: string,
    sequenceNumber: number,
    clientInitials: string,
    year: number
): string {
    const stt = sequenceNumber.toString().padStart(3, '0');
    return `HĐ_${stt}/${unitCode}_${clientInitials}_${year}`;
}

/**
 * Extract client initials from name
 */
export function getClientInitials(clientName: string, maxLength = 5): string {
    if (!clientName) return 'KH';
    return clientName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, maxLength);
}

export default useContractCalculations;
