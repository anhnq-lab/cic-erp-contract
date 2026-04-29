/**
 * Task Service — CRUD + Bulk Operations
 *
 * create, getById, update, deleteTask, bulkDeleteTasks, complete,
 * togglePin, getAllTags, bulkUpdateStatus, bulkSetDeadline.
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import type {
    Task,
    CreateTaskInput,
    UpdateTaskInput,
} from '../../types/taskTypes';
import type { DbTask, UpdateTask } from '../../lib/db';
import { DiscussionService } from '../discussionService';
import { TelegramNotificationService } from '../telegramNotificationService';

import { TASK_SELECT, mapTask } from './taskTypes';
import { getStatuses, getDefaultStatusId } from './taskStatuses';

// ─────────────────────────────────────────────────────────────────────────────

export async function create(input: CreateTaskInput): Promise<Task> {
    // Auto-set default status if not provided
    if (!input.status_id) {
        input.status_id = (await getDefaultStatusId()) || undefined;
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert(input)
        .select(TASK_SELECT)
        .single();

    if (error) throw error;
    const task = mapTask(data);

    // Auto-generate creation system log
    if (task.created_by) {
        try {
            await DiscussionService.add({
                entity_type: 'task',
                entity_id: task.id,
                user_id: task.created_by,
                content: 'Tạo công việc',
                comment_type: 'system',
            });
        } catch (e) {
            console.warn('Failed to insert task creation log', e);
        }
    }

    // Telegram notifications for assignees
    if (task.assignees && task.assignees.length > 0) {
        try {
            const { data: emps } = await supabase.from('employees').select('id, full_name').in('id', task.assignees);
            const { data: creator } = task.created_by
                ? await supabase.from('employees').select('full_name').eq('id', task.created_by).single()
                : { data: null };
            const { data: contract } = task.source_entity_id && task.source_module === 'contracts'
                ? await supabase.from('contracts').select('title').eq('id', task.source_entity_id).single()
                : { data: null };

            for (const assigneeId of task.assignees) {
                // Don't notify the person who created the task if they assigned it to themselves
                if (assigneeId === task.created_by && !task.auto_generated) continue;

                const emp = emps?.find((e: Pick<DbTask, 'id'> & { full_name: string | null }) => e.id === assigneeId);
                TelegramNotificationService.notifyTaskChange({
                    eventType: 'assigned',
                    taskId: task.id,
                    taskTitle: task.title,
                    assigneeId: assigneeId,
                    assigneeName: emp?.full_name,
                    contractTitle: contract?.title,
                    priority: task.priority,
                    dueDate: task.due_date,
                    changedBy: task.auto_generated ? 'Hệ thống (Auto-Task)' : (creator?.full_name || 'Hệ thống')
                });
            }
        } catch (e) {
            console.warn('Failed to send telegram notifications for new task', e);
        }
    }

    return task;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data ? mapTask(data) : null;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function update(id: string, updates: UpdateTaskInput): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(TASK_SELECT)
        .single();

    if (error) throw error;
    return mapTask(data);
}

// ─────────────────────────────────────────────────────────────────────────────

/** `delete` is a reserved word — exported as deleteTask, mapped to 'delete' in index.ts */
export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);

    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark task as completed (set status to done + timestamp).
 */
export async function complete(id: string, userId: string): Promise<Task> {
    const statuses = await getStatuses();
    const doneStatus = statuses.find(s => s.is_done && s.name !== 'Hủy');

    const updated = await update(id, {
        status_id: doneStatus?.id,
        completed_at: new Date().toISOString(),
        completed_by: userId,
    });

    // Notify creator if someone else completed it
    if (updated.created_by && updated.created_by !== userId && !updated.auto_generated) {
        try {
            const { data: updater } = await supabase.from('employees').select('full_name').eq('id', userId).single();
            const { data: contract } = updated.source_entity_id && updated.source_module === 'contracts'
                ? await supabase.from('contracts').select('title').eq('id', updated.source_entity_id).single()
                : { data: null };

            TelegramNotificationService.notifyTaskChange({
                eventType: 'completed',
                taskId: updated.id,
                taskTitle: updated.title,
                assigneeId: updated.created_by,
                contractTitle: contract?.title,
                changedBy: updater?.full_name || 'Hệ thống'
            });
        } catch (e) {
            console.warn('Failed to send telegram notification for completed task', e);
        }
    }

    return updated;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toggle pin state for a task.
 */
export async function togglePin(taskId: string): Promise<boolean> {
    const task = await getById(taskId);
    if (!task) throw new Error('Task not found');

    const newPinned = !task.is_pinned;
    await update(taskId, { is_pinned: newPinned });
    return newPinned;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all distinct tags used across all tasks (for autocomplete).
 */
export async function getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('tags')
        .not('tags', 'eq', '{}');

    if (error) throw error;
    const tagSet = new Set<string>();
    (data || []).forEach((row: Pick<DbTask, 'tags'>) => {
        if (Array.isArray(row.tags)) {
            row.tags.forEach((t: string) => {
                if (t && t !== '_test_data') tagSet.add(t);
            });
        }
    });
    return [...tagSet].sort();
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bulk update status for multiple tasks.
 */
export async function bulkUpdateStatus(taskIds: string[], statusId: string, userId?: string): Promise<void> {
    const statuses = await getStatuses();
    const status = statuses.find(s => s.id === statusId);
    const updates: UpdateTask = { status_id: statusId };
    if (status?.is_done) {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = userId;
    }

    const { error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', taskIds);

    if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bulk set deadline for multiple tasks.
 */
export async function bulkSetDeadline(taskIds: string[], dueDate: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .update({ due_date: dueDate })
        .in('id', taskIds);

    if (error) throw error;
}
