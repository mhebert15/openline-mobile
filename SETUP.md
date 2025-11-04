# Setup Guide - MedRep Connect

This guide will help you set up the development environment and get the app running.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18+
   ```
   Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **Git**
   ```bash
   git --version
   ```

### Platform-Specific Requirements

#### For iOS Development (macOS only)

1. **Xcode** (latest version from App Store)
2. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```
3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

#### For Android Development

1. **Android Studio** (latest version)
   Download from: https://developer.android.com/studio

2. **Android SDK** (installed via Android Studio)
   - SDK Platform: Android 13.0 (API 33) or higher
   - Android SDK Build-Tools
   - Android Emulator

3. **Environment Variables**
   Add to your `~/.zshrc` or `~/.bashrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd openline-mobile
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native and Expo
- TypeScript
- NativeWind
- Supabase client
- Testing libraries
- And more...

### 3. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration (optional for demo)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

**Note**: The app works with mock data by default. Supabase configuration is only needed if you want to connect to a real backend.

### 4. Start the Development Server

```bash
npm start
```

This will start the Expo development server and display a QR code.

### 5. Run on Your Device/Simulator

#### Option A: Physical Device (Recommended for testing)

1. Install **Expo Go** app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Scan the QR code displayed in your terminal:
   - iOS: Use the Camera app
   - Android: Use the Expo Go app

#### Option B: iOS Simulator (macOS only)

```bash
npm run ios
```

Or press `i` in the terminal where Expo is running.

#### Option C: Android Emulator

1. Start an Android emulator from Android Studio, or:
   ```bash
   emulator -avd Pixel_5_API_33
   ```

2. Run the app:
   ```bash
   npm run android
   ```

   Or press `a` in the terminal where Expo is running.

#### Option D: Web Browser

```bash
npm run web
```

Or press `w` in the terminal where Expo is running.

## Verification

After the app starts, you should see:

1. **Sign In Screen** with magic link input
2. Enter any email address (e.g., `test@example.com`)
3. Click "Send Magic Link"
4. Wait 2 seconds (automatic sign-in in demo mode)
5. You should be redirected to the **Dashboard**

## Common Issues & Solutions

### Issue: Metro bundler won't start

**Solution**: Clear caches and restart
```bash
npm start -- --clear
```

### Issue: "Unable to resolve module"

**Solution**:
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Issue: iOS build fails

**Solution**:
```bash
cd ios
pod install
cd ..
npm run ios
```

### Issue: Android build fails

**Solution**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: TypeScript errors

**Solution**: Check for type errors
```bash
npx tsc --noEmit
```

## Development Tools

### VS Code Extensions (Recommended)

Install these extensions for the best development experience:

1. **ES7+ React/Redux/React-Native snippets**
2. **Prettier - Code formatter**
3. **ESLint**
4. **Tailwind CSS IntelliSense**
5. **React Native Tools**
6. **Expo Tools**

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["className\\s*=\\s*['\"]([^'\"]*)['\"]"]
  ]
}
```

## Testing Setup

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests are located in `__tests__/` directory.

Example test:
```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Project Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in web browser

# Testing
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage

# Building
npm run build         # Export for web

# Type Checking
npx tsc --noEmit      # Check for TypeScript errors
```

## Setting Up Supabase (Optional)

If you want to connect to a real Supabase backend:

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created

### 2. Set Up Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('medical_rep', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical offices table
CREATE TABLE public.medical_offices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_rep_id UUID REFERENCES public.users NOT NULL,
  office_id UUID REFERENCES public.medical_offices NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users NOT NULL,
  recipient_id UUID REFERENCES public.users NOT NULL,
  office_id UUID REFERENCES public.medical_offices NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example)
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Add more policies as needed...
```

### 3. Enable Magic Link Authentication

1. Go to Authentication > Settings
2. Enable "Email" provider
3. Disable "Confirm email" (optional for development)
4. Set up email templates

### 4. Get API Credentials

1. Go to Settings > API
2. Copy "Project URL"
3. Copy "anon/public" key
4. Add to `.env` file

### 5. Update Code

Replace mock service calls with Supabase queries. Example:

```typescript
// Before
const meetings = await mockMeetingsService.getUpcomingMeetings(userId);

// After
const { data: meetings } = await supabase
  .from('meetings')
  .select('*, office:medical_offices(*)')
  .eq('medical_rep_id', userId)
  .eq('status', 'scheduled')
  .gt('scheduled_at', new Date().toISOString());
```

## Debugging

### React Native Debugger

1. Install: https://github.com/jhen0409/react-native-debugger
2. Start debugger
3. In Expo app, shake device and select "Debug"

### Chrome DevTools

1. In Expo, press `j` to open Chrome debugger
2. Use Chrome DevTools for debugging

### Flipper

1. Install Flipper: https://fbflipper.com/
2. Connect to your app
3. Use plugins for network, layout, logs, etc.

### Logs

```bash
# View all logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS

# Filter logs
npx react-native log-ios | grep "MyComponent"
```

## Building for Production

### Using EAS (Expo Application Services)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login:
   ```bash
   eas login
   ```

3. Configure:
   ```bash
   eas build:configure
   ```

4. Build:
   ```bash
   # iOS
   eas build --platform ios --profile production

   # Android
   eas build --platform android --profile production
   ```

5. Submit to stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Next Steps

1. ✅ Verify app runs correctly
2. 📖 Read `README.md` for feature overview
3. 🏗️ Review `ARCHITECTURE.md` for technical details
4. 🧪 Run tests to ensure everything works
5. 💻 Start developing!

## Getting Help

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Supabase Docs**: https://supabase.com/docs
- **NativeWind Docs**: https://www.nativewind.dev/

## Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Vitest Documentation](https://vitest.dev/)

Happy coding! 🚀
