# Openline - Architecture Documentation

## Overview

Openline is a React Native mobile application built with Expo, designed for medical representatives to manage their appointments and communications with medical offices.

## Architecture Principles

1. **File-based Routing**: Using Expo Router for intuitive navigation
2. **Type Safety**: Full TypeScript implementation
3. **Separation of Concerns**: Clear separation between UI, business logic, and data
4. **Mock-first Development**: Mock services for rapid development and testing
5. **Responsive Design**: Utility-first styling with NativeWind

## Application Layers

### 1. Presentation Layer (UI)

**Location**: `app/` directory

The presentation layer uses Expo Router's file-based routing system:

```
app/
├── (auth)/          # Authentication flow
├── (tabs)/          # Main app (bottom tabs)
└── [modal screens]  # Full-screen modals
```

**Key Patterns**:

- **Route Groups**: Parentheses `()` create layout groups without affecting URLs
- **Layouts**: `_layout.tsx` files define nested navigation structures
- **Type-safe Navigation**: Expo Router provides automatic type generation

**Example Route Structure**:

```
/ -> redirects based on auth state
/(auth)/sign-in -> Sign in screen
/(tabs)/index -> Dashboard
/(tabs)/booking -> Booking screen
/message-detail?messageId=X -> Modal screen
```

### 2. Business Logic Layer

**Location**: `lib/` directory

#### Context Providers

**AuthContext** (`lib/contexts/AuthContext.tsx`)

- Manages authentication state
- Provides sign in/out methods
- Handles session persistence
- Used throughout the app via `useAuth()` hook

```typescript
const { user, loading, signIn, signOut } = useAuth();
```

#### Services

**Mock Services** (`lib/mock/services.ts`)

- Simulate API calls with realistic delays
- Provide CRUD operations for all entities
- Easy to swap with real API calls

Service Categories:

- `mockAuthService`: User authentication
- `mockMeetingsService`: Meeting management
- `mockOfficesService`: Office locations and availability
- `mockMessagesService`: Messaging functionality

### 3. Data Layer

**Location**: `lib/types/` and `lib/mock/`

#### Type Definitions

**database.types.ts**

- Mirrors Supabase database schema
- Provides type safety across the app
- Includes table row types and insert/update types

Main Entities:

```typescript
- User: Application users (reps and admins)
- MedicalOffice: Office locations
- Meeting: Scheduled appointments
- Message: Communications between users
- TimeSlot: Available booking times
```

#### Mock Data

**data.ts**

- Sample users, offices, meetings, messages
- Realistic test data for development
- Easily extendable

## Navigation Architecture

### Root Navigation Flow

```
RootLayout (_layout.tsx)
├── AuthProvider (wraps entire app)
└── Navigation based on auth state
    ├── If not authenticated -> (auth)/sign-in
    └── If authenticated -> (tabs)/
```

### Authentication Flow

1. App loads, checks for existing session
2. `AuthProvider` retrieves user state
3. `RootLayoutNav` redirects based on auth:
   - No user → `/(auth)/sign-in`
   - Has user → `/(tabs)/`

**Implementation**: `app/_layout.tsx:57-68`

### Tab Navigation

Bottom tab bar with 4 main sections:

1. **Dashboard** (index): Home screen with stats
2. **Booking**: Location and calendar views
3. **Messages**: Message list
4. **Settings**: User preferences

**Implementation**: `app/(tabs)/_layout.tsx`

### Modal Navigation

Full-screen modals for focused tasks:

- `message-detail`: View message
- `compose-message`: Create message

These are presented modally and can be dismissed.

## State Management

### Current Approach

- **React Context**: For global state (auth)
- **Local State**: Component-level state with `useState`
- **Async State**: Loading and error states in components

### Data Flow

```
User Action
    ↓
Component Handler
    ↓
Service Call (Mock or Real)
    ↓
State Update
    ↓
UI Re-render
```

Example: Booking a Meeting

```typescript
handleBookMeeting()
    ↓
mockMeetingsService.createMeeting()
    ↓
setBooking(true/false)
    ↓
Alert + Navigation
```

## Screen Architecture Patterns

### Standard Screen Pattern

```typescript
export default function Screen() {
  // 1. Hooks
  const { user } = useAuth();
  const router = useRouter();

  // 2. State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. Effects
  useEffect(() => {
    loadData();
  }, []);

  // 4. Handlers
  const loadData = async () => {
    // Fetch data
  };

  // 5. Render
  if (loading) return <LoadingView />;
  return <Content />;
}
```

### List Screen Pattern

Used in: Dashboard, Messages, Booking (Locations)

Features:

- Pull-to-refresh
- Empty states
- Loading states
- Item press handlers

**Example**: `app/(tabs)/messages.tsx`

### Form Screen Pattern

Used in: Compose Message, Sign In

Features:

- Input validation
- Submit handling
- Error display
- Loading states during submission

**Example**: `app/compose-message.tsx`

## Styling Architecture

### NativeWind (Tailwind CSS)

Utility-first CSS framework adapted for React Native.

**Configuration**: `tailwind.config.js`

**Usage**:

```typescript
<View className="flex-1 bg-gray-50 p-6">
  <Text className="text-2xl font-bold text-gray-900">Title</Text>
</View>
```

### Design System

**Colors**:

