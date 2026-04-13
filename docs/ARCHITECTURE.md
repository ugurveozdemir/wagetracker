# Architecture

## High-Level Overview

- The current runtime is split across two applications in one repository: `Wagetracker.API` and `Wagetracker.Mobile`.
- `Wagetracker.API` is an ASP.NET Core Web API (`net9.0`) that owns authentication, persistence, weekly/overtime calculations, and dashboard aggregation.
- `Wagetracker.Mobile` is an Expo/React Native TypeScript client that calls the API over HTTP and keeps client state in Zustand stores.
- The root `Wagetracker.sln` includes only the API project. The mobile app is a separate Node/Expo workspace beside it.
- The implemented data model is small and relational: `User` owns `Job`, `DailyEntry`, and `Expense` records. `DailyEntry` also stores `JobId` and a denormalized `UserId`.
- There is no repository layer, mediator, message bus, background worker, or separate read-model layer. Business logic lives in service classes that query `AppDbContext` directly.

## Main Folders / Modules

- `Wagetracker.API/Program.cs`: application composition, DI registration, JWT auth, CORS, Swagger, health endpoint, and a startup SQL compatibility patch.
- `Wagetracker.API/Controllers`: HTTP endpoints. Protected controllers use `[Authorize]`, read `ClaimTypes.NameIdentifier`, and translate service exceptions into HTTP responses.
- `Wagetracker.API/Services`: business logic plus direct EF Core access. `DashboardService`, `IProfileService`, and `IDashboardService` currently live here rather than in separate feature folders.
- `Wagetracker.API/Data/AppDbContext.cs`: EF Core context, table mapping, indexes, relationships, and PostgreSQL-specific configuration.
- `Wagetracker.API/Models/Entities`: persisted entities: `User`, `Job`, `DailyEntry`, `Expense`.
- `Wagetracker.API/Models/DTOs/DTOs.cs`: request/response contracts for all API features in one file.
- `Wagetracker.API/Utilities`: date/week and overtime calculation helpers.
- `Wagetracker.API/Migrations`: EF Core migrations for the current schema.
- `Wagetracker.Mobile/src/api`: axios client plus thin resource wrappers for auth, jobs, entries, dashboard, expenses, and profile.
- `Wagetracker.Mobile/src/stores`: Zustand stores for auth, jobs/dashboard, entries, and expenses.
- `Wagetracker.Mobile/src/navigation`: auth stack vs authenticated tab navigation, nested stacks, and modal orchestration for add flows.
- `Wagetracker.Mobile/src/screens`: screen-level UI and fetch-on-focus behavior.
- `Wagetracker.Mobile/src/components`: modal forms and shared UI components.
- `Wagetracker.Mobile/src/theme`: shared colors, spacing, and responsive helpers.
- `Wagetracker.Mobile/src/types`: TypeScript API contracts and navigation param types.
- `database/migrations`: standalone SQL migration scripts present in the repo, but not referenced by the running API.
- `reference_project`, `new_reference`, `docs`, `changelogs`: support/reference material, not part of the current runtime path.

## Layer Responsibilities

### API

- Controllers handle routing, auth requirements, claim extraction, and HTTP status mapping.
- Services implement feature behavior and issue EF Core queries directly.
- `AppDbContext` defines schema details, foreign keys, cascade delete behavior, and indexes.
- DTOs are the API boundary model used by controllers and services.
- Utility classes encapsulate week-boundary and overtime calculations.

### Mobile

- API modules are thin HTTP wrappers around backend endpoints.
- Zustand stores own client-side async state and mutation orchestration.
- Screens trigger fetches with `useFocusEffect` and render store data.
- Modals perform create/update actions and call store methods.
- Shared theme helpers provide responsive spacing, radii, and color tokens.

## Request / Data Flow

1. App startup enters `App.tsx`, mounts `AppNavigator`, and calls `useAuthStore.checkAuth()`.
2. Auth state uses `expo-secure-store` on native and `localStorage` on web through `src/api/client.ts`.
3. Login/register goes through `authStore` -> `authApi` -> `/api/auth/*` -> `AuthService`.
4. `AuthService` hashes passwords with BCrypt, reads/writes the `Users` table through EF Core, and returns a JWT plus `UserDto`.
5. The axios request interceptor adds `Authorization: Bearer <token>` to later API calls.
6. Protected API requests hit a controller, which extracts `userId` from `ClaimTypes.NameIdentifier` and passes it into the relevant service.
7. Services query/update `AppDbContext`, map entities to DTOs, and return those DTOs to controllers.
8. Mobile stores update local state from the response; several mutations then trigger follow-up refetches instead of patching all dependent state locally.

### Feature-Specific Flows

