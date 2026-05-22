import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckSquare, X, Calendar, Clock, Tag, Link2, MessageSquare,
  AlertTriangle, Pin, User, Edit3, Save, ExternalLink,
  Play, CheckCircle2, Plus, Trash2, History, Lock,
  Eye, Crown, Users, ShieldCheck, Send, XCircle, RotateCcw,
  FileText, Briefcase, Building, Bookmark, Network, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { TaskService } from '../../services/taskService';
import { TaskPersonalTagService } from '../../services/taskPersonalTagService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import ConfirmDialog from '../ui/ConfirmDialog';
import { DiscussionService, type Discussion } from '../../services/discussionService';
import { useSlidePanel } from '../../contexts/SlidePanelContext';
import type { Task, TaskStatus, TaskLink, ApprovalStep } from '../../types/taskTypes';
import { SlidePanelHeader } from '../ui/SlidePanelHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useOpenEntityPanel } from '../LazyPages';
import { TaskTimeTab } from './task-detail/TaskTimeTab';
import { TaskSubtasksTab } from './task-detail/TaskSubtasksTab';
import TaskApprovalTab from './task-detail/TaskApprovalTab';
import TaskAttachmentTab from './task-detail/TaskAttachmentTab';
import { TaskInfoTab } from './task-detail/TaskInfoTab';
import { TaskLinksTab } from './task-detail/TaskLinksTab';
import { TaskCommentsTab } from './task-detail/TaskCommentsTab';
import { TaskSidebar } from './task-detail/TaskSidebar';
import { HistoryTab, type PersonInfo, type ChecklistItem, PRIORITIES } from './TaskDetailSubComponents';

