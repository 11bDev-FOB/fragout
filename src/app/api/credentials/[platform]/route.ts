import { NextResponse } from 'next/server';
import { AuthService, DatabaseService, EncryptionService } from '@/services';

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  try {
    const { platform } = await params;

    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbService = DatabaseService.getInstance();
    const encryptionService = new EncryptionService();
    
    // Get credentials for the specific platform
    const credentials = dbService.getCredentials(userId, platform);
    
    if (credentials.length === 0) {
      return NextResponse.json({ 
        exists: false,
        message: 'No credentials found for this platform' 
      });
    }

    // Decrypt and return credentials (removing sensitive values for security)
    const encryptedCreds = credentials[0];
    const decryptedCreds = JSON.parse(encryptionService.decrypt(encryptedCreds.credentials));
    
    // For security, we'll only return field names and indicate which fields have values
    // We won't return the actual sensitive values
    const credentialInfo: Record<string, any> = {};
    
    Object.keys(decryptedCreds).forEach(key => {
      if (key.includes('password') || key.includes('secret') || key.includes('key') || key.includes('token')) {
        // For sensitive fields, just indicate they exist
        credentialInfo[key] = '••••••••'; // Masked value
      } else {
        // For non-sensitive fields (like instance URLs, usernames), return actual values
        credentialInfo[key] = decryptedCreds[key];
      }
    });
    
    return NextResponse.json({ 
      exists: true,
      platform: platform,
      credentials: credentialInfo,
      lastUpdated: encryptedCreds.created_at
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  try {
    const { platform } = await params;

    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbService = DatabaseService.getInstance();
    const encryptionService = new EncryptionService();
    
    // Get credentials for the specific platform
    const credentials = dbService.getCredentials(userId, platform);
    
    if (credentials.length === 0) {
      return NextResponse.json({ 
        exists: false,
        message: 'No credentials found for this platform' 
      });
    }

    // Decrypt and return credentials (removing sensitive values for security)
    const encryptedCreds = credentials[0];
    const decryptedCreds = JSON.parse(encryptionService.decrypt(encryptedCreds.credentials));
    
    // For security, we'll only return field names and indicate which fields have values
    // We won't return the actual sensitive values
    const credentialInfo: Record<string, any> = {};
    
    Object.keys(decryptedCreds).forEach(key => {
      if (key.includes('password') || key.includes('secret') || key.includes('key') || key.includes('token')) {
        // For sensitive fields, just indicate they exist
        credentialInfo[key] = '••••••••'; // Masked value
      } else {
        // For non-sensitive fields (like instance URLs, usernames), return actual values
        credentialInfo[key] = decryptedCreds[key];
      }
    });
    
    return NextResponse.json({ 
      exists: true,
      platform: platform,
      credentials: credentialInfo,
      lastUpdated: encryptedCreds.created_at
    });
    
  } catch (error: any) {
    console.error('Error fetching platform credentials:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch credentials' 
    }, { status: 500 });
  }
}
