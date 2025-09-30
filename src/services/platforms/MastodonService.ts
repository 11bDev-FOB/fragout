import { BasePlatformService, Platform, TestResult, PostContent, PostResult } from './BasePlatformService';
import ImageUploadService from '../ImageUploadService';

export class MastodonService extends BasePlatformService {
  constructor() {
    const platform: Platform = {
      id: 'mastodon',
      name: 'Mastodon',
      requiresAuth: true,
      connectionTestUrl: '/api/v1/accounts/verify_credentials'
    };
    super(platform);
  }

  public async testConnection(credentials: Record<string, string>): Promise<TestResult> {
    const { instance_url, access_token } = credentials;

    if (!instance_url || !access_token) {
      return {
        success: false,
        message: 'Missing required credentials: instance_url and access_token'
      };
    }

    try {
      const baseUrl = instance_url.startsWith('http') ? instance_url : `https://${instance_url}`;
      const url = `${baseUrl}/api/v1/accounts/verify_credentials`;

      console.log('Testing Mastodon connection to:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FragOut/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Mastodon API error:', response.status, response.statusText);
        
        if (response.status === 401) {
          return {
            success: false,
            message: 'Invalid access token. Please check your Mastodon credentials.'
          };
        }
        
        if (response.status === 404) {
          return {
            success: false,
            message: 'Instance not found. Please check your Mastodon instance URL.'
          };
        }
        
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`
        };
      }

      const userData = await response.json();
      console.log('Mastodon connection test successful:', userData.username);

      return {
        success: true,
        message: `Successfully connected to @${userData.username}@${new URL(baseUrl).hostname}`,
        data: {
          username: userData.username,
          displayName: userData.display_name,
          instance: new URL(baseUrl).hostname
        }
      };

    } catch (error: any) {
      console.error('Mastodon connection test error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout. Please check your instance URL and try again.'
        };
      }

      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  public async post(content: PostContent, credentials: Record<string, string>): Promise<PostResult> {
    const { instance_url, access_token } = credentials;

    if (!instance_url || !access_token) {
      return {
        success: false,
        error: 'Missing required credentials: instance_url and access_token'
      };
    }

    try {
      const baseUrl = instance_url.startsWith('http') ? instance_url : `https://${instance_url}`;
      const url = `${baseUrl}/api/v1/statuses`;

      const postData: any = {
        status: content.text
      };

      // Handle media attachments if provided
      if (content.images && content.images.length > 0) {
        try {
          const mediaIds: string[] = [];
          
          for (const imageData of content.images) {
            const uploadResult = await ImageUploadService.uploadToMastodon(imageData, baseUrl, access_token);
            
            if (uploadResult.success && uploadResult.mediaId) {
              mediaIds.push(uploadResult.mediaId);
            } else {
              console.warn('Failed to upload image to Mastodon:', uploadResult.error);
              // Continue with other images or post without this image
            }
          }
          
          if (mediaIds.length > 0) {
            postData.media_ids = mediaIds;
          }
          
        } catch (error: any) {
          console.error('Error uploading images to Mastodon:', error);
          return {
            success: false,
            error: `Image upload failed: ${error.message}`
          };
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        postId: result.id,
        url: result.url || result.uri
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