- Jobs: `CreateJobModal` / `EditJobModal` -> `useJobsStore` -> `jobsApi` -> `JobsController` -> `JobService` -> `Jobs` table.
- Entries: `AddEntryModal` -> `useEntriesStore.createEntry()` -> `EntriesController` -> `DailyEntryService`. The service verifies job ownership, derives `TotalHours`, creates the row, then recalculates the affected week with `WeekCalculator` and `OvertimeCalculator` before the mobile app refreshes job details and dashboard data.
- Dashboard / overview: `useJobsStore.fetchDashboard()` calls `/api/dashboard/summary`. `DashboardService` loads the user's jobs, entries, expenses, and weekly goal, then computes totals and chart data on demand.
- Expenses: `AddExpenseModal` / expense screens -> `useExpenseStore` -> `ExpensesController` -> `ExpenseService` -> `Expenses` table. Weekly expense history is grouped on read.
- Receipt scan: `AddExpenseModal` uses `expo-image-picker` on native platforms to collect a receipt image, normalizes it to a compressed JPEG with `expo-image-manipulator`, posts it to `/api/expenses/receipt-scan`, receives an editable draft, then confirms the reviewed fields through `/api/expenses/receipt-scan/confirm`.
- Weekly goal: `GoalScreen` calls `profileApi.updateWeeklyGoal()` directly, not through a Zustand profile store. `ProfileService` updates `User.WeeklyGoalAmount`, and the screen then refetches dashboard data.

## Core Dependencies And Integrations

- Backend framework: ASP.NET Core Web API.
- Persistence: Entity Framework Core with `Npgsql.EntityFrameworkCore.PostgreSQL`.
- Database: PostgreSQL. The checked-in example/current configuration points at a Supabase-hosted Postgres instance.
- Authentication: JWT bearer auth in ASP.NET Core; tokens generated manually in `AuthService`.
- Password hashing: `BCrypt.Net-Next`.
- API documentation: Swashbuckle / Swagger in development.
- Mobile app runtime: Expo + React Native + TypeScript.
- Mobile navigation: `@react-navigation/native`, native stack, and bottom tabs.
- Mobile state: Zustand.
- Mobile HTTP client: Axios with a shared interceptor-based client.
- Mobile token storage: `expo-secure-store` on native, browser storage on web.
- Mobile UX support: `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-toast-message`, `@react-native-community/datetimepicker`, and `react-native-vector-icons`.
- Mobile receipt image selection and compression: `expo-image-picker` plus `expo-image-manipulator`.
- AI receipt extraction: backend-only Google Gemini API calls configured through `ReceiptScan:*`; mobile does not hold provider secrets.

## Important Existing Constraints / Patterns

- User scoping is enforced explicitly in service queries with `userId` filters; there is no central multi-tenant filter.
- Controllers each implement their own `GetUserId()` helper instead of sharing a base controller or middleware abstraction.
- Validation is split between DataAnnotations on DTOs and ad hoc checks in services/screens. `FluentValidation.AspNetCore` is referenced but no validators are implemented.
- Error handling is local to controllers via `try/catch`; there is no global exception middleware or problem-details pipeline.
- Most aggregates are calculated at read time after materializing rows into memory. There is no cache, projection table, or reporting-specific query layer.
- `GetUserJobsAsync()` maps each job by separately loading its entries. Dashboard aggregation also loads all user entries and expenses before summing them.
- Weekly logic is not fully uniform across features. Job entry grouping and overtime use each job's `FirstDayOfWeek`, while dashboard metrics, goal progress, and expense history use Monday-start weeks.
- `DailyEntry` stores `HourlyRateSnapshot`, but weekly recalculation currently uses the parent job's current hourly rate when recomputing `TotalEarnings`.
- Startup includes a direct SQL patch that adds `Users.WeeklyGoalAmount` if missing, so schema compatibility is partly handled outside normal EF migrations.
- CORS is environment-dependent: development allows any origin; production reads configured origins but falls back to allow-any if none are configured.
- Backend configuration is file-based via `appsettings*.json`. In the current implementation, runtime DB/JWT settings are present in `appsettings.json` rather than injected only from external secret storage.
- Mobile data refresh is screen-focus-based and mutation-triggered; there is no query cache library such as React Query.
- The navigation shell uses a custom tab bar with a floating action button that opens modal forms rather than dedicated create screens.
- Receipt scan does not persist uploaded images in the current implementation. `ReceiptImageUrl` remains available on expense responses, but V1 scanned expenses save it as `null`.

## Unclear / Needs Confirmation

- `useAuthStore.checkAuth()` validates stored tokens by calling `GET /api/dashboard`, but the API currently exposes `GET /api/dashboard/summary`. If unchanged, persisted-session restoration will fail even when the token is still valid.
- Database schema ownership is split across EF Core migrations, standalone SQL files under `database/migrations`, and a startup `ALTER TABLE` patch. The intended source of truth for production schema changes is not fully unified in code.
