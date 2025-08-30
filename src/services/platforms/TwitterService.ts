import { BasePlatformService, Platform, TestResult, PostContent, PostResult } from './BasePlatformService';
import * as crypto from 'crypto-js';
import ImageUploadService from '../ImageUploadService';
import * as CryptoJS from 'crypto-js';

export class TwitterService extends BasePlatformService {
  constructor() {
    const platform: Platform = {
      id: 'twitter',
      name: 'Twitter/X',
      requiresAuth: true,
      connectionTestUrl: '/2/users/me'
    };
    super(platform);
  }

  public async testConnection(credentials: Record<string, string>): Promise<TestResult> {
    // Check if using OAuth 1.0a or Bearer Token
    const { api_key, api_secret, access_token, access_token_secret, bearerToken } = credentials;

    // Try OAuth 1.0a first (more reliable for posting)
    if (api_key && api_secret && access_token && access_token_secret) {
      // Test with OAuth 1.0a
      return this.testWithOAuth1a(api_key, api_secret, access_token, access_token_secret);
    } else if (bearerToken) {
      // Test with Bearer Token (OAuth 2.0)
      return this.testWithBearerToken(bearerToken);
    } else {
      return {
        success: false,
        message: 'Missing required credentials. Provide either (api_key + api_secret + access_token + access_token_secret) OR bearerToken'
      };
    }
  }

