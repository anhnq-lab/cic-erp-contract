/**
 * Task Service — Status Lookups
 *
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import type { TaskStatus } from '../../types/taskTypes';

/**
 * Get all task statuses, optionally scoped to a space.
 */
export async function getStatuses(spaceId?: string): Promise<TaskStatus[]> {
    let query = supabase
        .from('task_statuses')
        .select('*')
        .order('sort_order');

    if (spaceId) {
        query = query.or(`space_id.eq.${spaceId},space_id.is.null`);
    } else {
        query = query.is('space_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TaskStatus[];
}

/**
 * Get the default status ID (used when creating tasks without an explicit status).
 */
export async function getDefaultStatusId(): Promise<string | null> {
    const { data, error } = await supabase
        .from('task_statuses')
        .select('id')
        .eq('is_default', true)
        .is('space_id', null)
        .single();

    if (error) return null;
    return data?.id || null;
}
