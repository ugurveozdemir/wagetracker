# Features

## Completed

- Authentication
  - `register` and `login` are implemented in the API and exposed in mobile screens.
  - Successful auth returns a JWT and `UserDto`; the mobile client stores the token and supports sign-out from the profile screen.

- Job management
  - Users can create jobs with `title`, `hourlyRate`, and `firstDayOfWeek`.
  - Jobs can be listed, updated, and deleted.
  - Mobile UI includes create/edit modals, delete job action, dashboard job cards, and a jobs overview screen.

- Job detail / ledger view
  - Each job has a detail screen showing total earned, total hours, and weekly grouped entries.
  - Weekly groups include total hours, earnings, and overtime bonus when applicable.

- Work entry creation and deletion
  - Users can add an entry for a job with `date`, `totalHours`, `tip`, and optional `note`.
  - Users can delete entries from the job detail screen.
  - Backend recalculates the affected week after create/delete.

- Overtime calculation
  - Backend applies weekly overtime logic with a 40-hour threshold and 1.5x multiplier.
  - Overtime is used in weekly job summaries and in recalculated entry earnings.

- Dashboard summary
  - Dashboard API returns all-time totals, weekly totals, recent expenses, active jobs, and daily earnings points for the current Monday-start week.
  - Mobile dashboard renders weekly earnings, weekly spending, chart data, and active jobs.

- Expense tracking
  - Users can create manual expenses with `amount`, `category`, `date`, and optional `description`.
  - Premium users can scan a receipt image on native mobile, review the AI-filled expense draft, and save it as a receipt-scan expense.
  - Mobile app shows total spending, recent expenses, and a separate weekly grouped expense history screen.
  - API supports listing all expenses and grouped weekly expense history.

- Weekly goal tracking
  - Users can set or clear a weekly income goal.
  - Dashboard summary includes current amount, remaining amount, percent progress, and reached/not-reached state.
  - Mobile goal screen reads that status and updates the goal through `/api/profile/weekly-goal`.

- Basic profile view
  - Mobile profile screen shows the current user's `fullName` and `email` from auth state.
  - Sign-out is available from the same screen.

## In Progress

- Entry editing and time-range entry support
  - API supports updating entries and accepts `startTime` / `endTime` as an alternative to `totalHours`.
  - Current mobile UI only creates entries with `totalHours` and does not expose an entry edit flow.

- Expense update/delete flows
  - API supports updating and deleting expenses.
  - Mobile store includes a delete helper, but current screens/modals only expose create/list/history; no visible expense edit or delete UI was found.

- Receipt image retention
  - Expense data model includes `ReceiptImageUrl`.
  - Receipt scan V1 does not store receipt images after analysis, so scanned expenses currently return `ReceiptImageUrl = null`.

## Unclear / Needs Confirmation

- Persistent login across app restarts
  - `useAuthStore.checkAuth()` tries to validate the stored token with `GET /api/dashboard`.
  - The implemented API route is `GET /api/dashboard/summary`.
  - If this mismatch is real in the current branch, remembered sessions will not restore correctly.

- Standalone entries list usage
  - The API exposes `GET /api/entries` and `GET /api/entries/{id}`.
  - The current mobile app appears to rely on the per-job weekly ledger view instead, and no dedicated all-entries screen was found.
