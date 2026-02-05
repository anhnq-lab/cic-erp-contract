import { describe, it, expect } from 'vitest';
import { formatVND, formatNumber, parseFormattedNumber, cn } from '../../lib/utils';

describe('Utility Functions', () => {
    describe('cn (className merger)', () => {
        it('merges classes correctly', () => {
            const result = cn('text-red-500', 'text-blue-500');
            expect(result).toBe('text-blue-500');
        });

        it('handles conditional classes', () => {
            const isActive = true;
            const result = cn('base', isActive && 'active');
            expect(result).toContain('base');
            expect(result).toContain('active');
        });
    });

    describe('formatNumber', () => {
        it('formats number with Vietnamese locale', () => {
            const result = formatNumber(1000000);
            expect(result).toContain('1');
            // Vietnamese uses dots as thousand separators
        });

        it('handles null/undefined', () => {
            expect(formatNumber(null)).toBe('0');
            expect(formatNumber(undefined)).toBe('0');
        });

        it('handles string numbers', () => {
            const result = formatNumber('250000');
            expect(result).toContain('250');
        });

        it('handles invalid strings', () => {
            const result = formatNumber('invalid');
            expect(result).toBe('0');
        });
    });

    describe('formatVND', () => {
        it('formats number without currency symbol by default', () => {
            const result = formatVND(1000000);
            expect(result).toBeDefined();
            expect(result).not.toContain('đ');
        });

        it('formats number with currency symbol when showCurrency is true', () => {
            const result = formatVND(1000000, true);
            expect(result).toContain('đ');
        });

        it('handles zero', () => {
            const result = formatVND(0);
            expect(result).toBe('0');
        });
    });

    describe('parseFormattedNumber', () => {
        it('parses formatted Vietnamese number string', () => {
            const result = parseFormattedNumber('1.000.000');
            expect(result).toBe(1000000);
        });

        it('handles empty string', () => {
            const result = parseFormattedNumber('');
            expect(result).toBe(0);
        });

        it('handles string with currency suffix', () => {
            const result = parseFormattedNumber('500.000 đ');
            expect(result).toBe(500000);
        });

        it('handles negative numbers', () => {
            const result = parseFormattedNumber('-100.000');
            expect(result).toBe(-100000);
        });
    });
});
