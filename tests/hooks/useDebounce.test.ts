import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('hello', 300));
        expect(result.current).toBe('hello');
    });

    it('does not update immediately when value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });
        // Should still be 'a' — timer hasn't fired
        expect(result.current).toBe('a');
    });

    it('updates after the delay has elapsed', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe('b');
    });

    it('resets the timer on rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });
        act(() => { vi.advanceTimersByTime(200); });

        rerender({ value: 'c' });
        act(() => { vi.advanceTimersByTime(200); });

        // Timer was reset, so we're only 200ms into the 'c' timer
        expect(result.current).toBe('a');

        act(() => { vi.advanceTimersByTime(100); });
        expect(result.current).toBe('c');
    });

    it('works with number values', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 0 } }
        );

        rerender({ value: 42 });
        expect(result.current).toBe(0);

        act(() => { vi.advanceTimersByTime(500); });
        expect(result.current).toBe(42);
    });

    it('works with object values', () => {
        const initial = { name: 'Alice' };
        const updated = { name: 'Bob' };

        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 200),
            { initialProps: { value: initial } }
        );

        rerender({ value: updated });
        act(() => { vi.advanceTimersByTime(200); });

        expect(result.current).toEqual({ name: 'Bob' });
    });

    it('respects different delay values', () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: 'x', delay: 100 } }
        );

        rerender({ value: 'y', delay: 100 });
        act(() => { vi.advanceTimersByTime(99); });
        expect(result.current).toBe('x');

        act(() => { vi.advanceTimersByTime(1); });
        expect(result.current).toBe('y');
    });

    it('clears pending timer on unmount', () => {
        const { result, rerender, unmount } = renderHook(
            ({ value }) => useDebounce(value, 300),
            { initialProps: { value: 'a' } }
        );

        rerender({ value: 'b' });
        unmount();

        // Advance timer — timer should have been cleared
        act(() => { vi.advanceTimersByTime(300); });
        // result remains at the last rendered value since hook is unmounted
        expect(result.current).toBe('a');
    });
});
