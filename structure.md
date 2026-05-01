# Project Structure

```text
fachhochschule-des-mittelstands/
├─ app/                        # Next.js App Router pages, layouts, route groups, API routes
│  ├─ (auth)/                  # Auth-related route group
│  ├─ (dashboard)/             # Dashboard route group
│  ├─ (onboarding)/            # Onboarding route group
│  ├─ api/                     # Server-side API routes (Supabase access belongs here)
│  ├─ auth/                    # Auth pages/routes
│  ├─ layout.tsx               # Root layout
│  ├─ providers.tsx            # App-level providers
│  └─ globals.css              # Global styles
├─ components/
│  ├─ shared/                  # Reusable shared feature components
│  ├─ ui/                      # ShadCN/UI primitives
│  ├─ auth-sidebar-wrapper.tsx
│  └─ SideBarContent.tsx
├─ lib/
│  ├─ hooks/                   # Data hooks orchestration (TanStack Query-based)
│  ├─ supabase/                # Supabase helper utilities (no client-side DB logic)
│  ├─ api.ts                   # API client/util wrappers
│  └─ utils.ts                 # Generic utilities
├─ types/
│  ├─ schemas/                 # Validation schemas (shared API + form validation)
│  ├─ db.ts                    # DB related type exports
│  ├─ supabase.ts              # Generated Supabase/database types
│  └─ index.ts                 # Centralized type exports
├─ supabase/
│  ├─ migrations/              # SQL migrations
│  └─ config.toml              # Supabase project config
├─ public/                     # Static assets
├─ .cursor/                    # Cursor rules/config
├─ .vscode/                    # Workspace editor settings
├─ next.config.ts              # Next.js configuration
├─ package.json                # Scripts + dependencies
├─ tsconfig.json               # TypeScript configuration
└─ README.md                   # Project documentation
```

## Placement Rules (Short)

- Keep business logic out of presentational UI components.
- Put reusable UI in `components/shared` and primitives in `components/ui`.
- Keep all API and backend behavior in `app/api`.
- Keep all schemas in `types/schemas`.
- Prefer generated DB/Supabase types from `types/supabase.ts`.
