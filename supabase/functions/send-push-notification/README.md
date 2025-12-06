# Send Push Notification Edge Function

This Edge Function sends push notifications via Expo Push Notification API when a notification is created in the database.

## Environment Variables

- `EXPO_PUSH_ACCESS_TOKEN` (optional): Expo push access token for higher rate limits
- `SUPABASE_URL`: Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided by Supabase

## Usage

This function is called via a database webhook when a notification is inserted into the `notifications` table.

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy send-push-notification
```
