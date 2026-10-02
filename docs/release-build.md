# Seekase Android release build

Seekase must be distributed as a signed standalone APK that starts without Metro. Never submit the current generated Android `release` variant while it still uses Expo's example debug keystore.

## Build profiles

`eas.json` defines two Android profiles:

- `hackathon-apk`: internally distributed, EAS-signed APK for physical acceptance and the CLOCK IN submission package.
- `dapp-store-apk`: store-distributed, version-incremented APK for the Solana dApp Store publication flow.

Both use the EAS `production` environment and create an APK rather than an Android App Bundle.

## One-time EAS setup

1. Sign in to or create the owner's Expo account.
2. Install or run the current EAS CLI without adding it to application dependencies.
3. Link the project with `eas init`. Review the generated project ID before accepting it.
4. Configure Android credentials through EAS. Let EAS create and securely store the upload keystore unless an existing production keystore is deliberately supplied.
5. Add these client-readable variables to the EAS `production` environment:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SOLANA_NETWORK=mainnet`
   - `EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL`
   - `EXPO_PUBLIC_SEEKER_VERIFICATION_ENABLED=true`
   - `EXPO_PUBLIC_SUPPORT_URL=https://seekase.app/support/`

All `EXPO_PUBLIC_*` values are embedded in the APK and must be treated as readable by end users. Never add `SUPABASE_SERVICE_ROLE_KEY`, `HELIUS_API_KEY`, `WALLET_AUTH_PEPPER`, keystore passwords or private keys to the mobile build environment.

## First standalone build

Run:

```bash
eas build --platform android --profile hackathon-apk
```

Download the resulting APK, record its SHA-256 checksum, install it on the physical Seeker and verify that it works after Metro and the development client are stopped.

## Physical acceptance

Test this exact signed APK:

1. Cold start and onboarding.
2. Seed Vault wallet sign-in and return to Seekase.
3. Profile edit with the keyboard open.
4. Collection creation, item metadata and photo upload.
5. Discover and Collections visibility after refresh.
6. Follow, like, save, comment, report and block with a second test account.
7. Private Wallet Verified state and genuine Seeker Genesis badge.
8. Mainnet daily check-in with explicit wallet approval and network fee.
9. App restart, offline state and network recovery.
10. Account deletion with a disposable account.

Do not use the owner's genuine SGT account for destructive acceptance.

## Store build

After the hackathon APK is accepted and the version number is frozen:

```bash
eas build --platform android --profile dapp-store-apk
```

Keep the final keystore under the owner's control. Losing it can prevent future updates. The dApp Store App NFT / Release NFT and publishing steps are separate and may spend Mainnet SOL only with explicit approval.

Official references: [EAS build profiles](https://docs.expo.dev/build/eas-json/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/), and [Solana dApp Store submission](https://docs.solanamobile.com/dapp-store/publishing-cli/submit).
