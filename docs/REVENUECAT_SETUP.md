# RevenueCat setup for Chickaree

## Packages

The mobile app uses:

```sh
npm install --save react-native-purchases react-native-purchases-ui
```

Current installed versions are kept in `Wagetracker.Mobile/package.json`.

## App configuration

Public SDK keys are configured through Expo public env values:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=test_OhbahuTbUcYxqMtxOwLyEJGmoGY
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=test_OhbahuTbUcYxqMtxOwLyEJGmoGY
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Chickaree: Work Travel Tracker Pro
```

Android billing permission is declared in Expo config:

```ts
android: {
    permissions: ['com.android.vending.BILLING'],
}
```

RevenueCat native modules require a rebuilt iOS/Android app. Expo Go is not enough for purchase testing.

## RevenueCat dashboard setup

Create one entitlement:

```text
Chickaree: Work Travel Tracker Pro
```

Create subscription products with these identifiers:

```text
monthly
six_month
yearly
```

Attach all three products to the Pro entitlement, then add them to the current offering. The in-app paywall uses RevenueCat's current offering by default.

If the backend refresh endpoint is enabled, configure the API with a RevenueCat secret API key and matching product identifiers:

```json
"RevenueCat": {
  "ApiKey": "YOUR_REVENUECAT_SECRET_API_KEY",
  "WebhookSecret": "YOUR_REVENUECAT_WEBHOOK_SECRET",
  "EntitlementId": "Chickaree: Work Travel Tracker Pro",
  "Products": {
    "Monthly": "monthly",
    "SixMonth": "six_month",
    "Annual": "yearly"
  }
}
```

## Code flow

`useSubscriptionStore.bootstrap(user)` configures the SDK with the user's backend `billingCustomerId` as RevenueCat `appUserID`, loads offerings, retrieves customer info, and listens for customer info updates.

`SubscriptionPaywall` opens RevenueCat's native paywall with:

```ts
RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: config.REVENUECAT_ENTITLEMENT_ID,
    offering: offerings.current,
    displayCloseButton: true,
});
```

The fallback manual package cards still use `Purchases.purchasePackage(pkg)` and `Purchases.restorePurchases()`.

Profile and paywall management actions use RevenueCat Customer Center first:

```ts
RevenueCatUI.presentCustomerCenter();
```

If Customer Center is unavailable, the app falls back to the App Store or Google Play subscription management URL.
