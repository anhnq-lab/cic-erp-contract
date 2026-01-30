# Services Layer

## Architecture

All services use `dataClient` for data operations, which is an isolated Supabase client that doesn't depend on Auth state.

## Client Usage

| Client | Purpose | File |
|--------|---------|------|
| `dataClient` | Data operations (select, insert, update, delete, rpc) | `lib/dataClient.ts` |
| `supabase` | Auth operations only (login, logout, session) | `lib/supabase.ts` |

## Services

| Service | Table | Purpose |
|---------|-------|---------|
| `contractService` | contracts | CRUD + RPC for contract stats and charts |
| `unitService` | units | Business units management |
| `employeeService` | employees | Employee management with stats |
| `productService` | products | Product catalog |
| `customerService` | customers | Customer management |
| `paymentService` | payments | Payment tracking |
| `documentService` | contract_documents | Document upload/download |
| `workflowService` | - | PAKD approval workflow |
| `contextService` | - | AI context generation |

## Best Practices

1. **Always use `dataClient`** for data operations
2. **Never use `supabase`** in services (except auth-related)
3. **Map snake_case → camelCase** when returning data from DB
4. **Handle errors gracefully** with try/catch and fallbacks
