/**
 * Task Service — Modular Exports
 *
 * Barrel re-exports and the assembled TaskService object for backward
 * compatibility with existing callers.
 *
 * Usage (legacy object):
 *   import { TaskService } from '@/services/taskService';
 *
 * Usage (tree-shakable):
 *   import { getById, update } from '@/services/task/taskCrud';
 */

// ─── Named exports (tree-shakable) ────────────────────────────────────────────
export { TASK_SELECT, mapTask } from './taskTypes';
export { getStatuses, getDefaultStatusId } from './taskStatuses';
export * from './taskCrud';
export * from './taskQueries';
export * from './taskApprovals';
export * from './taskLinks';

// ─── Assembled TaskService object — backward compatibility ────────────────────
import * as Statuses from './taskStatuses';
import * as Crud from './taskCrud';
import * as Queries from './taskQueries';
import * as Approvals from './taskApprovals';
import * as Links from './taskLinks';

const { deleteTask, ...otherCrud } = Crud;

export const TaskService = {
    // Statuses
    ...Statuses,
    // CRUD (create, getById, update, bulkDelete, complete, togglePin, getAllTags, bulkUpdateStatus, bulkSetDeadline)
    ...otherCrud,
    // Map deleteTask back to the expected 'delete' key
    delete: deleteTask,
    // Queries / visibility / supervising
    ...Queries,
    // Approval workflow
    ...Approvals,
    // Task links
    ...Links,
};
