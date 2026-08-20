# Dashboard Performance Optimizations

## Applied Optimizations

### 1. React Query Caching
**File:** `app/providers.tsx`
- `staleTime: 5m`, `gcTime: 10m`, `retry: 1`
- Disabled refetch on window focus / mount / reconnect
- React Query Devtools only in development

### 2. Component Cache Tuning
- Agent / student dashboard queries: 1–5 minute `staleTime`
- University overview: 2 minute `staleTime` with server `initialData`

### 3. HTTP Cache-Control
- `/api/application`, `/api/dashboard/stats`, `/api/offer`
- `private, max-age=…, stale-while-revalidate=…`

### 4. Application List API (largest win)
**File:** `lib/application/list.ts`
- Parallel filter resolution (agent students, degree, search, university scope)
- Parallel stats + list query
- Parallel enrich: student codes, offers, documents, courses
- Parallel rejection history with course attach
- Lean course select (no full program blob / level join)
- Skip 3 stats count queries for dashboard recent lists (`limit` without `page`)

### 5. Offers API
**File:** `lib/offer/list.ts`
- Student offers filtered by `application.profile_id` in DB (no full-table pull)

### 6. Programs API
**File:** `app/api/program/route.ts`
- Count + page fetch run in parallel

### 7. Dashboard Client Fetches
- Student offers use `limit` / `page` instead of loading all then slicing
- Search debounce 300ms

### 8. Next.js Config
- Compression, strip `X-Powered-By`, production `removeConsole`, image formats

## Not Changed
- No new features / UI redesign
- Existing behavior and response shapes preserved
