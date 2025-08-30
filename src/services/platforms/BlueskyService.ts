import { BasePlatformService, Platform, TestResult, PostContent, PostResult } from './BasePlatformService';
import ImageUploadService from '../ImageUploadService';

export class BlueskyService extends BasePlatformService {
  constructor() {
    const platform: Platform = {
      id: 'bluesky',
      name: 'BlueSky',
      requiresAuth: true,
      connectionTestUrl: '/xrpc/com.atproto.server.getSession'
    };
    super(platform);
  }

  public async testConnection(credentials: Record<string, string>): Promise<TestResult> {
    // Handle both old and new field names
    const handle = credentials.handle || credentials.identifier;
    const appPassword = credentials.appPassword || credentials.password;

    if (!handle || !appPassword) {
      return {
        success: false,
        message: 'Missing required credentials: handle and appPassword'
      };
    }

    // Clean up invisible characters from credentials
    const cleanHandle = handle.trim().replace(/[\u200B-\u200F\uFEFF]/g, '');
    const cleanAppPassword = appPassword.trim().replace(/[\u200B-\u200F\uFEFF]/g, '');

    try {
      // Normalize handle - if it doesn't contain a dot, assume it's a username and add .bsky.social
      let normalizedHandle = cleanHandle;
      if (!cleanHandle.includes('.') && !cleanHandle.includes('@')) {
        normalizedHandle = `${cleanHandle}.bsky.social`;
        console.log('BlueSky test normalized handle to:', normalizedHandle);
      }
      
      // First, authenticate to get access token
      const authResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YallWeb/1.0'
        },
        body: JSON.stringify({
          identifier: normalizedHandle,
          password: cleanAppPassword
        })
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text().catch(() => 'Unknown error');
        console.error('BlueSky test auth failed:', authResponse.status, authResponse.statusText, errorText);
        
        if (authResponse.status === 401) {
          return {
            success: false,
            message: 'Invalid credentials. Please check your handle and app password.'
          };
        }

        return {
          success: false,
          message: `Authentication failed: ${authResponse.status} ${authResponse.statusText}`
        };
      }

      const authData = await authResponse.json();
      
