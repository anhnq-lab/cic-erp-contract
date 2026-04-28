# Supabase Migrations

## Cấu trúc

```
supabase/migrations/
├── README.md                              ← file này
├── archive/                              ← 120 migrations lịch sử (2026-01-27 → 2026-04-27)
│   └── README.md
├── 20260428000000_fix_rls_critical_tables.sql   ← migrations mới (từ 2026-04-28)
└── ...                                   ← migrations mới thêm vào đây
```

## Dev setup mới

```bash
# 1. Copy env
cp .env.example .env.local
# (điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY)

# 2. Reset DB (nếu dùng Supabase local dev)
supabase start
supabase db reset   # Load supabase/seed.sql + replay migrations mới

# 3. Hoặc link thẳng lên project staging
supabase link --project-ref <staging-project-id>
supabase db push
```

## Thêm migration mới

```bash
# Tạo file mới (timestamp tự động)
supabase migration new <tên_migration>

# Hoặc tạo thủ công:
# supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql
```

Xem hướng dẫn đặt tên và viết RLS: [CLAUDE.md § 4](../../CLAUDE.md#4-migration-sql)

## Regenerate seed.sql

Khi schema thay đổi nhiều, nên cập nhật `supabase/seed.sql`:

```bash
supabase db dump --project-ref jyohocjsnsyfgfsmjfqx --schema-only > supabase/seed.sql
```

## Migration archive

120 migrations cũ được lưu tại `archive/` để tham khảo lịch sử.
Xem [archive/README.md](archive/README.md) để biết thêm.
