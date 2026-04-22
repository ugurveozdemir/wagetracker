# RevenueCat setup for Chickaree

## Packages

The mobile app uses:

```sh
npm install --save react-native-purchases react-native-purchases-ui
```

Current installed versions are kept in `Wagetracker.Mobile/package.json`.

## App configuration

For local development, create `Wagetracker.Mobile/.env` from `.env.example` or pull the shared values with `npx eas-cli env:pull --environment development`.

For EAS builds, configure the same variable names in EAS environments and let `eas.json` select the correct `development`, `preview`, or `production` environment for each build profile.

Build-time native identifiers live in plain env vars:

```env
IOS_BUNDLE_ID=com.ugurozdemir.chickareej1
ANDROID_PACKAGE=com.ugurozdemir.chickareej1
```

Public SDK keys are configured through Expo public env values:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=YOUR_REVENUECAT_PUBLIC_IOS_SDK_KEY
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=YOUR_REVENUECAT_PUBLIC_ANDROID_SDK_KEY
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
```

Development builds may use RevenueCat Test Store keys, but release/App Store/Play builds must use the platform-specific public SDK keys for iOS and Android.

Android billing permission is declared in Expo config:

```ts
android: {
    permissions: ['com.android.vending.BILLING'],
}
```

RevenueCat native modules require a rebuilt iOS/Android app. Expo Go is not enough for purchase testing.

## RevenueCat dashboard setup

Connect both the iOS app and Android app to their stores in RevenueCat before testing purchases.

Create one entitlement:

```text
pro
```

Create subscription products with these identifiers:

```text
monthly
six_month
yearly
```

Attach all three products to the `pro` entitlement, then add them to the current offering. Create and publish a paywall for that offering, because the in-app paywall UI is loaded from RevenueCat's current offering/paywall configuration. Configure Customer Center as well if you want the in-app manage-subscription flow to use RevenueCat instead of falling back to the store settings pages.

This app's backend refresh/webhook flow requires the API to have a RevenueCat secret API key, the webhook authorization value from RevenueCat's dashboard, and matching product identifiers:

```json
"RevenueCat": {
  "ApiKey": "YOUR_REVENUECAT_SECRET_API_KEY",
  "WebhookSecret": "YOUR_REVENUECAT_WEBHOOK_AUTHORIZATION_VALUE",
  "EntitlementId": "pro",
  "Products": {
    "Monthly": "monthly",
    "SixMonth": "six_month",
    "Annual": "yearly"
  }
}
```

Set `WebhookSecret` to the exact same value you enter into RevenueCat's webhook `Authorization header value` field.

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
