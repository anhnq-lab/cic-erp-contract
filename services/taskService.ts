/**
 * taskService.ts — Thin re-export for backward compatibility.
 *
 * Full implementation has been split into services/task/ sub-modules:
 *   taskTypes.ts      — TASK_SELECT, mapTask
 *   taskStatuses.ts   — getStatuses, getDefaultStatusId
 *   taskCrud.ts       — create, getById, update, delete, bulkDelete, complete, togglePin, ...
 *   taskQueries.ts    — getVisibleTasks, getTasksByRole, getSubordinateStats, ...
 *   taskApprovals.ts  — submitForApproval, approveTask, rejectApproval, ...
 *   taskLinks.ts      — getLinks, addLink, removeLink, updateLink
 *
 * Consumers that `import { TaskService } from '@/services/taskService'`
 * continue to work without any changes.
 */

export { TaskService } from './task';
