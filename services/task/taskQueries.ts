/**
 * Task Service — Queries, Visibility & Supervising
 *
 * getVisibleTasks, getMyTasks, getByEntityLink, getByProjectId,
 * getTasksByRole, getRoleCounts, getSubordinateEmployees,
 * getSubordinateStats, and internal helper functions.
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import type {
    Task,
    TaskFilterOptions,
    TaskVisibilityContext,
} from '../../types/taskTypes';

import { TASK_SELECT, mapTask } from './taskTypes';
import { getStatuses } from './taskStatuses';

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tasks visible to the current user based on hierarchical visibility.
 *
 * Rules:
 * - Admin: see all
 * - Leadership (rank 100): see rank < 100 (NOT same rank peers)
 * - Phó TGĐ (rank 80): see rank < 80, only in managed_unit_ids
 * - UnitLeader (rank 50): see unit employees
 * - NVKD/NVKT (rank 0): only "related to me" tasks
 * - Always: tasks where user is in assignees/watchers/supporters/approvers/created_by
 */
export async function getVisibleTasks(ctx: TaskVisibilityContext, filters?: TaskFilterOptions): Promise<Task[]> {
    // Step 1: Get all tasks user is directly involved in (always visible)
    const myTaskIds = await _getMyTaskIds(ctx.userId);

    // Step 2: Based on role/rank, determine additional visible tasks
    let additionalTaskIds: string[] = [];

    if (ctx.role === 'Admin') {
        // Admin sees everything — skip filter, query all
        return _queryTasks(filters, undefined, ctx);
    }

    if (ctx.managementRank >= 100) {
        // CT/TGĐ: see all except same-rank peers' personal tasks
        additionalTaskIds = await _getTasksBelowRank(100, ctx.userId);
    } else if (ctx.managementRank >= 80) {
        // Phó TGĐ: only managed_unit_ids, rank < 80
        additionalTaskIds = await _getTasksInUnits(ctx.managedUnitIds, 80);
    } else if (ctx.managementRank >= 50 || ctx.role === 'UnitLeader' || ctx.role === 'AdminUnit') {
        // Trưởng ĐV: unit employees
        if (ctx.unitId) {
            additionalTaskIds = await _getTasksInUnits([ctx.unitId], 50);
        }
    } else if (ctx.role === 'Accountant' || ctx.role === 'ChiefAccountant') {
        // Kế toán: finance-related tasks
        additionalTaskIds = await _getTasksBySourceModule(['payment', 'contract']);
    } else if (ctx.role === 'Legal') {
        // Pháp chế: legal-related tasks
        additionalTaskIds = await _getTasksBySourceModule(['contract']);
    }

    // Merge: my tasks + additional visible tasks
    const allVisibleIds = [...new Set([...myTaskIds, ...additionalTaskIds])];

    if (allVisibleIds.length === 0) return [];

    return _queryTasks(filters, allVisibleIds, ctx);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tasks specifically assigned to / involving the user.
 */
export async function getMyTasks(userId: string, filters?: TaskFilterOptions): Promise<Task[]> {
    const ids = await _getMyTaskIds(userId);
    if (ids.length === 0) return [];
    return _queryTasks(filters, ids);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tasks linked to a specific entity (for EntityTaskList component).
 */
export async function getByEntityLink(entityType: string, entityId: string, ctx?: TaskVisibilityContext): Promise<Task[]> {
    const { data: links, error: linkError } = await supabase
        .from('task_links')
        .select('task_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

    if (linkError) throw linkError;
    if (!links || links.length === 0) return [];

    const taskIds = links.map(l => l.task_id);
    return _queryTasks(undefined, taskIds, ctx);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tasks linked to a specific BIM project (via project_id column).
 */
export async function getByProjectId(projectId: string, filters?: TaskFilterOptions, ctx?: TaskVisibilityContext): Promise<Task[]> {
    let query = supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('project_id', projectId)
        .is('parent_id', null)
        .order('sort_order')
        .order('created_at', { ascending: false });

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }

    // Hide test data for non-Admin
    if (ctx && ctx.role !== 'Admin') {
        query = query.not('tags', 'cs', '{"_test_data"}');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTask);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBTASKS
// ─────────────────────────────────────────────────────────────────────────────

export async function getSubtasks(parentId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('parent_id', parentId)
        .order('sort_order');

    if (error) throw error;
    return (data || []).map(mapTask);
}

// ─────────────────────────────────────────────────────────────────────────────
// BITRIX24-STYLE ROLE FILTERING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get tasks filtered by user role (Bitrix24 top-tabs style).
 * - 'all': all my tasks (assigned/watching/supporting/created)
 * - 'ongoing': tasks in progress where I'm assigned
 * - 'assisting': tasks where I'm a supporter
 * - 'set_by_me': tasks I created/assigned to others
 * - 'following': tasks where I'm a watcher
 * - 'supervising': tasks of subordinates (uses visibility context)
 */
export async function getTasksByRole(
    userId: string,
    role: string,
    filters?: TaskFilterOptions,
    visibilityCtx?: TaskVisibilityContext,
    page = 0
): Promise<Task[]> {
    // Supervising: delegate to visibility-based subordinate query
    if (role === 'supervising' && visibilityCtx) {
        return _getSupervisingTasks(visibilityCtx, filters);
    }

    let query = supabase
        .from('tasks')
        .select(TASK_SELECT)
        .order('is_pinned', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false });

    switch (role) {
        case 'ongoing': {
            // Tasks assigned to me that are in progress (not done)
            query = query.contains('assignees', [userId]);
            const statuses = await getStatuses();
            const doneIds = statuses.filter(s => s.is_done).map(s => s.id);
            for (const doneId of doneIds) {
                query = query.neq('status_id', doneId);
            }
            break;
        }
        case 'assisting':
            query = query.contains('supporters', [userId]);
            break;
        case 'set_by_me':
            query = query.eq('created_by', userId);
            break;
        case 'following':
            query = query.contains('watchers', [userId]);
            break;
        default: // 'all'
            query = query.or(
                `assignees.cs.{${userId}},watchers.cs.{${userId}},supporters.cs.{${userId}},approvers.cs.{${userId}},created_by.eq.${userId}`
            );
            break;
    }

    // Apply additional filters
    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
    }
    if (filters?.source_modules && filters.source_modules.length > 0) {
        query = query.in('source_module', filters.source_modules);
    }
    if (filters?.source_entity_id) {
        query = query.eq('source_entity_id', filters.source_entity_id);
    }
    if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
    }

    // Hide test data for non-Admin
    if (visibilityCtx?.role !== 'Admin') {
        query = query.not('tags', 'cs', '{"_test_data"}');
    }

    // Pagination
    query = query.range(page * 50, page * 50 + 49);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTask);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get role-based task counts for badge counters on tabs.
 */
export async function getRoleCounts(userId: string, role?: string): Promise<Record<string, number>> {
    let { data, error } = await supabase
        .from('tasks')
        .select('id, assignees, watchers, supporters, approvers, created_by, status_id, tags')
        .or(
            `assignees.cs.{${userId}},watchers.cs.{${userId}},supporters.cs.{${userId}},approvers.cs.{${userId}},created_by.eq.${userId}`
        );

    if (error || !data) return { all: 0, ongoing: 0, assisting: 0, set_by_me: 0, following: 0 };

    // Filter out test data for non-Admin users
    if (role !== 'Admin') {
        data = data.filter((t) => !(t.tags || []).includes('_test_data'));
    }

    const statuses = await getStatuses();
    const doneIds = new Set(statuses.filter(s => s.is_done).map(s => s.id));

    // all = tasks chưa hoàn thành (active tasks)
    const activeTasks = data.filter(t => !doneIds.has(t.status_id));

    const counts: Record<string, number> = {};
    counts.all = activeTasks.length;
    counts.ongoing = activeTasks.filter(t =>
        (t.assignees || []).includes(userId)
    ).length;
    counts.assisting = activeTasks.filter(t =>
        (t.supporters || []).includes(userId) && !(t.assignees || []).includes(userId)
    ).length;
    // set_by_me và following tính cả tasks đã xong (để thấy lịch sử)
    counts.set_by_me = data.filter(t => t.created_by === userId).length;
    counts.following = data.filter(t => (t.watchers || []).includes(userId)).length;

    return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPERVISING / TEAM MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get subordinate employees based on the user's management rank and units.
 * Admin: all | TGĐ (rank 100): rank < 100 | Phó TGĐ (rank 80): managed units rank < 80 | Trưởng ĐV (rank 50): unit members
 */
export async function getSubordinateEmployees(
    ctx: TaskVisibilityContext
): Promise<{ id: string; name: string; position?: string; unit_id?: string; avatar?: string }[]> {
    if (ctx.role === 'Admin') {
        const { data, error } = await supabase
            .from('employees')
            .select('id, name, position, unit_id, avatar')
            .neq('id', ctx.userId)
            .order('name');
        if (error) throw error;
        return data || [];
    }

    if (ctx.managementRank >= 100) {
        const { data, error } = await supabase
            .from('employees')
            .select('id, name, position, unit_id, avatar')
            .lt('management_rank', 100)
            .neq('id', ctx.userId)
            .order('name');
        if (error) throw error;
        return data || [];
    }

    if (ctx.managementRank >= 80) {
        if (ctx.managedUnitIds.length === 0) return [];
        const { data, error } = await supabase
            .from('employees')
            .select('id, name, position, unit_id, avatar')
            .in('unit_id', ctx.managedUnitIds)
            .lt('management_rank', 80)
            .neq('id', ctx.userId)
            .order('name');
        if (error) throw error;
        return data || [];
    }

    if (ctx.managementRank >= 50 || ctx.role === 'UnitLeader' || ctx.role === 'AdminUnit') {
        const unitIds = ctx.managedUnitIds.length > 0 ? ctx.managedUnitIds : (ctx.unitId ? [ctx.unitId] : []);
        if (unitIds.length === 0) return [];
        const { data, error } = await supabase
            .from('employees')
            .select('id, name, position, unit_id, avatar')
            .in('unit_id', unitIds)
            .lt('management_rank', 50)
            .neq('id', ctx.userId)
            .order('name');
        if (error) throw error;
        return data || [];
    }

    return [];
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get task statistics for subordinates — used by TeamDashboard.
 */
export async function getSubordinateStats(ctx: TaskVisibilityContext): Promise<{
    employees: { id: string; name: string; position?: string; unit_id?: string; avatar?: string;
        total: number; overdue: number; inProgress: number; completed: number }[];
    totals: { total: number; overdue: number; inProgress: number; completed: number };
}> {
    const subordinates = await getSubordinateEmployees(ctx);
    if (subordinates.length === 0) {
        return { employees: [], totals: { total: 0, overdue: 0, inProgress: 0, completed: 0 } };
    }

    const subIds = subordinates.map(e => e.id);
    const statuses = await getStatuses();
    const doneIds = new Set(statuses.filter(s => s.is_done).map(s => s.id));
    const today = new Date().toISOString().split('T')[0];

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, assignees, status_id, due_date, created_by, tags')
        .is('parent_id', null)
        .or(`assignees.ov.{${subIds.join(',')}}`);

    if (error) throw error;
    let allTasks = tasks || [];

    // Hide test data for non-Admin
    if (ctx.role !== 'Admin') {
        allTasks = allTasks.filter((t) => !(t.tags || []).includes('_test_data'));
    }

    const empStatsMap = new Map<string, { total: number; overdue: number; inProgress: number; completed: number }>();
    subIds.forEach(id => empStatsMap.set(id, { total: 0, overdue: 0, inProgress: 0, completed: 0 }));

    const totals = { total: allTasks.length, overdue: 0, inProgress: 0, completed: 0 };

    allTasks.forEach(t => {
        const isDone = doneIds.has(t.status_id);
        const isOverdue = !isDone && t.due_date && t.due_date < today;

        if (isDone) totals.completed++;
        else if (isOverdue) totals.overdue++;
        else totals.inProgress++;

        (t.assignees || []).forEach((aId: string) => {
            const stats = empStatsMap.get(aId);
            if (stats) {
                stats.total++;
                if (isDone) stats.completed++;
                else if (isOverdue) stats.overdue++;
                else stats.inProgress++;
            }
        });
    });

    const employees = subordinates.map(e => ({
        ...e,
        ...empStatsMap.get(e.id) || { total: 0, overdue: 0, inProgress: 0, completed: 0 },
    }));

    employees.sort((a, b) => b.overdue - a.overdue || b.total - a.total);

    return { employees, totals };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get task IDs where user is directly involved.
 */
export async function _getMyTaskIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .or(`assignees.cs.{${userId}},watchers.cs.{${userId}},supporters.cs.{${userId}},approvers.cs.{${userId}},created_by.eq.${userId}`);

    if (error) throw error;
    return (data || []).map(d => d.id);
}

/**
 * Get task IDs created by employees with rank below the given threshold.
 */
export async function _getTasksBelowRank(rank: number, excludeUserId: string): Promise<string[]> {
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .lt('management_rank', rank);

    if (empError) throw empError;
    if (!employees || employees.length === 0) return [];

    const empIds = employees.map(e => e.id);

    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .neq('created_by', excludeUserId)
        .or(`created_by.in.(${empIds.join(',')}),assignees.ov.{${empIds.join(',')}}`);

    if (taskError) throw taskError;
    return (tasks || []).map(t => t.id);
}

/**
 * Get task IDs for employees in specific units with rank below threshold.
 */
export async function _getTasksInUnits(unitIds: string[], belowRank: number): Promise<string[]> {
    if (unitIds.length === 0) return [];

    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id')
        .in('unit_id', unitIds)
        .lt('management_rank', belowRank);

    if (empError) throw empError;
    if (!employees || employees.length === 0) return [];

    const empIds = employees.map(e => e.id);

    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .or(`created_by.in.(${empIds.join(',')}),assignees.ov.{${empIds.join(',')}}`);

    if (taskError) throw taskError;
    return (tasks || []).map(t => t.id);
}

/**
 * Get task IDs by source module (for role-specific visibility like Accountant).
 */
export async function _getTasksBySourceModule(modules: string[]): Promise<string[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .in('source_module', modules);

    if (error) throw error;
    return (data || []).map(d => d.id);
}

/**
 * Core query builder: fetch tasks with optional ID filter and TaskFilterOptions.
 */
export async function _queryTasks(
    filters?: TaskFilterOptions,
    ids?: string[],
    ctx?: TaskVisibilityContext,
    page = 0,
    pageSize = 50
): Promise<Task[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from('tasks')
        .select(TASK_SELECT)
        .order('is_pinned', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (ids) {
        if (ids.length === 0) return [];
        query = query.in('id', ids);
    }

    if (filters) {
        if (filters.status_ids && filters.status_ids.length > 0) {
            query = query.in('status_id', filters.status_ids);
        }
        if (filters.priorities && filters.priorities.length > 0) {
            query = query.in('priority', filters.priorities);
        }
        if (filters.assignee_ids && filters.assignee_ids.length > 0) {
            const orConditions = filters.assignee_ids.map(id => `assignees.cs.{${id}}`).join(',');
            query = query.or(orConditions);
        }
        if (filters.source_modules && filters.source_modules.length > 0) {
            query = query.in('source_module', filters.source_modules);
        }
        if (filters.source_entity_id) {
            query = query.eq('source_entity_id', filters.source_entity_id);
        }
        if (filters.due_before) {
            query = query.lte('due_date', filters.due_before);
        }
        if (filters.due_after) {
            query = query.gte('due_date', filters.due_after);
        }
        if (filters.is_overdue) {
            query = query.lt('due_date', new Date().toISOString().split('T')[0]);
            const statuses = await getStatuses();
            const doneIds = statuses.filter(s => s.is_done).map(s => s.id);
            if (doneIds.length > 0) {
                query = query.not('status_id', 'in', `(${doneIds.join(',')})`);
            }
        }
        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }
        if (filters.tags && filters.tags.length > 0) {
            query = query.overlaps('tags', filters.tags);
        }
        if (filters.project_id) {
            query = query.eq('project_id', filters.project_id);
        }
    }

    // Hide test data for non-Admin
    if (ctx && ctx.role !== 'Admin') {
        query = query.not('tags', 'cs', '{"_test_data"}');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTask);
}

/**
 * Get supervising tasks — tasks of subordinates only (excludes user's own tasks).
 */
export async function _getSupervisingTasks(
    ctx: TaskVisibilityContext,
    filters?: TaskFilterOptions
): Promise<Task[]> {
    const subordinates = await getSubordinateEmployees(ctx);
    if (subordinates.length === 0) return [];
    const subIds = subordinates.map(e => e.id);

    let query = supabase
        .from('tasks')
        .select(TASK_SELECT)
        .or(`created_by.in.(${subIds.join(',')}),assignees.ov.{${subIds.join(',')}}`)
        .order('is_pinned', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false });

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id);
    }
    if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
    }
    if (filters?.assignee_ids && filters.assignee_ids.length > 0) {
        const orConditions = filters.assignee_ids.map(id => `assignees.cs.{${id}}`).join(',');
        query = query.or(orConditions);
    }

    if (ctx.role !== 'Admin') {
        query = query.not('tags', 'cs', '{"_test_data"}');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapTask);
}
