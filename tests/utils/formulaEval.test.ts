import { describe, it, expect } from 'vitest';
import { safeEval, isFormula } from '../../utils/formulaEval';

describe('safeEval', () => {
    describe('basic arithmetic', () => {
        it('evaluates addition', () => {
            expect(safeEval('1+2')).toBe(3);
        });

        it('evaluates subtraction', () => {
            expect(safeEval('10-3')).toBe(7);
        });

        it('evaluates multiplication', () => {
            expect(safeEval('4*5')).toBe(20);
        });

        it('evaluates division', () => {
            expect(safeEval('10/4')).toBe(2.5);
        });

        it('respects operator precedence', () => {
            expect(safeEval('2+3*4')).toBe(14);
        });

        it('evaluates parenthesized expressions', () => {
            expect(safeEval('(2+3)*4')).toBe(20);
        });

        it('handles decimal numbers', () => {
            expect(safeEval('1.5+2.5')).toBe(4);
        });
    });

    describe('percentage handling', () => {
        it('converts simple percentage: 70% → 0.7', () => {
            expect(safeEval('70%')).toBeCloseTo(0.7, 5);
        });

        it('evaluates 1000*70% = 700', () => {
            expect(safeEval('1000*70%')).toBeCloseTo(700, 5);
        });

        it('evaluates decimal percentage: 12.5%', () => {
            expect(safeEval('12.5%')).toBeCloseTo(0.125, 5);
        });

        it('evaluates 200*50% = 100', () => {
            expect(safeEval('200*50%')).toBeCloseTo(100, 5);
        });
    });

    describe('whitespace handling', () => {
        it('ignores spaces', () => {
            expect(safeEval('1 + 2')).toBe(3);
        });

        it('ignores tabs', () => {
            expect(safeEval('3\t*\t4')).toBe(12);
        });
    });

    describe('comma as decimal separator', () => {
        it('treats comma as dot: 1,5 = 1.5', () => {
            expect(safeEval('1,5+1')).toBeCloseTo(2.5, 5);
        });
    });

    describe('invalid inputs', () => {
        it('returns NaN for empty string', () => {
            expect(safeEval('')).toBeNaN();
        });

        it('returns NaN for letters', () => {
            expect(safeEval('abc')).toBeNaN();
        });

        it('returns NaN for dangerous code (alert)', () => {
            expect(safeEval('alert(1)')).toBeNaN();
        });

        it('returns NaN for semicolons', () => {
            expect(safeEval('1;2')).toBeNaN();
        });

        it('returns NaN for division by zero (Infinity)', () => {
            expect(safeEval('1/0')).toBeNaN();
        });

        it('returns NaN for square brackets', () => {
            expect(safeEval('[1,2]')).toBeNaN();
        });

        it('returns NaN for syntax error', () => {
            expect(safeEval('*2')).toBeNaN();
        });
    });

    describe('complex expressions', () => {
        it('handles nested parentheses', () => {
            expect(safeEval('((2+3)*2)')).toBe(10);
        });

        it('evaluates large numbers', () => {
            expect(safeEval('1000000*1000000')).toBe(1e12);
        });

        it('handles negative results', () => {
            expect(safeEval('5-10')).toBe(-5);
        });
    });
});

describe('isFormula', () => {
    it('returns true for addition expression', () => {
        expect(isFormula('1+2')).toBe(true);
    });

    it('returns true for multiplication expression', () => {
        expect(isFormula('3*4')).toBe(true);
    });

    it('returns true for expression with parentheses', () => {
        expect(isFormula('(2+3)*4')).toBe(true);
    });

    it('returns true for expression with percentage', () => {
        expect(isFormula('70%')).toBe(true);
    });

    it('returns false for plain number', () => {
        expect(isFormula('42')).toBe(false);
    });

    it('returns false for decimal number', () => {
        expect(isFormula('3.14')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isFormula('')).toBe(false);
    });

    it('returns true for subtraction', () => {
        expect(isFormula('10-3')).toBe(true);
    });

    it('returns true for division', () => {
        expect(isFormula('10/4')).toBe(true);
    });
});
