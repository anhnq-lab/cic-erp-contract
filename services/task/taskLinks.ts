/**
 * Task Service — Task Links (entity linking)
 *
 * getLinks, addLink, removeLink, updateLink.
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import type { TaskLink, CreateTaskLinkInput } from '../../types/taskTypes';

// ─────────────────────────────────────────────────────────────────────────────

export async function getLinks(taskId: string): Promise<TaskLink[]> {
    const { data, error } = await supabase
        .from('task_links')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at');

    if (error) throw error;
    return (data || []) as TaskLink[];
}

export async function addLink(input: CreateTaskLinkInput): Promise<TaskLink> {
    const { data, error } = await supabase
        .from('task_links')
        .insert(input)
        .select()
        .single();

    if (error) throw error;
    return data as TaskLink;
}

export async function removeLink(linkId: string): Promise<void> {
    const { error } = await supabase
        .from('task_links')
        .delete()
        .eq('id', linkId);

    if (error) throw error;
}

export async function updateLink(linkId: string, updates: Partial<CreateTaskLinkInput>): Promise<TaskLink> {
    const { data, error } = await supabase
        .from('task_links')
        .update(updates)
        .eq('id', linkId)
        .select()
        .single();

    if (error) throw error;
    return data as TaskLink;
}
