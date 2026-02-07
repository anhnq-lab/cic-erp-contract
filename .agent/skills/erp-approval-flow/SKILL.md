---
name: erp-approval-flow
description: Design and implement multi-step approval workflows with role-based restrictions for CIC ERP contract and business plan approvals.
---

# ERP Approval Flow Skill

## When to use
When creating or modifying approval workflows for contracts, business plans, or any entity requiring multi-level authorization.

## Existing system context
- Workflow service: `services/workflowService.ts`
- Workflow components: `components/workflow/`
- Roles: Admin, NVKD, AdminUnit, UnitLeader, Accountant, ChiefAccountant, Legal, Leadership
- Review types: Unit → Finance → Legal → Board
- Types: `ContractReview`, `BusinessPlan`, `PlanStatus`, `ReviewRole`

## Role-based approval matrix

| Review Stage | Allowed Roles | Action |
|---|---|---|
| Unit Review | UnitLeader, AdminUnit | Approve/Reject at unit level |
| Finance Review | Accountant, ChiefAccountant | Approve financial aspects |
| Legal Review | Legal | Approve legal compliance |
| Board Review | Leadership | Final approval |

## Workflow patterns

### Sequential approval
```
Draft → Pending_Unit → Pending_Finance → Pending_Board → Approved
                ↘ Rejected (at any stage)
```

### Parallel approval (contracts)
```
Draft → Submitted
          ├→ Legal Review (Legal role only)
          └→ Finance Review (Accountant/ChiefAccountant only)
        Both approved → Pending_Board → Approved
```

## Implementation checklist
```
- [ ] Define states in types.ts (PlanStatus type)
- [ ] Add approval fields to entity (legal_approved, finance_approved)
- [ ] Create/update workflow service functions
- [ ] Build stepper UI component (components/workflow/)
- [ ] Add role validation in approval handlers
- [ ] Create Supabase migration for review tables
- [ ] Add RLS policies restricting by role
```

## Role validation pattern
```typescript
const canApprove = (userRole: UserRole, reviewStage: ReviewRole): boolean => {
  const roleMap: Record<ReviewRole, UserRole[]> = {
    Unit: ['UnitLeader', 'AdminUnit'],
    Finance: ['Accountant', 'ChiefAccountant'],
    Legal: ['Legal'],
    Board: ['Leadership'],
  };
  return roleMap[reviewStage]?.includes(userRole) ?? false;
};
```

## Stepper UI
Use the existing `ApprovalStepper` component in `components/workflow/`. It shows:
- Current stage with active indicator
- Completed stages with checkmarks
- Role badges for each stage
- Comment/reason input for rejection

## Database schema for reviews
```sql
-- contract_reviews table already exists
-- Key fields: contract_id, reviewer_id, role, action, comment, created_at
```

## Important rules
- Always validate role before allowing approval action
- Store reviewer ID and timestamp for audit trail
- Send notifications on status changes (future: Telegram integration)
- Rejected status should require a comment/reason
