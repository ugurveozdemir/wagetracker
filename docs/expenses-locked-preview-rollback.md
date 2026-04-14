# Expenses Locked Preview Rollback

This note records how to revert the experimental weekly ledger preview without disturbing the dashboard expenses card.

## Keep dashboard, revert locked expenses tab

In `Wagetracker.Mobile/src/screens/PremiumFeatureScreen.tsx`, change the expenses preview variant back to `metrics`:

```tsx
previewVariant="metrics"
```

or remove the `previewVariant` prop entirely.

## Keep dashboard, revert a future expenses modal

If an expenses `LockedFeatureModal` starts passing `previewVariant="weeklyLedger"`, remove that prop or set it to `metrics`.

## Revert dashboard too

In `Wagetracker.Mobile/src/screens/DashboardScreen.tsx`, remove `previewVariant="weeklyLedger"` from the expenses `LockedFeatureCard`. The existing card color override can stay if the orange locked card is still desired.
