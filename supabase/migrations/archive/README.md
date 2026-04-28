# Migration Archive

Thư mục này chứa **120 migration files lịch sử** (2026-01-27 → 2026-04-27) đã được
squash vào `supabase/seed.sql` (baseline) ngày 2026-04-28.

## Tại sao archive?

- 120 migrations replay ~2-3 phút mỗi lần dev reset môi trường
- Sau squash, dev/staging dùng `seed.sql` → reset xong trong <20 giây
- Production DB **KHÔNG bị ảnh hưởng** — Supabase vẫn track đầy đủ migration history
  trong table `supabase_migrations.schema_migrations`

## Những gì đã được archive

| Khoảng thời gian | Files | Nội dung chính |
|---|---|---|
| 2026-01-27 → 2026-01-31 | 30 | Initial schema, RBAC, audit logs, units |
| 2026-02-01 → 2026-02-28 | 18 | Permissions, BIM, drive, CRM, HRM basics |
| 2026-03-01 → 2026-03-31 | 25 | Chat, notifications, tasks v1, projects, search |
| 2026-04-01 → 2026-04-27 | 47 | AI agents, HRM full, CMS, corporate web, task v2 |

## Tìm lại lịch sử một table cụ thể

```bash
grep -rl "contracts" supabase/migrations/archive/
```

## KHÔNG xóa thư mục này

Các files này cần cho:
1. Audit trail / compliance
2. Tìm context khi debug production issues
3. Recreate từng bước nếu cần forensic analysis