  private async testWithBearerToken(bearerToken: string): Promise<TestResult> {
    try {
      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'User-Agent': 'YallWeb/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            message: 'Invalid bearer token. Please check your Twitter API credentials.'
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            message: 'Access forbidden. This Bearer Token may be App-Only. For posting tweets, you need a User Context Bearer Token.'
          };
        }

        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`
        };
      }

      const userData = await response.json();

      return {
        success: true,
        message: `Successfully connected to Twitter as @${userData.data.username}`,
        data: {
          username: userData.data.username,
          name: userData.data.name
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  private async testWithOAuth1a(apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string): Promise<TestResult> {
    try {
      const authHeader = this.generateOAuth1aHeader(
        'GET',
        'https://api.twitter.com/2/users/me',
        {},
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret
      );

      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'YallWeb/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            message: 'Invalid OAuth 1.0a credentials. Please check your API keys and tokens.'
          };
        }

        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`
        };
      }

      const userData = await response.json();

      return {
        success: true,
        message: `Successfully connected to Twitter as @${userData.data.username} (OAuth 1.0a)`,
        data: {
          username: userData.data.username,
          name: userData.data.name
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
    console.log('Twitter post called with credentials keys:', Object.keys(credentials));
    const { api_key, api_secret, access_token, access_token_secret, bearerToken } = credentials;

    // Try OAuth 1.0a first (more reliable for posting)
    if (api_key && api_secret && access_token && access_token_secret) {
      // Use OAuth 1.0a
      return this.postWithOAuth1a(content, api_key, api_secret, access_token, access_token_secret);
    } else if (bearerToken) {
      // Fallback to Bearer Token
      return this.postWithBearerToken(content, bearerToken, credentials);
    } else {
      console.error('Twitter missing credentials');
      return {
        success: false,
        error: 'Missing required credentials. Provide either (api_key + api_secret + access_token + access_token_secret) OR bearerToken'
      };
    }
  }

  private async postWithBearerToken(content: PostContent, bearerToken: string, credentials?: Record<string, string>): Promise<PostResult> {
    try {
      const postData: any = {
        text: content.text
      };

      // Handle media attachments if provided
      if (content.images && content.images.length > 0) {
        console.log('Twitter Bearer Token: Attempting to upload', content.images.length, 'images');
        try {
          const mediaIds: string[] = [];
          
          for (const imageData of content.images) {
            // Try OAuth 1.0a for media upload if available, otherwise use Bearer Token
            const uploadCredentials = credentials ? {
              bearerToken,
              consumerKey: credentials.api_key,
              consumerSecret: credentials.api_secret,
              accessToken: credentials.access_token,
              accessTokenSecret: credentials.access_token_secret
            } : { bearerToken };
            
            const uploadResult = await ImageUploadService.uploadToTwitter(imageData, uploadCredentials);
            
            if (uploadResult.success && uploadResult.mediaId) {
              mediaIds.push(uploadResult.mediaId);
              console.log('Twitter image upload successful, media ID:', uploadResult.mediaId);
            } else {
              console.warn('Failed to upload image to Twitter:', uploadResult.error);
              // Continue with other images or post without this image
            }
          }
          
          if (mediaIds.length > 0) {
            postData.media = { media_ids: mediaIds };
            console.log('Twitter post will include media IDs:', mediaIds);
          } else {
            console.warn('No images uploaded successfully, posting text only');
          }
        } catch (error) {
          console.error('Error uploading images to Twitter:', error);
          // Continue with text-only post
        }
      }

      console.log('Twitter posting with Bearer Token...');
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Twitter post failed:', response.status, errorData);
        
        if (response.status === 403 && errorData.detail?.includes('OAuth 2.0 Application-Only is forbidden')) {
          return {
            success: false,
            error: 'Twitter requires an OAuth 2.0 User Context Bearer Token for posting tweets. App-Only tokens cannot post tweets. Please generate a User Context Bearer Token from your Twitter Developer Portal.'
          };
        }
        
        return {
          success: false,
          error: errorData.detail || errorData.title || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      console.log('Twitter post successful:', result.data.id);

      return {
        success: true,
        postId: result.data.id,
        url: `https://twitter.com/i/status/${result.data.id}`
      };

    } catch (error: any) {
      console.error('Twitter post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async postWithOAuth1a(content: PostContent, apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string): Promise<PostResult> {
    try {
      const postData: any = {
        text: content.text
      };

      // Handle media attachments if provided
      if (content.images && content.images.length > 0) {
        try {
          const mediaIds: string[] = [];
          
          for (const imageData of content.images) {
            // For OAuth 1.0a, we need to warn that Bearer Token is preferred for image uploads
            const uploadResult = await ImageUploadService.uploadToTwitter(imageData, { 
              consumerKey: apiKey,
              consumerSecret: apiSecret,
              accessToken: accessToken,
              accessTokenSecret: accessTokenSecret
            });
            
            if (uploadResult.success && uploadResult.mediaId) {
              mediaIds.push(uploadResult.mediaId);
            } else {
              console.warn('Failed to upload image to Twitter OAuth 1.0a:', uploadResult.error);
              return {
                success: false,
                error: `Image upload failed: ${uploadResult.error}. Consider using Bearer Token for image uploads.`
              };
            }
          }
          
          if (mediaIds.length > 0) {
            postData.media = { media_ids: mediaIds };
          }
        } catch (error) {
          console.error('Error uploading images to Twitter OAuth 1.0a:', error);
          return {
            success: false,
            error: 'Image upload failed with OAuth 1.0a. Consider using Bearer Token for image uploads.'
          };
        }
      }

      console.log('Twitter posting with OAuth 1.0a...');
      
      const authHeader = this.generateOAuth1aHeader(
        'POST',
        'https://api.twitter.com/2/tweets',
        {},
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret
      );

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Twitter OAuth 1.0a post failed:', response.status, errorData);
        
        return {
          success: false,
          error: errorData.detail || errorData.title || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      console.log('Twitter OAuth 1.0a post successful:', result.data.id);

      return {
        success: true,
        postId: result.data.id,
        url: `https://twitter.com/i/status/${result.data.id}`
      };

    } catch (error: any) {
      console.error('Twitter OAuth 1.0a post error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private generateOAuth1aHeader(
    method: string,
    url: string,
    params: Record<string, string>,
    apiKey: string,
    apiSecret: string,
    accessToken: string,
    accessTokenSecret: string
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: accessToken,
      oauth_version: '1.0'
    };

    // Combine OAuth params with request params
    const allParams = { ...params, ...oauthParams };

    // Create parameter string
    const paramString = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    // Create signature base string
    const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessTokenSecret)}`;

    // Generate signature
    const signature = CryptoJS.HmacSHA1(signatureBase, signingKey).toString(CryptoJS.enc.Base64);

    // Create authorization header
    const authParams: Record<string, string> = {
      ...oauthParams,
      oauth_signature: signature
    };

    const authHeader = 'OAuth ' + Object.keys(authParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(authParams[key])}"`)
      .join(', ');

    return authHeader;
  }
}