- Primary: Blue 600 (#2563eb)
- Success: Green 600
- Error: Red 600
- Gray Scale: 50-900

**Spacing**: Standard Tailwind spacing scale (4px base)

**Typography**:

- Headings: Bold, varying sizes
- Body: Regular, 16px base
- Small: 14px for meta information

### Responsive Design

NativeWind automatically handles platform differences:

- Safe area handling via `react-native-safe-area-context`
- Platform-specific adjustments where needed
- Consistent spacing and sizing

## Data Fetching Patterns

### Pattern 1: Load on Mount

```typescript
useEffect(() => {
  loadData();
}, []);
```

Used for: Dashboard stats, message lists, office locations

### Pattern 2: Load on Dependency Change

```typescript
useEffect(() => {
  if (selectedLocation && selectedDate) {
    loadAvailableSlots();
  }
}, [selectedLocation, selectedDate]);
```

Used for: Conditional data loading (e.g., time slots)

### Pattern 3: Manual Trigger

```typescript
const handleRefresh = () => {
  setRefreshing(true);
  loadData();
};
```

Used for: Pull-to-refresh, button actions

## Error Handling

### Current Approach

1. **Try-Catch Blocks**: Wrap async operations
2. **Console Logging**: Development debugging
3. **User Alerts**: For critical errors
4. **Graceful Degradation**: Empty states, fallbacks

### Example

```typescript
try {
  const data = await service.getData();
  setData(data);
} catch (error) {
  console.error("Error loading data:", error);
  Alert.alert("Error", "Failed to load data");
} finally {
  setLoading(false);
}
```

## Testing Architecture

### Test Structure

```
__tests__/
├── services/        # Service layer tests
│   ├── auth.test.ts
│   ├── meetings.test.ts
│   ├── messages.test.ts
│   └── offices.test.ts
├── components/      # Component tests (future)
└── screens/         # Screen tests (future)
```

### Testing Strategy

**Unit Tests**: Individual services and utilities
**Component Tests**: React components in isolation
**Integration Tests**: User workflows across screens

**Tools**:

- Vitest: Test runner
- React Native Testing Library: Component testing
- Mock services: Isolated testing

## Security Considerations

### Authentication

- Magic link authentication (passwordless)
- Supabase handles token management
- Tokens stored in AsyncStorage
- Auto-refresh on expiry

### Data Security

- All API calls authenticated via Supabase JWT
- Row-level security in Supabase (production)
- No sensitive data in local storage (except tokens)

### Deep Linking Security

- Validate all deep link parameters
- Require authentication for sensitive routes
- Use HTTPS for universal links

## Performance Optimizations

### Current

1. **Lazy Loading**: Only load data when needed
2. **Memoization**: Prevent unnecessary re-renders (future: useMemo, useCallback)
3. **Virtualized Lists**: For long lists (future: FlashList)
4. **Image Optimization**: Cached images via Expo

### Future Optimizations

1. Implement React.memo for expensive components
2. Use FlashList for better list performance
3. Implement pagination for large datasets
4. Add optimistic UI updates
5. Cache data with TanStack Query

## Extensibility

### Adding a New Screen

1. Create file in appropriate directory:

   - Tab: `app/(tabs)/new-screen.tsx`
   - Modal: `app/new-screen.tsx`
   - Auth: `app/(auth)/new-screen.tsx`

2. Add navigation config if needed:

   - Update `_layout.tsx` for tab screens

3. Follow screen pattern:
   - Import hooks and context
   - Define state
   - Load data
   - Render UI

### Adding a New Feature

1. Define types in `lib/types/`
2. Create mock data in `lib/mock/data.ts`
3. Add service methods in `lib/mock/services.ts`
4. Build UI components
5. Write tests

### Switching to Real Backend

1. Set up Supabase project
2. Create database schema from types
3. Update `lib/supabase/client.ts` with credentials
4. Replace mock service calls with Supabase queries:

```typescript
// Before (Mock)
const meetings = await mockMeetingsService.getUpcomingMeetings(userId);

// After (Real)
const { data: meetings } = await supabase
  .from("meetings")
  .select("*, office:medical_offices(*)")
  .eq("medical_rep_id", userId)
  .eq("status", "scheduled")
  .gt("scheduled_at", new Date().toISOString());
```

## Development Workflow

1. **Design**: Define feature requirements
2. **Types**: Create TypeScript interfaces
3. **Mock Data**: Add sample data
4. **Services**: Implement mock services
5. **UI**: Build screens and components
6. **Tests**: Write service and component tests
7. **Integration**: Connect to real backend (production)
8. **Polish**: Refine UX, add animations

## Deployment

### Expo Application Services (EAS)

1. **Development**: `expo start`
2. **Preview**: `eas build --profile preview`
3. **Production**: `eas build --profile production`
4. **Submit**: `eas submit`

### Environment Management

- Development: Local with mock data
- Staging: EAS with staging Supabase
- Production: EAS with production Supabase

## Future Enhancements

### Planned Features

1. **Real-time Updates**: Supabase subscriptions for live data
2. **Push Notifications**: New message alerts
3. **Offline Support**: Local database with sync
4. **Maps Integration**: Show office locations on map
5. **Calendar Sync**: Export to device calendar
6. **File Attachments**: Share documents in messages
7. **Analytics**: Track usage patterns

### Technical Improvements

1. **State Management**: Consider Zustand or TanStack Query
2. **Animation**: Add more Reanimated transitions
3. **Accessibility**: Full WCAG compliance
4. **Internationalization**: Multi-language support
5. **Error Tracking**: Sentry integration
6. **Analytics**: PostHog or Mixpanel

## Maintenance

### Updating Dependencies

```bash
# Check for updates
npx expo install --check

# Update Expo SDK
npx expo install expo@latest

# Update all packages
npm update
```

### Code Quality

- **Linting**: ESLint (future)
- **Formatting**: Prettier (future)
- **Type Checking**: `tsc --noEmit`
- **Tests**: `npm test`

## Conclusion

This architecture provides:

- ✅ Clear separation of concerns
- ✅ Type safety throughout
- ✅ Easy testing with mocks
- ✅ Smooth path to production
- ✅ Extensible and maintainable codebase