// ═══════════════════════════════════════
// MAIN TASK DETAIL PANEL (Bitrix24-style)
// ═══════════════════════════════════════
interface TaskDetailPanelProps {
  taskId: string;
  onClose?: () => void;
  onUpdate?: () => void;
  currentUserId?: string;
  initialTab?: 'detail' | 'comments' | 'history' | 'links' | 'time' | 'subtasks';
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  taskId,
  onClose,
  onUpdate,
  currentUserId,
  initialTab,
}) => {
  const { profile } = useAuth();
  const openEntityPanel = useOpenEntityPanel();
  const [task, setTask] = useState<Task | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProgressNote, setEditProgressNote] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [bottomTab, setBottomTabState] = useState<'detail' | 'comments' | 'history' | 'links' | 'time' | 'subtasks' | 'approval' | 'attachments'>(() => {
    return (localStorage.getItem('cic-erp-task-bottom-tab') as any) || initialTab || 'detail';
  });

  const setBottomTab = (tab: 'detail' | 'comments' | 'history' | 'links' | 'time' | 'subtasks' | 'approval' | 'attachments') => {
    setBottomTabState(tab);
    localStorage.setItem('cic-erp-task-bottom-tab', tab);
  };

  // People picker popover state
  const [openPicker, setOpenPicker] = useState<'assignees' | 'supporters' | 'watchers' | 'approvers' | null>(null);

  // Approval workflow state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [editingStepLevel, setEditingStepLevel] = useState<number | null>(null);

  // History logs
  const [historyLogs, setHistoryLogs] = useState<Discussion[]>([]);

  // Sidebar: people info
  const [people, setPeople] = useState<Record<string, PersonInfo>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Added state

  const originalTaskRef = useRef<Task | null>(null);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Personal tags
  const [personalTags, setPersonalTags] = useState<string[]>([]);

  // ─── Pending changes (buffered save) ───
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const isDirty = Object.keys(pendingChanges).length > 0;

  // SlidePanel lock when dirty
  const { lockPanel, unlockPanel, setOnCloseBlocked, panels } = useSlidePanel();
  const topPanelId = panels.length > 0 ? panels[panels.length - 1].id : undefined;

  useEffect(() => {
    if (!topPanelId) return;
    if (isDirty) {
      lockPanel(topPanelId);
      setOnCloseBlocked(topPanelId, () => {
        const ok = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?');
        if (ok) {
          unlockPanel(topPanelId);
          setPendingChanges({});
        }
      });
    } else {
      unlockPanel(topPanelId);
      setOnCloseBlocked(topPanelId, null);
    }
    return () => {
      if (topPanelId) {
        unlockPanel(topPanelId);
        setOnCloseBlocked(topPanelId, null);
      }
    };
  }, [isDirty, topPanelId, lockPanel, unlockPanel, setOnCloseBlocked]);

  // Browser beforeunload warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Load task data
  const loadTask = useCallback(async () => {
    try {
      const [taskData, statusList, linkList] = await Promise.all([
        TaskService.getById(taskId),
        TaskService.getStatuses(),
        TaskService.getLinks(taskId),
      ]);
      setTask(taskData);
      originalTaskRef.current = JSON.parse(JSON.stringify(taskData)); // deep copy to ensure it doesn't get mutated by accident if there are arrays
      setStatuses(statusList);
      setLinks(linkList);
      setEditTitle(taskData?.title || '');
      setEditDescription(taskData?.description || '');
      setEditProgressNote(taskData?.custom_fields?.progress_note || '');
      setPendingChanges({}); // reset dirty on load

      // Load checklist from custom_fields
      if (taskData?.custom_fields?.checklist) {
        setChecklist(taskData.custom_fields.checklist);
      }

      // Load personal tags
      if (currentUserId) {
        try {
          const pTags = await TaskPersonalTagService.getTagsForTask(currentUserId, taskId);
          setPersonalTags(pTags);
        } catch { /* silent */ }
      }

      // Resolve people from employees table (full company directory)
      const ids = new Set<string>();
      if (taskData?.created_by) ids.add(taskData.created_by);
      taskData?.assignees?.forEach((id: string) => ids.add(id));
      taskData?.watchers?.forEach((id: string) => ids.add(id));
      taskData?.supporters?.forEach((id: string) => ids.add(id));
      taskData?.approvers?.forEach((id: string) => ids.add(id));
      // Also collect approver IDs from multi-level approval_steps
      if (taskData?.custom_fields?.approval_steps) {
        for (const step of taskData.custom_fields.approval_steps) {
          step.approver_ids?.forEach((id: string) => ids.add(id));
        }
      }

      if (ids.size > 0) {
        try {
          const { dataClient } = await import('../../lib/dataClient');
          const { data: employees } = await dataClient
            .from('employees')
            .select('id, name, avatar, position')
            .in('id', Array.from(ids));

          const map: Record<string, PersonInfo> = {};
          if (employees) {
            for (const e of employees) {
              map[e.id] = {
                id: e.id,
                name: e.name || e.id.substring(0, 8) + '...',
                avatar: e.avatar || undefined,
                position: e.position || undefined,
              };
            }
          }
          setPeople(map);
        } catch { /* fallback: show IDs */ }
      }
    } catch (err: any) {
      toast.error('Lỗi tải chi tiết task: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { loadTask(); }, [loadTask]);

  // ─── Buffered field change (adds to pending, does NOT save immediately) ───
  const bufferChange = (field: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [field]: value }));
    // Also update the local task state optimistically for instant UI feedback
    setTask(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // ─── Fetch & cache person info for IDs not yet in people map ───
  const ensurePeopleLoaded = useCallback(async (ids: string[]) => {
    const missing = ids.filter(id => !people[id] || people[id].name.includes('...'));
    if (missing.length === 0) return;
    try {
      const { dataClient } = await import('../../lib/dataClient');
      const { data: employees } = await dataClient
        .from('employees')
        .select('id, name, avatar, position')
        .in('id', missing);
      if (employees && employees.length > 0) {
        setPeople(prev => {
          const updated = { ...prev };
          for (const e of employees) {
            updated[e.id] = { id: e.id, name: e.name || e.id.substring(0, 8) + '...', avatar: e.avatar || undefined, position: e.position || undefined };
          }
          return updated;
        });
      }
    } catch { /* fallback: will show ID */ }
  }, [people]);

  // ─── Generate descriptive history log for a field change ───
  const generateLogDetail = async (field: string, oldVal: any, newVal: any): Promise<string | null> => {
    const fieldLabels: Record<string, string> = {
      title: 'Tiêu đề', description: 'Mô tả', status_id: 'Trạng thái',
      priority: 'Ưu tiên', start_date: 'Ngày bắt đầu', due_date: 'Deadline',
      assignees: 'Người thực hiện', supporters: 'Người phối hợp',
      watchers: 'Người theo dõi', approvers: 'Người phê duyệt', tags: 'Tags',
    };
    const label = fieldLabels[field] || field;

    let detail = '';

    if (['assignees', 'supporters', 'watchers', 'approvers'].includes(field)) {
       const oldArr = Array.isArray(oldVal) ? oldVal : (oldVal ? [oldVal] : []);
       const newArr = Array.isArray(newVal) ? newVal : (newVal ? [newVal] : []);
       const allIds = [...new Set([...oldArr, ...newArr])].filter(Boolean);
       
       // fetch missing profiles directly
       const missingIds = allIds.filter(id => !people[id] || people[id].name.includes('...'));
       if (missingIds.length > 0) {
         try {
           const { dataClient } = await import('../../lib/dataClient');
           const { data: emps } = await dataClient.from('employees').select('id, name').in('id', missingIds);
           if (emps) {
             emps.forEach((e: any) => {
               people[e.id] = { id: e.id, name: e.name || e.id.substring(0,8) + '...' };
             });
           }
         } catch { /* ignore */ }
       }

       const getNamesStr = (ids: any) => {
         const arr = Array.isArray(ids) ? ids : (ids ? [ids] : []);
         return arr.map(id => people[id]?.name || id.substring(0,8)).join(', ') || 'Không có';
       };

       const oldStr = getNamesStr(oldVal);
       const newStr = getNamesStr(newVal);
       if (oldStr === newStr) return null;
       detail = `từ "${oldStr}" sang "${newStr}"`;
    } 
    else if (field === 'status_id') {
       const oldName = statuses.find(s => s.id === oldVal)?.name || 'Trống';
       const newName = statuses.find(s => s.id === newVal)?.name || 'Trống';
       if (oldName === newName) return null;
       detail = `từ "${oldName}" sang "${newName}"`;
    } 
    else if (field === 'priority') {
       const clean = (s: string) => s?.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim() || '';
       const oldName = clean(PRIORITIES.find(p => p.value === oldVal)?.label || 'Trống');
       const newName = clean(PRIORITIES.find(p => p.value === newVal)?.label || 'Trống');
       if (oldName === newName) return null;
       detail = `từ "${oldName}" sang "${newName}"`;
    } 
    else if (field === 'start_date' || field === 'due_date') {
       const oldDate = oldVal ? formatDate(oldVal) : 'Trống';
       const newDate = newVal ? formatDate(newVal) : 'Trống';
       if (oldDate === newDate) return null;
       detail = `từ "${oldDate}" sang "${newDate}"`;
    } 
    else if (field === 'tags') {
       const oldTags = (Array.isArray(oldVal) ? oldVal : []).join(', ') || 'Không có';
       const newTags = (Array.isArray(newVal) ? newVal : []).join(', ') || 'Không có';
       if (oldTags === newTags) return null;
       detail = `từ "${oldTags}" sang "${newTags}"`;
    } 
    else if (['title', 'description'].includes(field)) {
       const truncate = (s: any) => {
         const str = typeof s === 'string' ? s : '';
         if (!str) return 'Trống';
         return str.length > 50 ? str.substring(0, 47) + '...' : str;
       };
       const oldStr = truncate(oldVal);
       const newStr = truncate(newVal);
       if (oldStr === newStr) return null;
       detail = `từ "${oldStr}" sang "${newStr}"`;
    }
    else {
      return null;
    }
    
    return `Đã thay đổi ${label} ${detail}`.trim();
  };

  // ─── Save all pending changes at once ───
  const handleSaveAll = async () => {
    if (!task || !isDirty) return;
    setSaving(true);
    try {
      // Create system log entries for each changed field
      const logParts: string[] = [];
      for (const [field, newVal] of Object.entries(pendingChanges)) {
        const oldVal = (originalTaskRef.current as any)?.[field];
        const logContent = await generateLogDetail(field, oldVal, newVal);
        if (logContent) logParts.push(logContent);
      }
      if (logParts.length > 0 && currentUserId) {
        try {
          await DiscussionService.add({
            entity_type: 'task',
            entity_id: task.id,
            user_id: currentUserId,
            content: logParts.join(' \u2022 '),
            comment_type: 'system',
          });
        } catch { /* fire-and-forget */ }
      }

      await TaskService.update(task.id, pendingChanges);
      setPendingChanges({});
      toast.success('Đã lưu thay đổi');
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi lưu: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await TaskService.delete(task.id);
      toast.success('Đã xóa công việc');
      setIsDeleteDialogOpen(false);
      setSaving(false);
      onUpdate?.();
      onClose?.();
    } catch (err: any) {
      toast.error('Lỗi xóa công việc: ' + (err.message || err));
      setIsDeleteDialogOpen(false);
      setSaving(false);
    }
  };

  // ─── Discard all pending changes ───
  const handleDiscardChanges = () => {
    setPendingChanges({});
    loadTask(); // reload from DB
  };

  // ─── Immediate save (for actions that must take effect now) ───
  const handleImmediateUpdate = async (field: string, value: any) => {
    if (!task) return;
    try {
      await TaskService.update(task.id, { [field]: value });
      
      if (currentUserId) {
        try {
          const oldVal = (originalTaskRef.current as any)?.[field];
          const logContent = await generateLogDetail(field, oldVal, value);
          if (logContent) {
            await DiscussionService.add({
              entity_type: 'task',
              entity_id: task.id,
              user_id: currentUserId,
              content: logContent,
              comment_type: 'system',
            });
          }
        } catch { /* fire-and-forget */ }
      }
      
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || err));
    }
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task?.title) bufferChange('title', editTitle.trim());
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editDescription !== task?.description) bufferChange('description', editDescription);
    setIsEditingDesc(false);
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    // If task has approvers and user is NOT an approver → should use submitForApproval instead
    if (task.approvers?.length > 0 && currentUserId && !task.approvers.includes(currentUserId) && !task.status?.is_done) {
      toast.error('Task có người phê duyệt. Vui lòng bấm "Gửi phê duyệt" thay vì "Hoàn thành".');
      return;
    }
    try {
      if (task.status?.is_done) {
        const defaultId = await TaskService.getDefaultStatusId();
        if (defaultId) {
          await TaskService.update(task.id, { status_id: defaultId, completed_at: undefined, completed_by: undefined, approval_status: undefined } as any);
          if (currentUserId) {
            try {
              const oldVal = task.status_id;
              const logContent = await generateLogDetail('status_id', oldVal, defaultId);
              if (logContent) {
                await DiscussionService.add({
                  entity_type: 'task', entity_id: task.id, user_id: currentUserId,
                  content: logContent, comment_type: 'system'
                });
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        await TaskService.complete(task.id, currentUserId || '');
        if (currentUserId) {
          try {
            const oldVal = task.status_id;
            const doneStatus = statuses.find(s => s.is_done)?.id;
            if (doneStatus) {
              const logContent = await generateLogDetail('status_id', oldVal, doneStatus);
              if (logContent) {
                await DiscussionService.add({
                  entity_type: 'task', entity_id: task.id, user_id: currentUserId,
                  content: logContent, comment_type: 'system'
                });
              }
            } else {
              await DiscussionService.add({
                entity_type: 'task', entity_id: task.id, user_id: currentUserId,
                content: 'Đã hoàn thành công việc', comment_type: 'system'
              });
            }
          } catch { /* ignore */ }
        }
      }
      setPendingChanges({});
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || err));
    }
  };

  // ─── Approval Workflow Handlers ───
  const handleSubmitForApproval = async () => {
    if (!task || !currentUserId) return;
    setApprovalLoading(true);
    try {
      await TaskService.submitForApproval(task.id, currentUserId);
      toast.success('Đã gửi yêu cầu phê duyệt');
      setPendingChanges({});
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || err));
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveTask = async () => {
    if (!task || !currentUserId) return;
    setApprovalLoading(true);
    try {
      await TaskService.approveTask(task.id, currentUserId, approvalComment || undefined);
      toast.success('✅ Đã phê duyệt thành công');
      setShowApproveDialog(false);
      setApprovalComment('');
      setPendingChanges({});
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || err));
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectApproval = async () => {
    if (!task || !currentUserId || !rejectReason.trim()) return;
    setApprovalLoading(true);
    try {
      await TaskService.rejectApproval(task.id, currentUserId, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setShowRejectDialog(false);
      setRejectReason('');
      setPendingChanges({});
      loadTask();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || err));
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!task) return;
    const inProgressStatus = statuses.find(s => s.name === 'Đang tiến hành' || s.name === 'Đang thực hiện');
    if (inProgressStatus) {
      await handleImmediateUpdate('status_id', inProgressStatus.id);
      if (!task.start_date) await handleImmediateUpdate('start_date', new Date().toISOString().split('T')[0]);
    }
  };

  // Checklist handlers (save immediately — checklist is separate UX)
  const saveChecklist = async (items: ChecklistItem[]) => {
    setChecklist(items);
    if (!task) return;
    try {
      await TaskService.update(task.id, { custom_fields: { ...task.custom_fields, checklist: items } });
    } catch (err: any) {
      toast.error('Lỗi lưu checklist: ' + (err.message || err));
    }
  };

  const getPersonInfo = (id: string): PersonInfo => people[id] || { id, name: id.substring(0, 8) + '...' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return <div className="text-center py-16 text-slate-400 dark:text-slate-500">Không tìm thấy công việc</div>;
  }

  const isDone = task.status?.is_done || statuses.find(s => s.id === task.status_id)?.is_done;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;
  const currentStatus = statuses.find(s => s.id === task.status_id);
  const currentPriority = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[2];
  const isInProgress = currentStatus?.name === 'Đang tiến hành' || currentStatus?.name === 'Đang thực hiện';
  const hasPastStartDate = !!(task.start_date && task.start_date <= new Date().toISOString().split('T')[0]);
  const overdueDays = isOverdue ? Math.ceil((Date.now() - new Date(task.due_date!).getTime()) / 86400000) : 0;

  // Approval state derivations
  const hasApprovalSteps = ((task.custom_fields?.approval_steps as ApprovalStep[] | undefined)?.length ?? 0) > 0;
  const hasApprovers = task.approvers?.length > 0 || hasApprovalSteps;
  const isApprovalSubtask = !!task.approval_parent_id;
  const isPendingApproval = task.approval_status === 'pending';
  const isCurrentUserApprover = currentUserId ? task.approvers?.includes(currentUserId) : false;
  const isCurrentUserAssignee = currentUserId ? task.assignees?.includes(currentUserId) : false;
  const canSubmitForApproval = hasApprovers && !isDone && !isPendingApproval && !isApprovalSubtask;
  const canApproveOrReject = isApprovalSubtask && isPendingApproval && currentUserId && task.assignees?.includes(currentUserId);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* ─── Header ─── */}
      <SlidePanelHeader>
        <div className="flex items-center gap-3 w-full">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer
              ${isDone
                ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
          >
            {isDone && <CheckSquare size={16} className="text-white" />}
          </button>

          {/* Title (editable) */}
          <div className="flex-1 min-w-0 pr-4">
            {isEditingTitle ? (
              <input
                autoFocus value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setEditTitle(task.title); setIsEditingTitle(false); } }}
              className="w-full text-xl font-black bg-transparent border-b-2 border-indigo-500 outline-none text-slate-900 dark:text-slate-100 pb-1"
            />
          ) : (
            <h2
              onClick={() => setIsEditingTitle(true)}
              className={`text-xl font-black cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Approval subtask buttons */}
          {canApproveOrReject && (
            <>
              <button
                onClick={() => setShowApproveDialog(true)}
                disabled={approvalLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> PHÊ DUYỆT
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={approvalLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <XCircle size={14} /> TỪ CHỐI
              </button>
            </>
          )}

          {/* Normal task buttons (non-approval subtask) */}
          {!isApprovalSubtask && (
            <>
              {!isDone && !isInProgress && !hasPastStartDate && !isPendingApproval && (
                <button onClick={handleStartTask} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
                  <Play size={14} /> BẮT ĐẦU
                </button>
              )}

              {/* Task has approvers → show "Gửi phê duyệt" instead of "Hoàn thành" */}
              {canSubmitForApproval && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={approvalLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send size={14} /> {approvalLoading ? 'ĐANG GỬI...' : 'GỬI PHÊ DUYỆT'}
                </button>
              )}

              {/* Task without approvers → normal complete */}
              {!hasApprovers && !isDone && (
                <button onClick={handleToggleComplete} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm">
                  <CheckCircle2 size={14} /> HOÀN THÀNH
                </button>
              )}

              {/* Pending approval badge */}
              {isPendingApproval && !isDone && (
                <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                  <Clock size={14} /> CHỜ PHÊ DUYỆT
                </span>
              )}

              {isDone && (
                <button onClick={handleToggleComplete} className="flex items-center gap-1.5 px-4 py-2 bg-slate-500 text-white text-sm font-bold rounded-lg hover:bg-slate-600 transition-colors cursor-pointer shadow-sm">
                  <RotateCcw size={14} /> MỞ LẠI
                </button>
              )}
            </>
          )}
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
            className="flex items-center justify-center w-9 h-9 ml-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
            title="Xóa công việc"
          >
            <Trash2 size={16} />
          </button>
          
          {task.action_type && task.action_label && !isApprovalSubtask && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (task.action_config && typeof task.action_config === 'object' && 'url' in task.action_config) {
                  window.location.href = task.action_config.url as string;
                } else {
                  window.dispatchEvent(new CustomEvent('task-action', { 
                    detail: { 
                      task,
                      actionType: task.action_type,
                      entityId: task.source_entity_id,
                      entityType: task.source_module
                    }
                  }));
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm ml-2"
            >
              <ExternalLink size={14} /> {task.action_label}
            </button>
          )}
        </div>
        </div>
      </SlidePanelHeader>

      {/* ─── Floating save bar (when dirty) ─── */}
      {isDirty && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
            Bạn có thay đổi chưa lưu
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}

      {/* ─── 2-Column Body ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT COLUMN (Main Content) ═══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Source badge */}
          {(task.source_module || task.auto_generated) && (
            <div className="flex items-center gap-2 px-5 pt-4">
              {task.source_module && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full font-semibold">
                  {task.source_module}
                </span>
              )}
              {task.auto_generated && (
                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full font-semibold">
                  Tự tạo
                </span>
              )}
            </div>
          )}

          {/* ─── Tab bar ─── */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 flex-shrink-0">
            {[
              { id: 'detail' as const, label: 'Chi tiết', icon: <Edit3 size={14} /> },
              { id: 'subtasks' as const, label: 'Việc con', icon: <Network size={14} /> },
              { id: 'attachments' as const, label: 'Tệp đính kèm', icon: <Paperclip size={14} /> },
              { id: 'approval' as const, label: 'Phê duyệt', icon: <ShieldCheck size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBottomTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer
                  ${bottomTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Tab content (scrollable) ─── */}
          <div className="flex-1 overflow-y-auto">
            {/* CHI TIẾT */}
            {bottomTab === 'detail' && (
              <TaskInfoTab
                task={task}
                taskId={taskId}
                currentUserId={currentUserId}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editProgressNote={editProgressNote}
                setEditProgressNote={setEditProgressNote}
                bufferChange={bufferChange}
                checklist={checklist}
                saveChecklist={saveChecklist}
                personalTags={personalTags}
                setPersonalTags={setPersonalTags}
              />
            )}
            {/* CÔNG VIỆC CON */}
            {bottomTab === 'subtasks' && (
              <TaskSubtasksTab parentTask={task} onSelectTask={(subId) => openEntityPanel('tasks', subId)} />
            )}

            {/* TRAO ĐỔI */}
            {bottomTab === 'comments' && (
              <TaskCommentsTab taskId={taskId} />
            )}

            {/* LỊCH SỬ */}
            {bottomTab === 'history' && (
              <HistoryTab taskId={taskId} logs={historyLogs} setLogs={setHistoryLogs} />
            )}

            {/* LIÊN KẾT */}
            {bottomTab === 'links' && (
              <TaskLinksTab
                task={task}
                links={links}
                setLinks={setLinks}
                profile={profile}
                bufferChange={bufferChange}
              />
            )}
            {/* THỜI GIAN */}
            {bottomTab === 'time' && (
              <TaskTimeTab task={task} currentUserId={currentUserId || profile?.id || ''} />
            )}

            {/* TỆP ĐÍNH KÈM */}
            {bottomTab === 'attachments' && (
              <TaskAttachmentTab
                taskId={task.id}
                currentUserId={currentUserId || profile?.id || ''}
              />
            )}

            {/* PHÊ DUYỆT */}
            {bottomTab === 'approval' && (
              <TaskApprovalTab
                task={task}
                currentUserId={currentUserId || profile?.id || ''}
                onUpdate={loadTask}
              />
            )}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN (Sidebar) ═══ */}
        <TaskSidebar
          task={task}
          statuses={statuses}
          onUpdate={loadTask}
          currentStatus={currentStatus}
          currentPriority={currentPriority}
          isOverdue={!!isOverdue}
          overdueDays={overdueDays}
          openPicker={openPicker}
          setOpenPicker={setOpenPicker}
          bufferChange={bufferChange}
          getPersonInfo={getPersonInfo}
          ensurePeopleLoaded={ensurePeopleLoaded}
          editingStepLevel={editingStepLevel}
          setEditingStepLevel={setEditingStepLevel}
          isPendingApproval={isPendingApproval}
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTask}
        title="Xóa công việc"
        message="Bạn có chắc chắn muốn xóa công việc này không? Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn."
        variant="danger"
        confirmText="Xóa"
        isLoading={saving}
      />

      {/* ─── Approve Dialog ─── */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40" onClick={() => setShowApproveDialog(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Phê duyệt công việc
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Bạn xác nhận phê duyệt công việc này?</p>
            <textarea
              value={approvalComment}
              onChange={e => setApprovalComment(e.target.value)}
              placeholder="Ghi chú (không bắt buộc)..."
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowApproveDialog(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                Hủy
              </button>
              <button
                onClick={handleApproveTask}
                disabled={approvalLoading}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> {approvalLoading ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Dialog ─── */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40" onClick={() => setShowRejectDialog(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <XCircle size={20} className="text-red-500" /> Từ chối phê duyệt
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Vui lòng nhập lý do từ chối.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối (bắt buộc)..."
              rows={3}
              autoFocus
              className="w-full text-sm p-3 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
                Hủy
              </button>
              <button
                onClick={handleRejectApproval}
                disabled={approvalLoading || !rejectReason.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle size={14} /> {approvalLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPanel;
