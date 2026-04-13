# API

## Overview

- Runtime API surface is implemented by ASP.NET Core controllers plus one minimal `/health` endpoint.
- Controller routes are unversioned and use the pattern `/api/[controller]`.
- `Program.cs` configures JWT bearer authentication. Every controller except `AuthController` is marked with `[Authorize]`.
- Protected endpoints scope data to the current user by reading `ClaimTypes.NameIdentifier` from the JWT.
- DTO shapes below are taken from server code. `Program.cs` does not configure custom JSON converters, so exact serialization of `DateTime`, `TimeSpan`, and enum values follows default ASP.NET Core `System.Text.Json` behavior.
- No query-string parameters were found in controller actions.

## Authentication

### Shared Shapes

```csharp
RegisterRequest {
  string Email
  string Password
  string FullName
}

LoginRequest {
  string Email
  string Password
}

UserDto {
  int Id
  string Email
  string FullName
  decimal? WeeklyGoalAmount
}

AuthResponse {
  string Token
  UserDto User
}
```

### POST `/api/auth/register`

- Method: `POST`
- Route: `/api/auth/register`
- Purpose: Register a new user account and immediately issue a JWT.
- Auth: none
- Request body: `RegisterRequest`
- Response shape: `AuthResponse`
- Visible status handling: `200 OK`; explicit `400 Bad Request` with `{ message: string }` when the email already exists.

### POST `/api/auth/login`

- Method: `POST`
- Route: `/api/auth/login`
- Purpose: Authenticate an existing user and issue a JWT.
- Auth: none
- Request body: `LoginRequest`
- Response shape: `AuthResponse`
- Visible status handling: `200 OK`; explicit `401 Unauthorized` with `{ message: string }` for invalid credentials.

## Jobs

### Shared Shapes

```csharp
CreateJobRequest {
  string Title
  decimal HourlyRate
  DayOfWeek FirstDayOfWeek
}

UpdateJobRequest {
  string Title
  decimal HourlyRate
  DayOfWeek FirstDayOfWeek
}

JobResponse {
  int Id
  string Title
  decimal HourlyRate
  DayOfWeek FirstDayOfWeek
  decimal TotalEarnings
  decimal TotalHours
  DateTime CreatedAt
}
```

### GET `/api/jobs`

- Method: `GET`
- Route: `/api/jobs`
- Purpose: List the current user's jobs.
- Auth: JWT bearer required
- Request params: none
- Response shape: `List<JobResponse>`
- Visible status handling: `200 OK`

### GET `/api/jobs/{id}`

- Method: `GET`
- Route: `/api/jobs/{id}`
- Purpose: Fetch one job owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: `JobResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

### POST `/api/jobs`

- Method: `POST`
- Route: `/api/jobs`
- Purpose: Create a job for the current user.
- Auth: JWT bearer required
- Request body: `CreateJobRequest`
- Response shape: `JobResponse`
- Visible status handling: `201 Created`

### PUT `/api/jobs/{id}`

- Method: `PUT`
- Route: `/api/jobs/{id}`
- Purpose: Update an existing job owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Request body: `UpdateJobRequest`
- Response shape: `JobResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

### DELETE `/api/jobs/{id}`

- Method: `DELETE`
- Route: `/api/jobs/{id}`
- Purpose: Delete an existing job owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: no body
- Visible status handling: `204 No Content`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

## Entries

### Shared Shapes

```csharp
CreateEntryRequest {
  int JobId
  DateTime Date
  TimeSpan? StartTime
  TimeSpan? EndTime
  decimal? TotalHours
  decimal Tip
  string? Note
}

UpdateEntryRequest {
  DateTime Date
  TimeSpan? StartTime
  TimeSpan? EndTime
  decimal? TotalHours
  decimal Tip
  string? Note
}

EntryResponse {
  int Id
  int JobId
  DateTime Date
  string DayOfWeek
  int DayOfMonth
  TimeSpan? StartTime
  TimeSpan? EndTime
  decimal TotalHours
  decimal HourlyRateSnapshot
  decimal TotalEarnings
  decimal Tip
  string? Note
  decimal OvertimeHours
  bool HasOvertime
  DateTime CreatedAt
}

WeeklyGroupResponse {
  string WeekStart
  string WeekEnd
  decimal TotalHours
  decimal RegularHours
  decimal OvertimeHours
  decimal TotalEarnings
  decimal OvertimeBonus
  List<EntryResponse> Entries
}

JobDetailsResponse {
  JobResponse Job
  List<WeeklyGroupResponse> Weeks
}
```

### GET `/api/entries`

