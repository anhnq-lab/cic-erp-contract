/**
 * Task Service — Shared Constants & Mapper
 *
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import type {
    Task,
    TaskStatus,
    ApprovalMode,
    ApprovalStatus,
} from '../../types/taskTypes';
import type { DbTask } from '../../lib/db';

export const TASK_SELECT = `
  *,
  status:task_statuses(*)
`;

/**
 * Map raw DB row to Task type.
 */
export function mapTask(row: DbTask & { status?: TaskStatus }): Task {
    return {
        ...row,
        space_id: row.space_id ?? undefined,
        status: row.status || undefined,
        assignees: row.assignees || [],
        watchers: row.watchers || [],
        supporters: row.supporters || [],
        approvers: row.approvers || [],
        tags: row.tags || [],
        custom_fields: (row.custom_fields as Record<string, unknown>) || {},
        auto_generated: row.auto_generated || false,
        is_private: row.is_private || false,
        is_pinned: row.is_pinned || false,
        time_spent: row.time_spent || 0,
        sort_order: row.sort_order || 0,
        approval_status: (row.approval_status as ApprovalStatus) || undefined,
        approval_parent_id: row.approval_parent_id || undefined,
        approval_mode: (row.approval_mode as ApprovalMode) || 'all',
        approval_comment: row.approval_comment || undefined,
    } as Task;
}
