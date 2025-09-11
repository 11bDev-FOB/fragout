# Auto-Delete Functionality

The auto-delete feature provides users with the option to automatically delete their account data after 30 days of inactivity.

## What Gets Deleted

When a user enables auto-delete and remains inactive for 30 days, the following data is permanently removed:

### For All Users (Nostr and Username/Password):
- **Platform Credentials**: All stored API keys, tokens, and credentials for Twitter, Mastodon, Bluesky, and Nostr
- **Post History**: All posting records, success/failure logs, and statistics
- **Sessions**: All active login sessions

### For Username/Password Users Only:
- **User Account**: Username, password hash, and account registration data
- **2FA Data**: TOTP secrets and backup codes (if 2FA was enabled)
- **Authentication Records**: Login attempt history and account lockout data

## How It Works

1. **User Activity Tracking**: The system automatically tracks user activity when users:
   - Log in or check settings
   - Create or manage platform credentials
   - Post to social media platforms
   - Access the dashboard or other authenticated pages

2. **Automatic Cleanup**: A cleanup function (`cleanupInactiveUsers()`) checks for users who:
   - Have auto-delete enabled
   - Haven't been active for 30+ days
   - Permanently deletes all their data

3. **Manual Cleanup**: Admins can manually trigger the cleanup process via the `/api/admin/cleanup` endpoint

## User Interface

- Users can enable/disable auto-delete in their Settings page
- Clear warning explains what data will be deleted
- Current status shows whether auto-delete is enabled or disabled

## Privacy Benefits

- **No Recovery Required**: Since no emails are stored, users are clearly warned that deleted data cannot be recovered
- **Complete Deletion**: Unlike the "Delete All" button which only removes platform credentials, auto-delete removes the entire account for username/password users
- **User Control**: Users can enable/disable this feature at any time

## Implementation Details

- **Database Transaction**: All deletions happen in a single atomic transaction
- **Activity Updates**: User activity is automatically tracked on API calls
- **Logging**: All auto-delete operations are logged for audit purposes
- **Error Handling**: Failed deletions are caught and logged without affecting other users

## Current Limitations

- The cleanup function must be manually triggered (no cron job implemented yet)
- Activity tracking is only implemented for API endpoints, not page views
- In-memory maps for settings may be lost on server restart (should be moved to database)

## Future Enhancements

1. Implement automated cron job for regular cleanup
2. Store auto-delete settings in database instead of memory
3. Add email notifications before deletion (if email collection is ever added)
4. Provide data export option before deletion
