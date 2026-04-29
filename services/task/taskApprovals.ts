/**
 * Task Service — Approval Workflow
 *
 * submitForApproval, approveTask, rejectApproval, getApprovalSubtasks,
 * and internal multi-level approval helpers.
 * Extracted from taskService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import type {
    Task,
    ApprovalMode,
    ApprovalStep,
} from '../../types/taskTypes';
import type { DbTask } from '../../lib/db';
import { DiscussionService } from '../discussionService';
import { TelegramNotificationService } from '../telegramNotificationService';

import { TASK_SELECT, mapTask } from './taskTypes';
import { getStatuses } from './taskStatuses';
import { getById, update } from './taskCrud';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a task for approval. Changes status to "Chờ phê duyệt"
 * and creates approval subtasks.
 *
 * Supports two modes:
 * 1) Simple: uses `approvers[]` array — creates subtasks for all at once
 * 2) Multi-level: uses `custom_fields.approval_steps[]` — creates subtasks level by level
 */
export async function submitForApproval(taskId: string, userId: string): Promise<void> {
    const task = await getById(taskId);
    if (!task) throw new Error('Task not found');

    const approvalSteps: ApprovalStep[] | undefined = task.custom_fields?.approval_steps;
    const hasSteps = approvalSteps && approvalSteps.length > 0;

    if (!hasSteps && (!task.approvers || task.approvers.length === 0)) {
        throw new Error('Task không có người phê duyệt');
    }

    const statuses = await getStatuses();
    const pendingApprovalStatus = statuses.find(s => s.name === 'Chờ phê duyệt');
    if (!pendingApprovalStatus) {
        throw new Error('Không tìm thấy trạng thái "Chờ phê duyệt"');
    }

    if (hasSteps) {
        // ─── Multi-level approval ───
        const sortedSteps = [...approvalSteps].sort((a, b) => a.level - b.level);
        const firstLevel = sortedSteps[0].level;

        await update(taskId, {
            status_id: pendingApprovalStatus.id,
            approval_status: 'pending',
            custom_fields: {
                ...task.custom_fields,
                current_approval_level: firstLevel,
            },
        });

        await _createSubtasksForLevel(task, sortedSteps[0], userId);

        const totalLevels = sortedSteps.length;
        try {
            await DiscussionService.add({
                entity_type: 'task',
                entity_id: taskId,
                user_id: userId,
                content: `Đã gửi yêu cầu phê duyệt (${totalLevels} cấp). Bắt đầu: ${sortedSteps[0].label || `Cấp ${firstLevel}`}`,
                comment_type: 'system',
            });
        } catch { /* fire-and-forget */ }
    } else {
        // ─── Simple approval (flat approvers[]) ───
        const todoStatus = statuses.find(s => s.is_default) || statuses[0];

        await update(taskId, {
            status_id: pendingApprovalStatus.id,
            approval_status: 'pending',
        });

        for (const approverId of task.approvers) {
            await supabase.from('tasks').insert({
                title: `🔍 Phê duyệt: ${task.title}`,
                description: `Yêu cầu phê duyệt cho công việc "${task.title}".\n\nVui lòng xem xét và phê duyệt hoặc yêu cầu chỉnh sửa.`,
                parent_id: taskId,
                approval_parent_id: taskId,
                approval_status: 'pending',
                status_id: todoStatus.id,
                priority: task.priority,
                assignees: [approverId],
                created_by: userId,
                source_module: 'approval',
                source_event: 'submit_for_approval',
                source_entity_id: taskId,
                auto_generated: true,
                action_type: 'approve_task',
                action_label: 'Phê duyệt',
                action_config: { parent_task_id: taskId },
                due_date: task.due_date,
            });
        }

        try {
            await DiscussionService.add({
                entity_type: 'task',
                entity_id: taskId,
                user_id: userId,
                content: `Đã gửi yêu cầu phê duyệt cho ${task.approvers.length} người`,
                comment_type: 'system',
            });
        } catch { /* fire-and-forget */ }
    }

    // Telegram notification
    const notifyIds = hasSteps ? approvalSteps[0].approver_ids : task.approvers;

    try {
        const { data: submitter } = await supabase.from('employees').select('full_name').eq('id', userId).single();
        for (const approverId of notifyIds) {
            TelegramNotificationService.notifyTaskChange({
                eventType: 'assigned',
                taskId: taskId,
                taskTitle: `🔍 Phê duyệt: ${task.title}`,
                assigneeId: approverId,
                priority: task.priority,
                dueDate: task.due_date,
                changedBy: submitter?.full_name || 'Hệ thống',
            });
        }
    } catch { /* fire-and-forget */ }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve a task (called from an approval subtask).
 * For multi-level: checks if current level is done, then advances to next level.
 */
export async function approveTask(approvalSubtaskId: string, userId: string, comment?: string): Promise<void> {
    const subtask = await getById(approvalSubtaskId);
    if (!subtask) throw new Error('Approval subtask not found');
    if (!subtask.approval_parent_id) throw new Error('Đây không phải subtask phê duyệt');

    const parentTask = await getById(subtask.approval_parent_id);
    if (!parentTask) throw new Error('Task gốc không tồn tại');

    const statuses = await getStatuses();
    const doneStatus = statuses.find(s => s.is_done && s.name !== 'Hủy');

    await update(approvalSubtaskId, {
        approval_status: 'approved',
        approval_comment: comment || undefined,
        status_id: doneStatus?.id,
        completed_at: new Date().toISOString(),
        completed_by: userId,
    });

    try {
        await DiscussionService.add({
            entity_type: 'task',
            entity_id: approvalSubtaskId,
            user_id: userId,
            content: `✅ Đã phê duyệt${comment ? `: ${comment}` : ''}`,
            comment_type: 'system',
        });
    } catch { /* ignore */ }

    const subtaskLevel: number | undefined = subtask.custom_fields?.approval_level;
    const approvalSteps: ApprovalStep[] | undefined = parentTask.custom_fields?.approval_steps;

    if (approvalSteps && approvalSteps.length > 0 && subtaskLevel !== undefined) {
        // ─── Multi-level mode ───
        await _advanceApprovalLevel(parentTask, subtaskLevel, userId, comment);
    } else {
        // ─── Simple mode ───
        const approvalMode: ApprovalMode = parentTask.approval_mode || 'all';

        if (approvalMode === 'any') {
            await _completeParentAfterApproval(parentTask, userId, comment);
        } else {
            const { data: siblings } = await supabase
                .from('tasks')
                .select('id, approval_status')
                .eq('approval_parent_id', parentTask.id);

            const allApproved = siblings?.every(s => s.approval_status === 'approved') ?? false;
            if (allApproved) {
                await _completeParentAfterApproval(parentTask, userId, comment);
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reject an approval (called from an approval subtask).
 * Returns parent task to "Đang tiến hành" and cancels all pending subtasks.
 */
export async function rejectApproval(approvalSubtaskId: string, userId: string, reason: string): Promise<void> {
    if (!reason?.trim()) throw new Error('Vui lòng nhập lý do từ chối');

    const subtask = await getById(approvalSubtaskId);
    if (!subtask) throw new Error('Approval subtask not found');
    if (!subtask.approval_parent_id) throw new Error('Đây không phải subtask phê duyệt');

    const parentTask = await getById(subtask.approval_parent_id);
    if (!parentTask) throw new Error('Task gốc không tồn tại');

    const statuses = await getStatuses();
    const doneStatus = statuses.find(s => s.is_done && s.name !== 'Hủy');
    const inProgressStatus = statuses.find(s => s.name === 'Đang tiến hành');

    await update(approvalSubtaskId, {
        approval_status: 'rejected',
        approval_comment: reason,
        status_id: doneStatus?.id,
        completed_at: new Date().toISOString(),
        completed_by: userId,
    });

    // Cancel ALL other pending approval subtasks (all levels)
    const { data: siblings } = await supabase
        .from('tasks')
        .select('id, approval_status')
        .eq('approval_parent_id', parentTask.id)
        .eq('approval_status', 'pending')
        .neq('id', approvalSubtaskId);

    if (siblings && siblings.length > 0) {
        const cancelStatus = statuses.find(s => s.name === 'Hủy');
        for (const sib of siblings) {
            await update(sib.id, {
                approval_status: 'rejected',
                approval_comment: 'Bị hủy do phê duyệt bị từ chối',
                status_id: cancelStatus?.id || doneStatus?.id,
                completed_at: new Date().toISOString(),
                completed_by: userId,
            });
        }
    }

    // Return parent task to "Đang tiến hành" + reset approval level
    const resetCustomFields = { ...parentTask.custom_fields };
    delete resetCustomFields.current_approval_level;

    await update(parentTask.id, {
        status_id: inProgressStatus?.id,
        approval_status: 'rejected',
        completed_at: undefined,
        completed_by: undefined,
        custom_fields: resetCustomFields,
    });

    try {
        const subtaskLevel = subtask.custom_fields?.approval_level;
        const levelLabel = subtaskLevel
            ? (parentTask.custom_fields?.approval_steps as ApprovalStep[])?.find(s => s.level === subtaskLevel)?.label || `Cấp ${subtaskLevel}`
            : '';
        await DiscussionService.add({
            entity_type: 'task',
            entity_id: approvalSubtaskId,
            user_id: userId,
            content: `❌ Đã từ chối phê duyệt: ${reason}`,
            comment_type: 'system',
        });
        await DiscussionService.add({
            entity_type: 'task',
            entity_id: parentTask.id,
            user_id: userId,
            content: `❌ Phê duyệt bị từ chối${levelLabel ? ` tại ${levelLabel}` : ''}: ${reason}. Task quay lại "Đang tiến hành"`,
            comment_type: 'system',
        });
    } catch { /* ignore */ }

    try {
        const { data: rejecter } = await supabase.from('employees').select('full_name').eq('id', userId).single();
        for (const assigneeId of parentTask.assignees) {
            TelegramNotificationService.notifyTaskChange({
                eventType: 'assigned',
                taskId: parentTask.id,
                taskTitle: parentTask.title,
                assigneeId: assigneeId,
                changedBy: rejecter?.full_name || 'Người phê duyệt',
            });
        }
    } catch { /* fire-and-forget */ }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get approval subtasks for a parent task.
 */
export async function getApprovalSubtasks(parentTaskId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('approval_parent_id', parentTaskId)
        .order('created_at');

    if (error) throw error;
    return (data || []).map(mapTask);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL APPROVAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create approval subtasks for a specific level.
 */
async function _createSubtasksForLevel(parentTask: Task, step: ApprovalStep, submitterId: string): Promise<void> {
    const statuses = await getStatuses();
    const todoStatus = statuses.find(s => s.is_default) || statuses[0];

    for (const approverId of step.approver_ids) {
        await supabase.from('tasks').insert({
            title: `🔍 [${step.label || `Cấp ${step.level}`}] Phê duyệt: ${parentTask.title}`,
            description: `Yêu cầu phê duyệt cho công việc "${parentTask.title}".\nCấp phê duyệt: ${step.label || `Cấp ${step.level}`}\nChế độ: ${step.mode === 'all' ? 'Tất cả phải duyệt' : 'Chỉ cần 1 duyệt'}\n\nVui lòng xem xét và phê duyệt hoặc yêu cầu chỉnh sửa.`,
            parent_id: parentTask.id,
            approval_parent_id: parentTask.id,
            approval_status: 'pending',
            status_id: todoStatus.id,
            priority: parentTask.priority,
            assignees: [approverId],
            created_by: submitterId,
            source_module: 'approval',
            source_event: 'submit_for_approval',
            source_entity_id: parentTask.id,
            auto_generated: true,
            action_type: 'approve_task',
            action_label: 'Phê duyệt',
            action_config: { parent_task_id: parentTask.id },
            due_date: parentTask.due_date,
            custom_fields: { approval_level: step.level },
        });
    }
}

/**
 * Check if the current approval level is complete, then advance to the next level
 * or complete the parent task if this was the final level.
 */
async function _advanceApprovalLevel(parentTask: Task, completedLevel: number, userId: string, comment?: string): Promise<void> {
    const approvalSteps: ApprovalStep[] = parentTask.custom_fields?.approval_steps || [];
    const currentStep = approvalSteps.find(s => s.level === completedLevel);
    if (!currentStep) return;

    const { data: levelSubtasks } = await supabase
        .from('tasks')
        .select('id, approval_status, custom_fields')
        .eq('approval_parent_id', parentTask.id)
        .not('approval_status', 'is', null);

    type LevelSubtask = Pick<DbTask, 'id' | 'approval_status' | 'custom_fields'>;
    const thisLevelSubtasks = (levelSubtasks as LevelSubtask[] || []).filter(
        (t) => (t.custom_fields as Record<string, unknown>)?.approval_level === completedLevel
    );

    const levelMode = currentStep.mode || 'all';
    let levelDone = false;

    if (levelMode === 'any') {
        levelDone = thisLevelSubtasks.some((t) => t.approval_status === 'approved');
    } else {
        levelDone = thisLevelSubtasks.length > 0 &&
            thisLevelSubtasks.every((t) => t.approval_status === 'approved');
    }

    if (!levelDone) return;

    // If ANY mode and level is done, cancel remaining pending subtasks in this level
    if (levelMode === 'any') {
        const statuses = await getStatuses();
        const cancelStatus = statuses.find(s => s.name === 'Hủy');
        const doneStatus = statuses.find(s => s.is_done && s.name !== 'Hủy');
        const pendingInLevel = thisLevelSubtasks.filter((t) => t.approval_status === 'pending');
        for (const p of pendingInLevel) {
            await update(p.id, {
                approval_status: 'approved',
                approval_comment: 'Tự động duyệt — chế độ "Chỉ cần 1 duyệt"',
                status_id: cancelStatus?.id || doneStatus?.id,
                completed_at: new Date().toISOString(),
                completed_by: userId,
            });
        }
    }

    const sortedSteps = [...approvalSteps].sort((a, b) => a.level - b.level);
    const currentIdx = sortedSteps.findIndex(s => s.level === completedLevel);
    const nextStep = sortedSteps[currentIdx + 1];

    if (nextStep) {
        await update(parentTask.id, {
            custom_fields: {
                ...parentTask.custom_fields,
                current_approval_level: nextStep.level,
            },
        });

        await _createSubtasksForLevel(parentTask, nextStep, parentTask.created_by || userId);

        try {
            await DiscussionService.add({
                entity_type: 'task',
                entity_id: parentTask.id,
                user_id: userId,
                content: `✅ ${currentStep.label || `Cấp ${completedLevel}`} đã duyệt. Chuyển sang → ${nextStep.label || `Cấp ${nextStep.level}`}`,
                comment_type: 'system',
            });
        } catch { /* ignore */ }

        try {
            const { data: approver } = await supabase.from('employees').select('full_name').eq('id', userId).single();
            for (const nId of nextStep.approver_ids) {
                TelegramNotificationService.notifyTaskChange({
                    eventType: 'assigned',
                    taskId: parentTask.id,
                    taskTitle: `🔍 [${nextStep.label || `Cấp ${nextStep.level}`}] Phê duyệt: ${parentTask.title}`,
                    assigneeId: nId,
                    priority: parentTask.priority,
                    dueDate: parentTask.due_date,
                    changedBy: approver?.full_name || 'Hệ thống',
                });
            }
        } catch { /* fire-and-forget */ }
    } else {
        await _completeParentAfterApproval(parentTask, userId, comment);
    }
}

/**
 * Internal: Complete parent task after all approvals are done.
 */
async function _completeParentAfterApproval(parentTask: Task, approverId: string, comment?: string): Promise<void> {
    const statuses = await getStatuses();
    const doneStatus = statuses.find(s => s.is_done && s.name !== 'Hủy');

    await update(parentTask.id, {
        status_id: doneStatus?.id,
        approval_status: 'approved',
        completed_at: new Date().toISOString(),
        completed_by: approverId,
    });

    try {
        await DiscussionService.add({
            entity_type: 'task',
            entity_id: parentTask.id,
            user_id: approverId,
            content: `✅ Đã được phê duyệt và hoàn thành${comment ? `: ${comment}` : ''}`,
            comment_type: 'system',
        });
    } catch { /* ignore */ }

    try {
        const { data: approver } = await supabase.from('employees').select('full_name').eq('id', approverId).single();
        const notifyIds = new Set([...parentTask.assignees, parentTask.created_by].filter(Boolean) as string[]);
        notifyIds.delete(approverId);
        for (const nId of notifyIds) {
            TelegramNotificationService.notifyTaskChange({
                eventType: 'completed',
                taskId: parentTask.id,
                taskTitle: parentTask.title,
                assigneeId: nId,
                changedBy: approver?.full_name || 'Người phê duyệt',
            });
        }
    } catch { /* fire-and-forget */ }
}
