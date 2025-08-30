import { NextResponse } from 'next/server';
import { AuthService, DatabaseService, EncryptionService } from '@/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, credentials, isUpdate } = body;
    
    console.log('Storing credentials for platform:', platform, isUpdate ? '(update)' : '(new)');
    
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!platform || !credentials) {
      return NextResponse.json({ error: 'Platform and credentials are required' }, { status: 400 });
    }

    const dbService = DatabaseService.getInstance();
    const encryptionService = new EncryptionService();
    
    let finalCredentials = credentials;
    
    // If this is an update, we need to handle masked fields
    if (isUpdate) {
      // Get existing credentials
      const existingCreds = dbService.getCredentials(userId, platform);
      if (existingCreds.length > 0) {
        const decryptedExisting = JSON.parse(encryptionService.decrypt(existingCreds[0].credentials));
        
        // For each field that has the masked value, use the existing value
        Object.keys(finalCredentials).forEach(field => {
          if (finalCredentials[field] === '••••••••') {
            finalCredentials[field] = decryptedExisting[field];
          }
        });
      }
    }
    
    // Encrypt credentials
    const encryptedCredentials = encryptionService.encrypt(JSON.stringify(finalCredentials));
    
    // Store in database
    dbService.saveCredentials(userId, platform, encryptedCredentials);
    
    return NextResponse.json({ 
      success: true, 
      message: isUpdate ? 'Credentials updated successfully' : 'Credentials saved successfully' 
    });
    
  } catch (error: any) {
    console.error('Error saving credentials:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save credentials' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbService = DatabaseService.getInstance();
    
    // Get all credentials for user
    const credentials = dbService.getCredentials(userId);
    
    // Return platform list (without sensitive data)
    const platformList = credentials.map((cred: any) => ({
      platform: cred.platform,
      hasCredentials: true,
      lastUpdated: cred.created_at
    }));
    
    return NextResponse.json({ platforms: platformList });
    
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch credentials' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const platform = url.searchParams.get('platform');
    
    if (!platform) {
      return NextResponse.json({ error: 'Platform parameter is required' }, { status: 400 });
    }

    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbService = DatabaseService.getInstance();
    dbService.deleteCredentials(userId, platform);
    
    return NextResponse.json({ success: true, message: 'Credentials deleted successfully' });
    
  } catch (error: any) {
    console.error('Error deleting credentials:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete credentials' 
    }, { status: 500 });
  }
}
