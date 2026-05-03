import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnResize } from '../../hooks/useColumnResize';

const COLUMNS = [
    { key: 'name', defaultWidth: 200, minWidth: 80 },
    { key: 'status', defaultWidth: 120, minWidth: 60 },
    { key: 'value', defaultWidth: 150 },
];

const TABLE_ID = 'test-table';
const USER_ID = 'user-123';
const STORAGE_KEY = `col-widths-${USER_ID}-${TABLE_ID}`;
const ANON_KEY = `col-widths-anon-${TABLE_ID}`;

describe('useColumnResize', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('initial widths', () => {
        it('uses default widths when no localStorage entry exists', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            expect(result.current.columnWidths).toEqual({
                name: 200,
                status: 120,
                value: 150,
            });
        });

        it('loads widths from localStorage when valid entry exists', () => {
            const saved = { name: 250, status: 100, value: 180 };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            expect(result.current.columnWidths).toEqual(saved);
        });

        it('falls back to defaults when localStorage entry is invalid JSON', () => {
            localStorage.setItem(STORAGE_KEY, 'not-json{');

            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            expect(result.current.columnWidths).toEqual({ name: 200, status: 120, value: 150 });
        });

        it('falls back to defaults when localStorage entry is missing a column', () => {
            // Only has 'name' and 'status' — missing 'value'
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 250, status: 100 }));

            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            expect(result.current.columnWidths).toEqual({ name: 200, status: 120, value: 150 });
        });

        it('uses anon key when userId is not provided', () => {
            const saved = { name: 300, status: 90, value: 160 };
            localStorage.setItem(ANON_KEY, JSON.stringify(saved));

            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, columns: COLUMNS })
            );

            expect(result.current.columnWidths).toEqual(saved);
        });
    });

    describe('resetWidths', () => {
        it('resets all widths to defaults', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 999, status: 888, value: 777 }));

            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            act(() => {
                result.current.resetWidths();
            });

            expect(result.current.columnWidths).toEqual({ name: 200, status: 120, value: 150 });
        });

        it('saves default widths to localStorage on reset', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            act(() => {
                result.current.resetWidths();
            });

            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            expect(stored).toEqual({ name: 200, status: 120, value: 150 });
        });
    });

    describe('isResizing state', () => {
        it('starts as false', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            expect(result.current.isResizing).toBe(false);
        });
    });

    describe('onResizeStart', () => {
        it('does nothing when column key is not found', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
            } as unknown as React.MouseEvent;

            act(() => {
                result.current.onResizeStart('nonexistent', fakeEvent);
            });

            expect(result.current.isResizing).toBe(false);
        });

        it('sets isResizing to true when drag starts', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
            } as unknown as React.MouseEvent;

            act(() => {
                result.current.onResizeStart('name', fakeEvent);
            });

            expect(result.current.isResizing).toBe(true);
        });

        it('updates width on mousemove and respects minWidth', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
            } as unknown as React.MouseEvent;

            act(() => {
                result.current.onResizeStart('name', fakeEvent);
            });

            // Find the mousemove handler
            const moveHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'mousemove'
            )?.[1] as EventListener;

            if (moveHandler) {
                act(() => {
                    moveHandler(new MouseEvent('mousemove', { clientX: 350 }));
                });
                // delta = 350 - 100 = 250, newWidth = 200 + 250 = 450
                expect(result.current.columnWidths.name).toBe(450);
            }

            addEventListenerSpy.mockRestore();
        });

        it('enforces minWidth during resize', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 200,
            } as unknown as React.MouseEvent;

            act(() => {
                result.current.onResizeStart('name', fakeEvent);
            });

            const moveHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'mousemove'
            )?.[1] as EventListener;

            if (moveHandler) {
                act(() => {
                    // Try to resize to less than minWidth (80px)
                    // delta = 10 - 200 = -190, newWidth = 200 - 190 = 10 → clamped to 80
                    moveHandler(new MouseEvent('mousemove', { clientX: 10 }));
                });
                expect(result.current.columnWidths.name).toBe(80);
            }

            addEventListenerSpy.mockRestore();
        });

        it('uses default minWidth of 40 when not specified', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 300,
            } as unknown as React.MouseEvent;

            act(() => {
                // 'value' column has no minWidth, defaults to 40
                result.current.onResizeStart('value', fakeEvent);
            });

            const moveHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'mousemove'
            )?.[1] as EventListener;

            if (moveHandler) {
                act(() => {
                    // delta = 0 - 300 = -300, newWidth = 150 - 300 = -150 → clamped to 40
                    moveHandler(new MouseEvent('mousemove', { clientX: 0 }));
                });
                expect(result.current.columnWidths.value).toBe(40);
            }

            addEventListenerSpy.mockRestore();
        });

        it('sets isResizing to false on mouseup', () => {
            const { result } = renderHook(() =>
                useColumnResize({ tableId: TABLE_ID, userId: USER_ID, columns: COLUMNS })
            );

            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

            const fakeEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                clientX: 100,
            } as unknown as React.MouseEvent;

            act(() => {
                result.current.onResizeStart('name', fakeEvent);
            });

            const upHandler = addEventListenerSpy.mock.calls.find(
                call => call[0] === 'mouseup'
            )?.[1] as EventListener;

            if (upHandler) {
                act(() => {
                    upHandler(new MouseEvent('mouseup'));
                });
                expect(result.current.isResizing).toBe(false);
            }

            addEventListenerSpy.mockRestore();
        });
    });

    describe('userId change', () => {
        it('reloads widths when userId changes (different storage key)', () => {
            const user1Key = `col-widths-user-1-${TABLE_ID}`;
            const user2Key = `col-widths-user-2-${TABLE_ID}`;

            localStorage.setItem(user1Key, JSON.stringify({ name: 300, status: 90, value: 160 }));
            localStorage.setItem(user2Key, JSON.stringify({ name: 400, status: 110, value: 170 }));

            const { result, rerender } = renderHook(
                ({ userId }) => useColumnResize({ tableId: TABLE_ID, userId, columns: COLUMNS }),
                { initialProps: { userId: 'user-1' } }
            );

            expect(result.current.columnWidths.name).toBe(300);

            rerender({ userId: 'user-2' });

            expect(result.current.columnWidths.name).toBe(400);
        });
    });
});