- Method: `GET`
- Route: `/api/entries`
- Purpose: List all entries for the current user.
- Auth: JWT bearer required
- Request params: none
- Response shape: `List<EntryResponse>`
- Visible status handling: `200 OK`

### GET `/api/entries/{id}`

- Method: `GET`
- Route: `/api/entries/{id}`
- Purpose: Fetch one entry owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: `EntryResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

### GET `/api/entries/job/{jobId}/weekly`

- Method: `GET`
- Route: `/api/entries/job/{jobId}/weekly`
- Purpose: Fetch one job plus its entries grouped into custom weeks based on that job's `FirstDayOfWeek`.
- Auth: JWT bearer required
- Request params: path param `jobId: int`
- Response shape: `JobDetailsResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: string }` when the job is missing or not owned by the user.

### POST `/api/entries`

- Method: `POST`
- Route: `/api/entries`
- Purpose: Create a work entry for one of the current user's jobs.
- Auth: JWT bearer required
- Request body: `CreateEntryRequest`
- Request constraints visible in service code: either `TotalHours` must be provided, or both `StartTime` and `EndTime` must be provided.
- Response shape: `EntryResponse`
- Visible status handling: `201 Created`; explicit `400 Bad Request` with `{ message: string }` for invalid hour input; explicit `404 Not Found` with `{ message: string }` when the job is missing or not owned by the user.

### PUT `/api/entries/{id}`

- Method: `PUT`
- Route: `/api/entries/{id}`
- Purpose: Update an existing entry owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Request body: `UpdateEntryRequest`
- Request constraints visible in service code: either `TotalHours` must be provided, or both `StartTime` and `EndTime` must be provided.
- Response shape: `EntryResponse`
- Visible status handling: `200 OK`; explicit `400 Bad Request` with `{ message: string }`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

### DELETE `/api/entries/{id}`

- Method: `DELETE`
- Route: `/api/entries/{id}`
- Purpose: Delete an existing entry owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: no body
- Visible status handling: `204 No Content`; explicit `404 Not Found` with `{ message: string }` when missing or not owned by the user.

### Entry Notes From Current Implementation

- `EntryResponse.OvertimeHours` and `EntryResponse.HasOvertime` are currently filled as `0` and `false` in `DailyEntryService.MapToEntryResponse()`.
- Overtime is represented accurately at the weekly group level via `WeeklyGroupResponse` rather than per-entry response fields.

## Dashboard

### Shared Shapes

```csharp
DailyEarningsPointResponse {
  DateTime Date
  string DayLabel
  decimal TotalEarnings
}

WeeklyGoalStatusResponse {
  decimal? TargetAmount
  decimal CurrentAmount
  decimal RemainingAmount
  decimal ProgressPercent
  bool IsReached
  DateTime WeekStart
  DateTime WeekEnd
}

DashboardSummaryResponse {
  decimal TotalEarnings
  decimal TotalHours
  decimal TotalExpenses
  int ActiveJobsCount
  List<JobResponse> Jobs
  decimal WeeklyEarnings
  decimal WeeklyExpenses
  decimal WeeklyNet
  decimal WeeklyHours
  WeeklyGoalStatusResponse WeeklyGoal
  List<DailyEarningsPointResponse> DailyEarningsSinceMonday
  List<ExpenseResponse> RecentExpenses
}
```

### GET `/api/dashboard/summary`

- Method: `GET`
- Route: `/api/dashboard/summary`
- Purpose: Return dashboard and overview aggregates for the current user.
- Auth: JWT bearer required
- Request params: none
- Response shape: `DashboardSummaryResponse`
- Visible status handling: `200 OK`
- Implementation note: weekly dashboard calculations use a Monday-start week in `DashboardService`.

## Expenses

### Shared Shapes

```csharp
CreateExpenseRequest {
  decimal Amount
  int Category
  DateTime Date
  string? Description
}

ConfirmReceiptScanExpenseRequest {
  decimal Amount
  int Category
  DateTime Date
  string? Description
}

UpdateExpenseRequest {
  decimal Amount
  int Category
  DateTime Date
  string? Description
}

ExpenseResponse {
  int Id
  decimal Amount
  int Category
  string CategoryName
  DateTime Date
  string? Description
  string Source
  string? ReceiptImageUrl
  DateTime CreatedAt
}

ReceiptScanDraftResponse {
  decimal? Amount
  DateTime? Date
  int Category
  string? Description
  decimal Confidence
  List<string> Warnings
}