      // Test the session
      const sessionResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.getSession', {
        headers: {
          'Authorization': `Bearer ${authData.accessJwt}`
        }
      });

      if (!sessionResponse.ok) {
        return {
          success: false,
          message: 'Session validation failed'
        };
      }

      const sessionData = await sessionResponse.json();

      return {
        success: true,
        message: `Successfully connected to BlueSky as @${sessionData.handle}`,
        data: {
          handle: sessionData.handle,
          did: sessionData.did
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  public async post(content: PostContent, credentials: Record<string, string>): Promise<PostResult> {
    console.log('BlueSky post called with credentials keys:', Object.keys(credentials));
    // Handle both old and new field names
    const handle = credentials.handle || credentials.identifier;
    const appPassword = credentials.appPassword || credentials.password;

    if (!handle || !appPassword) {
      console.error('BlueSky missing credentials:', { handle: !!handle, appPassword: !!appPassword });
      return {
        success: false,
        error: 'Missing required credentials: handle and appPassword'
      };
    }

    // Clean up invisible characters from credentials - try multiple approaches
    let cleanHandle = handle.trim();
    let cleanAppPassword = appPassword.trim();
    
    // First try specific invisible character removal
    cleanHandle = cleanHandle.replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, '');
    cleanAppPassword = cleanAppPassword.replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, '');
    
    // If that didn't work, try removing all non-ASCII from handle (but not password)
    const asciiOnlyHandle = cleanHandle.replace(/[^\x00-\x7F]/g, '');
    
    console.log('BlueSky original handle:', JSON.stringify(handle));
    console.log('BlueSky original handle char codes:', Array.from(handle).map(c => c.charCodeAt(0)));
    console.log('BlueSky cleaned handle:', JSON.stringify(cleanHandle));
    console.log('BlueSky ASCII-only handle:', JSON.stringify(asciiOnlyHandle));
    
    // Use ASCII-only handle if it's different from the cleaned one
    const finalHandle = cleanHandle !== asciiOnlyHandle ? asciiOnlyHandle : cleanHandle;

    // Validate credentials format
    if (cleanAppPassword.length < 19) {
      console.warn('BlueSky app password seems too short:', cleanAppPassword.length, 'characters. App passwords are typically 19+ characters.');
    }
    
    if (!finalHandle.includes('.') && !finalHandle.includes('@') && finalHandle.length < 3) {
      console.warn('BlueSky handle seems too short:', finalHandle);
    }

    try {
      // Try the main BlueSky API endpoint first
      console.log('BlueSky authenticating with final handle:', finalHandle);
      console.log('BlueSky app password length:', cleanAppPassword?.length || 0);
      
      // Normalize handle - if it doesn't contain a dot, assume it's a username and add .bsky.social
      let normalizedHandle = finalHandle;
      if (!finalHandle.includes('.') && !finalHandle.includes('@')) {
        normalizedHandle = `${finalHandle}.bsky.social`;
        console.log('BlueSky normalized handle to:', normalizedHandle);
      }
      
      // Authenticate first - use the correct endpoint
      const authPayload = {
        identifier: normalizedHandle,
        password: cleanAppPassword
      };
      console.log('BlueSky auth payload:', JSON.stringify(authPayload, null, 2));
      
      const authResponse = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YallWeb/1.0'
        },
        body: JSON.stringify(authPayload)
      });

      if (!authResponse.ok) {
        let errorText = '';
        let errorData: any = {};
        
        try {
          errorText = await authResponse.text();
          console.error('BlueSky auth failed - Raw response:', errorText);
          
          try {
            errorData = JSON.parse(errorText);
            console.error('BlueSky auth failed - Parsed error:', errorData);
          } catch {
            console.error('BlueSky auth failed - Could not parse JSON, raw text:', errorText);
            errorData = { error: 'ParseError', message: errorText };
          }
        } catch (textError) {
          console.error('BlueSky auth failed - Could not read response text:', textError);
          errorText = 'Could not read error response';
          errorData = { error: 'ReadError', message: 'Could not read error response' };
        }
        
        console.error('BlueSky auth failed:', {
          status: authResponse.status,
          statusText: authResponse.statusText,
          headers: Object.fromEntries(authResponse.headers.entries()),
          errorText,
          errorData
        });
        
        if (authResponse.status === 401) {
          const message = errorData?.message || errorData?.error || 'Invalid credentials';
          return {
            success: false,
            error: `Invalid BlueSky credentials: ${message}. Please check your handle and app password.`
          };
        }
        
        return {
          success: false,
          error: `BlueSky authentication failed: ${authResponse.status} ${authResponse.statusText} - ${errorData?.message || errorData?.error || 'Unknown error'}`
        };
      }

      const authData = await authResponse.json();
      console.log('BlueSky auth successful, creating post...');

      // Create post record
      const postRecord: any = {
        $type: 'app.bsky.feed.post',
        text: content.text,
        createdAt: new Date().toISOString()
      };

      // Handle media attachments
      if (content.images && content.images.length > 0) {
        console.log('BlueSky: Attempting to upload', content.images.length, 'images');
        try {
          const embeds: any[] = [];
          
          for (const imageData of content.images) {
            const uploadResult = await ImageUploadService.uploadToBlueSky(imageData, authData.accessJwt);
            
            if (uploadResult.success && uploadResult.blob) {
              // Structure matches BlueSky AT Protocol specification
              embeds.push({
                alt: '', // Optional alt text - can be customized later
                image: uploadResult.blob, // Direct blob reference from upload
                aspectRatio: {
                  // Optional aspect ratio hint - you can calculate this from image dimensions
                  width: 1000,
                  height: 1000
                }
              });
              console.log('BlueSky image upload successful, blob:', uploadResult.blob);
            } else {
              console.warn('Failed to upload image to BlueSky:', uploadResult.error);
              // Continue with other images or post without this image
            }
          }
          
          if (embeds.length > 0) {
            postRecord.embed = {
              $type: 'app.bsky.embed.images',
              images: embeds
            };
            console.log('BlueSky post will include', embeds.length, 'images');
          } else {
            console.warn('No images uploaded successfully to BlueSky, posting text only');
          }
        } catch (error) {
          console.error('Error uploading images to BlueSky:', error);
          // Continue with text-only post
        }
      }

      // Create the post
      const postResponse = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.accessJwt}`,
          'Content-Type': 'application/json',
          'User-Agent': 'YallWeb/1.0'
        },
        body: JSON.stringify({
          repo: authData.did,
          collection: 'app.bsky.feed.post',
          record: postRecord
        })
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json().catch(() => ({}));
        console.error('BlueSky post failed:', postResponse.status, errorData);
        return {
          success: false,
          error: errorData.message || `HTTP ${postResponse.status}: ${postResponse.statusText}`
        };
      }

      const result = await postResponse.json();
      console.log('BlueSky post successful:', result.uri);

      return {
        success: true,
        postId: result.uri,
        url: `https://bsky.app/profile/${handle}/post/${result.uri.split('/').pop()}`
      };

    } catch (error: any) {
      console.error('BlueSky post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
