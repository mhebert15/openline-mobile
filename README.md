# Openline

A mobile application for medical representatives to book meetings at medical offices and communicate with office staff.

## Features

- **Magic Link Authentication**: Secure passwordless authentication using magic links
- **Dashboard**: View statistics on completed meetings and upcoming appointments
- **Booking System**:
  - Browse medical office locations
  - Calendar-based appointment scheduling
  - Real-time availability checking
  - Time slot selection
- **Messaging**:
  - Send and receive messages from office admin staff
  - Notification badges for unread messages
  - Message composition and viewing
- **Settings**: User profile and app preferences

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animation**: React Native Reanimated
- **Database**: Supabase (configured for production, using mock data for demo)
- **Navigation**: Expo Router (file-based routing)
- **Testing**: Vitest + React Native Testing Library
- **Calendar**: react-native-calendars
- **Date Utilities**: date-fns

## Prerequisites

- Node.js 18+ and npm
- iOS Simulator (for Mac) or Android Emulator
- Expo Go app (for testing on physical devices)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd openline-mobile
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials (optional for demo):

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running the App

### Development

Start the development server:

```bash
npm start
```

Then choose your platform:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app for physical device

### Platform-specific

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Running Tests

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
.
├── app/                      # App screens (Expo Router)
│   ├── (auth)/              # Authentication screens
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx
│   ├── (tabs)/              # Main app tabs
│   │   ├── _layout.tsx      # Bottom tab navigation
│   │   ├── index.tsx        # Dashboard
│   │   ├── booking.tsx      # Booking screen
│   │   ├── messages.tsx     # Messages list
│   │   └── settings.tsx     # Settings
│   ├── message-detail.tsx   # Message viewer
│   ├── compose-message.tsx  # New message composer
│   └── _layout.tsx          # Root layout
├── lib/                     # Core application code
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── types/               # TypeScript types
│   │   └── database.types.ts
│   ├── supabase/            # Supabase configuration
│   │   └── client.ts
│   └── mock/                # Mock data and services
│       ├── data.ts          # Sample data
│       └── services.ts      # Mock API services
├── components/              # Reusable components
├── hooks/                   # Custom React hooks
├── __tests__/              # Test files
│   ├── components/
│   └── services/
├── assets/                  # Images, fonts, etc.
├── app.json                # Expo configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vitest.config.ts
```

## Key Features Explained

### Authentication

The app uses Supabase magic link authentication. In demo mode, it uses mock authentication that automatically signs you in after sending the magic link.

**Location**: `lib/contexts/AuthContext.tsx`, `app/(auth)/sign-in.tsx`

### Dashboard

Shows:

- Welcome message with user name
- Count of completed meetings
- Number of upcoming meetings
- List of upcoming appointments with details
- Quick access to book new meetings

**Location**: `app/(tabs)/index.tsx`

### Booking

Two-tab interface:

1. **Locations Tab**: Browse and select medical offices
2. **Calendar Tab**:
   - Select appointment date
   - View available time slots
   - Confirm booking

**Location**: `app/(tabs)/booking.tsx`

### Messages

- View all messages (sent and received)
- Unread message indicators
- Compose new messages
- Message detail view
- Mark messages as read

**Locations**:

- List: `app/(tabs)/messages.tsx`
- Detail: `app/message-detail.tsx`
- Compose: `app/compose-message.tsx`

## Configuration

### Deep Links

The app is configured for deep linking with the scheme `openline://`

**iOS**: Universal Links configured for `openline.com`
**Android**: Intent filters set up for the same domain

### Push Notifications

Expo Notifications is configured. See `app.json` for notification settings.

### Permissions

**iOS**:

- Camera (for QR code scanning - future feature)
- Location (for finding nearby offices)

**Android**:

- Camera
- Location
- Post Notifications

## Mock Data

The app includes mock data services that simulate API calls:

- `mockAuthService`: Authentication
- `mockMeetingsService`: Meetings CRUD operations
- `mockOfficesService`: Office locations and availability
- `mockMessagesService`: Messaging functionality

All mock services include realistic delays to simulate network requests.

**Location**: `lib/mock/services.ts`

## Connecting to Real Supabase

1. Create a Supabase project at https://supabase.com
2. Set up the database schema based on types in `lib/types/database.types.ts`
3. Enable Magic Link authentication in Supabase Auth settings
4. Add your Supabase URL and anon key to `.env`
5. Replace mock service calls with real Supabase queries

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Testing Strategy

The app uses Vitest for unit and integration testing:

- **Service Tests**: Mock API services (`__tests__/services/`)
- **Component Tests**: React components (planned)
- **Integration Tests**: Screen workflows (planned)

## Troubleshooting

### Build Issues

If you encounter build issues, try:

```bash
# Clear caches
rm -rf node_modules
npm cache clean --force
npm install

# Reset Expo
expo start -c
```

### iOS Simulator Issues

```bash
# Reset simulator
xcrun simctl erase all
```

### Android Emulator Issues

```bash
# Clear Gradle cache
cd android && ./gradlew clean
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