WeeklyExpenseGroupResponse {
  DateTime WeekStart
  DateTime WeekEnd
  decimal TotalAmount
  List<ExpenseResponse> Expenses
}
```

### Expense Category Values

```text
0 = FoodAndDrinks
1 = Transport
2 = Shopping
3 = BillsAndUtilities
4 = Entertainment
5 = Health
6 = Education
7 = Other
```

### GET `/api/expenses`

- Method: `GET`
- Route: `/api/expenses`
- Purpose: List all expenses for the current user.
- Auth: JWT bearer required
- Request params: none
- Response shape: `List<ExpenseResponse>`
- Visible status handling: `200 OK`

### GET `/api/expenses/weekly`

- Method: `GET`
- Route: `/api/expenses/weekly`
- Purpose: Return expense history grouped by Monday-start weeks.
- Auth: JWT bearer required
- Request params: none
- Response shape: `List<WeeklyExpenseGroupResponse>`
- Visible status handling: `200 OK`

### GET `/api/expenses/{id}`

- Method: `GET`
- Route: `/api/expenses/{id}`
- Purpose: Fetch one expense owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: `ExpenseResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: "Expense not found" }`.

### POST `/api/expenses`

- Method: `POST`
- Route: `/api/expenses`
- Purpose: Create a manual expense for the current user.
- Auth: JWT bearer required
- Request body: `CreateExpenseRequest`
- Response shape: `ExpenseResponse`
- Visible status handling: `201 Created`; explicit `400 Bad Request` with `{ message: string }` for invalid category input.

### POST `/api/expenses/receipt-scan`

- Method: `POST`
- Route: `/api/expenses/receipt-scan`
- Purpose: Analyze a receipt image and return an editable draft expense. This endpoint does not create an expense.
- Auth: JWT bearer required
- Request body: `multipart/form-data` with field `receiptImage`
- Supported image types: JPEG, PNG, WebP
- Default size limit: 5 MB, controlled by `ReceiptScan:MaxImageBytes`
- Mobile behavior: native clients resize receipt images to a maximum 1600 px longest side and upload JPEG at compressed quality before calling this endpoint.
- Response shape: `ReceiptScanDraftResponse`
- Visible status handling: `200 OK`; explicit `400 Bad Request` with `{ message: string }` for missing/invalid image input; explicit `403 Forbidden` for subscription access failures; explicit `503 Service Unavailable` when receipt scan provider config/call fails; explicit `504 Gateway Timeout` when provider scan times out.

### POST `/api/expenses/receipt-scan/confirm`

- Method: `POST`
- Route: `/api/expenses/receipt-scan/confirm`
- Purpose: Create an expense from user-reviewed receipt scan fields.
- Auth: JWT bearer required
- Request body: `ConfirmReceiptScanExpenseRequest`
- Response shape: `ExpenseResponse`
- Creation behavior: saves `Source = ReceiptScan` and `ReceiptImageUrl = null`.
- Visible status handling: `201 Created`; explicit `400 Bad Request` with `{ message: string }` for invalid category input; explicit `403 Forbidden` for subscription access failures.

### PUT `/api/expenses/{id}`

- Method: `PUT`
- Route: `/api/expenses/{id}`
- Purpose: Update an existing expense owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Request body: `UpdateExpenseRequest`
- Response shape: `ExpenseResponse`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: "Expense not found" }`; explicit `400 Bad Request` with `{ message: string }` for invalid category input.

### DELETE `/api/expenses/{id}`

- Method: `DELETE`
- Route: `/api/expenses/{id}`
- Purpose: Delete an existing expense owned by the current user.
- Auth: JWT bearer required
- Request params: path param `id: int`
- Response shape: no body
- Visible status handling: `204 No Content`; explicit `404 Not Found` with `{ message: "Expense not found" }`.

## Profile

### Shared Shapes

```csharp
UpdateWeeklyGoalRequest {
  decimal? TargetAmount
}
```

### PUT `/api/profile/weekly-goal`

- Method: `PUT`
- Route: `/api/profile/weekly-goal`
- Purpose: Set or clear the current user's weekly goal amount.
- Auth: JWT bearer required
- Request body: `UpdateWeeklyGoalRequest`
- Response shape: `UserDto`
- Visible status handling: `200 OK`; explicit `404 Not Found` with `{ message: string }` if the user record is missing.

## System

### GET `/health`

- Method: `GET`
- Route: `/health`
- Purpose: Basic health endpoint mapped directly in `Program.cs`.
- Auth: none
- Request params: none
- Response shape:

```text
{
  status: "healthy",
  timestamp: DateTime
}
```

- Visible status handling: `200 OK`

## Unclear / Needs Confirmation

- Exact serialized JSON format for `DateTime`, `TimeSpan`, and `DayOfWeek` values is not documented in the code; no custom serializer configuration was found.
- DTO validation attributes are present, and controllers use `[ApiController]`, but automatic model-validation error payloads are not customized. Only explicit controller-level error bodies can be stated confidently here.
