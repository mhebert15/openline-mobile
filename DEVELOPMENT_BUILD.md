# Development Build Setup Guide

This guide explains how to set up and use development builds to enable push notifications and other native features that are not available in Expo Go.

## Why Development Builds?

Starting with Expo SDK 53, push notifications (remote notifications) are no longer supported in Expo Go. To test push notifications and other native features, you need to use a development build.

**Benefits:**

- Full push notification support
- Access to all native modules
- Test production-like features during development
- Faster iteration than production builds

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) (free tier works)
2. **EAS CLI**: Install globally: `npm install -g eas-cli`
3. **Login**: Run `eas login` to authenticate

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Initialize EAS Project

```bash
cd openline-mobile
eas init
```

This will:

- Create or link to an Expo project
- Set the `projectId` in `app.json`
- Configure your project for EAS Build

### 4. Configure EAS Build (Already Done)

The `eas.json` file is already configured with:

- **development**: Development build profile (for testing push notifications)
- **preview**: Preview build profile (for internal testing)
- **production**: Production build profile (for app stores)

## Building Development Builds

### iOS Development Build

```bash
npm run eas:build:dev:ios
```

This will:

1. Build a development client for iOS
2. Generate an `.ipa` file (for physical devices) or simulator build
3. Provide a download link when complete

**For Simulator:**

- The build will automatically be configured for iOS Simulator
- Download and install the `.app` file to your simulator

**For Physical Device:**

- Download the `.ipa` file
- Install via TestFlight or direct installation

### Android Development Build

```bash
npm run eas:build:dev:android
```

This will:

1. Build a development client for Android
2. Generate an `.apk` file
3. Provide a download link when complete

**Installation:**

- Download the `.apk` file
- Enable "Install from Unknown Sources" on your Android device
- Install the APK file

### Build Both Platforms

```bash
npm run eas:build:dev
```

## Running the Development Build

After installing the development build on your device/simulator:

1. **Start the development server:**

   ```bash
   npm start
   ```

2. **Open the development build app** on your device/simulator

3. **Connect to the dev server:**
   - Scan the QR code (if using physical device)
   - Or the app will automatically connect if on the same network

## Testing Push Notifications

Once running in a development build:

1. **Grant notification permissions** when prompted
2. **Verify push token registration** - Check console logs for successful token registration
3. **Test push notifications** - Trigger a notification (e.g., approve/decline a meeting)
4. **Verify deep linking** - Tap a notification to ensure it navigates correctly

## Expo Go Fallback

The app is configured to gracefully handle Expo Go:

- **In Expo Go**: Push notifications are disabled, but in-app notifications still work via Supabase Realtime
- **In Development Build**: Full push notification support is enabled

The app automatically detects the environment and adjusts behavior accordingly.

## Troubleshooting

### Build Fails

- **Check EAS project ID**: Ensure `app.json` has a valid `projectId` (run `eas init` if needed)
- **Check credentials**: Run `eas build:configure` to set up iOS/Android credentials
- **Check logs**: Review the build logs in the Expo dashboard

### Push Notifications Not Working

- **Verify development build**: Check console for "Running in Expo Go" messages
- **Check permissions**: Ensure notification permissions are granted
- **Verify project ID**: Ensure `EXPO_PUBLIC_PROJECT_ID` is set in your `.env` file
- **Check Edge Function**: Ensure the Supabase Edge Function is deployed

### Development Build Won't Connect

- **Check network**: Ensure device and computer are on the same network
- **Check firewall**: Ensure port 8081 is not blocked
- **Try tunnel**: Use `expo start --tunnel` for better connectivity

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)

## Quick Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Initialize project
eas init

# Build development client
npm run eas:build:dev:ios      # iOS only
npm run eas:build:dev:android  # Android only
npm run eas:build:dev          # Both platforms

# Start dev server
npm start
```
