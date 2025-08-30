import { NextRequest, NextResponse } from 'next/server';
import { AuthService, DatabaseService } from '@/services';

export async function DELETE(request: NextRequest) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database service
    const dbService = DatabaseService.getInstance();
    
    try {
      // Delete all user credentials
      const platforms = ['twitter', 'mastodon', 'bluesky', 'nostr'];
      for (const platform of platforms) {
        const credentials = dbService.getCredentials(userId, platform);
        if (credentials.length > 0) {
          dbService.deleteCredentials(userId, platform);
        }
      }
      
      console.log(`Deleted all account data for user: ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'All account data has been permanently deleted' 
      });
    } catch (dbError) {
      console.error('Database error during deletion:', dbError);
      return NextResponse.json({ 
        error: 'Failed to delete data from database' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to delete all data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
