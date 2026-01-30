# Lib - Core Utilities

## Supabase Clients

### dataClient.ts
**Isolated Supabase client for data operations.**

```typescript
import { dataClient } from '../lib/dataClient';

// All data operations use this
const { data } = await dataClient.from('contracts').select('*');
const { data } = await dataClient.rpc('get_contract_stats', params);
```

Features:
- No session persistence
- No auto token refresh  
- Not affected by Auth state
- Use for all Services

### supabase.ts
**Auth-bound Supabase client for authentication only.**

```typescript
import { supabase } from '../lib/supabase';

// ONLY for auth operations
await supabase.auth.signIn({ email, password });
await supabase.auth.signOut();
const { data: { session } } = await supabase.auth.getSession();
```

Features:
- Persists session to localStorage
- Auto-refreshes tokens
- Use ONLY in AuthContext

## Why Two Clients?

| Scenario | Old (Single Client) | New (Dual Client) |
|----------|---------------------|-------------------|
| Auth loading | Data fetching blocked | Data loads immediately |
| Token expired | RPC hangs | dataClient unaffected |
| Page reload | Race condition | Predictable behavior |
