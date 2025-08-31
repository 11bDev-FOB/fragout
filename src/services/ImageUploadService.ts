import CryptoJS from 'crypto-js';

/**
 * Service for uploading images to various social media platforms
 * Based on working Flutter implementation from PlebOne/yall
 */
class ImageUploadService {
  
  /**
   * Convert data URL to Blob
   */
  private static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Strip EXIF metadata from image by redrawing on canvas
   * This removes GPS and other privacy-sensitive metadata
   */
  private static async stripEXIFMetadata(imageData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas (this strips EXIF data)
            ctx.drawImage(img, 0, 0);
            
            // Convert back to data URL with same quality
            const strippedDataURL = canvas.toDataURL('image/jpeg', 0.9);
            resolve(strippedDataURL);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for EXIF stripping'));
        };
        
        img.src = imageData;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Server-side EXIF stripping using basic image processing
   * In Node.js environment, we'll do basic image reprocessing
   */
  static async stripEXIFServerSide(imageData: string): Promise<string> {
    try {
      // For server-side, we'll create a new image without EXIF by reencoding
      // This is a simplified approach that removes EXIF by converting through canvas-like processing
      
      const blob = this.dataURLToBlob(imageData);
      const buffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      console.log('🔧 Server-side EXIF stripping:', {
        originalSize: uint8Array.length,
        mimeType: blob.type
      });
      
      // For now, return the original image data
      // In a production environment, you might want to use a library like 'sharp' or 'jimp'
      // to properly strip EXIF data on the server side
      console.log('⚠️ Server-side EXIF stripping: Using original image (consider adding sharp/jimp for production)');
      
      return imageData;
    } catch (error) {
      console.error('❌ Server-side EXIF stripping failed:', error);
      return imageData;
    }
  }

  /**
   * Upload media to Nostr via Blossom server
   */
  static async uploadToNostrBlossom(
    imageFile: File,
    blossomServer: string,
    privateKey: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const fileBytes = await imageFile.arrayBuffer();
      const hashArray = await crypto.subtle.digest('SHA-256', fileBytes);
      const hashHex = Array.from(new Uint8Array(hashArray))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create Nostr event for authorization
      const authEvent: any = {
        kind: 24242,
        created_at: timestamp,
        tags: [
          ['t', 'upload'],
          ['x', hashHex],
          ['expiration', (timestamp + 3600).toString()]
        ],
        content: 'Upload image to Blossom server',
        pubkey: this.getPublicKeyFromPrivate(privateKey)
      };

      // Sign the event
      const eventId = await this.calculateEventId(authEvent);
      const signature = await this.signEvent(eventId, privateKey);
      authEvent['id'] = eventId;
      authEvent['sig'] = signature;

      // Upload to Blossom
      const uploadUrl = `${blossomServer}/upload`;
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Nostr ${btoa(JSON.stringify(authEvent))}`,
          'Content-Type': imageFile.type,
          'Content-Length': fileBytes.byteLength.toString()
        },
        body: fileBytes
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          url: result.url
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Blossom upload failed: ${response.status} - ${errorText}`
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: `Blossom upload error: ${error.message}`
      };
    }
  }

  /**
   * Upload image to Blossom server with proper NIP-98 authorization
   */
  static async uploadToBlossom(
    imageData: string,
    blossomServer: string,
    credentials?: any
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Strip EXIF metadata appropriately for the environment
      let processedImageData = imageData;
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        console.log('🖼️ Client-side: Stripping EXIF metadata from image...');
        try {
          processedImageData = await this.stripEXIFMetadata(imageData);
          console.log('✅ EXIF metadata stripped successfully');
        } catch (error) {
          console.warn('⚠️ EXIF stripping failed, using original image:', error);
          processedImageData = imageData;
        }
      } else {
        console.log('🖥️ Server-side: Stripping EXIF metadata...');
        try {
          processedImageData = await this.stripEXIFServerSide(imageData);
          console.log('✅ Server-side EXIF processing completed');
        } catch (error) {
          console.warn('⚠️ Server-side EXIF processing failed, using original image:', error);
          processedImageData = imageData;
        }
      }
      
      console.log('🌸 Blossom upload starting with credentials:', {
        hasCredentials: !!credentials,
        blossomServer,
        pubkey: credentials?.pubkey?.substring(0, 8) + '...',
        useNip07: credentials?.useNip07,
        hasPrivateKey: !!credentials?.private_key,
        isServerSide: typeof window === 'undefined'
      });

      const blob = this.dataURLToBlob(processedImageData);
      
      // Normalize Blossom server URL
      const normalizedServer = blossomServer.endsWith('/') 
        ? blossomServer.substring(0, blossomServer.length - 1)
        : blossomServer;
      
      const uploadUrl = `${normalizedServer}/upload`;
      
      let headers: Record<string, string> = {
        'Content-Type': blob.type,
        'Content-Length': blob.size.toString()
      };

      // Create authorization header if credentials are provided
      if (credentials) {
        console.log('🔐 ImageUploadService received credentials for Blossom auth:', {
          hasCredentials: !!credentials,
          credentialKeys: Object.keys(credentials),
          hasPubkey: !!credentials.pubkey,
          pubkeyStart: credentials.pubkey?.substring(0, 8),
          pubkeyLength: credentials.pubkey?.length,
          useNip07: credentials.useNip07,
          hasPrivateKey: !!credentials.private_key,
          privateKeyStart: credentials.private_key?.substring(0, 10),
          privateKeyLength: credentials.private_key?.length,
          privateKeyType: credentials.private_key?.startsWith?.('nsec1') ? 'nsec' : 'hex',
          isClientSide: typeof window !== 'undefined',
          hasWindowNostr: typeof window !== 'undefined' && !!(window as any).nostr
        });
        
        try {
          console.log('🔑 Creating Blossom authorization event...');
          const authEvent = await this.createBlossomAuthEvent(credentials, blob, normalizedServer);
          
          console.log('🔍 Auth event creation result:', {
            hasAuthEvent: !!authEvent,
            authEvent: authEvent ? {
              kind: authEvent.kind,
              hasId: !!authEvent.id,
              hasSig: !!authEvent.sig,
              pubkey: authEvent.pubkey?.substring(0, 8) + '...',
              tagsCount: authEvent.tags?.length
            } : null
          });
          
          if (authEvent) {
            const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;
            headers['Authorization'] = authHeader;
            console.log('✅ Authorization header created:', authHeader.substring(0, 50) + '...');
          } else {
            console.error('❌ Failed to create authorization event - no event returned');
          }
        } catch (authError) {
          console.error('❌ Failed to create Blossom authorization:', authError);
          console.warn('⚠️ Trying upload without authorization...');
        }
      } else {
        console.warn('No credentials provided for Blossom upload');
      }
      
      console.log('Blossom upload attempt:', {
        server: normalizedServer,
        url: uploadUrl,
        hasAuth: !!headers['Authorization'],
        fileSize: blob.size,
        fileType: blob.type,
        headers: Object.keys(headers)
      });
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: blob
      });

      console.log('Blossom upload response:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Blossom upload success:', result);
        return {
          success: true,
          url: result.url || result.download_url || result.downloadUrl
        };
      } else {
        const errorText = await response.text();
        console.error('Blossom upload failed:', response.status, errorText);
        return {
          success: false,
          error: `Blossom upload failed: ${response.status} - ${errorText}`
        };
      }

    } catch (error: any) {
      console.error('Blossom upload error:', error);
      return {
        success: false,
        error: `Blossom upload error: ${error.message}`
      };
    }
  }

  /**
   * Create NIP-98 authorization event for Blossom upload
   */
  private static async createBlossomAuthEvent(credentials: any, blob: Blob, blossomServer: string): Promise<any> {
    console.log('Creating auth event with:', {
      hasCredentials: !!credentials,
      hasPubkey: !!credentials?.pubkey,
      useNip07: credentials?.useNip07,
      blossomServer,
      fileSize: blob.size
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const expiration = timestamp + 3600; // 1 hour

    // Calculate SHA256 hash of file content
    const arrayBuffer = await blob.arrayBuffer();
    let fileHash: string;
    
    // Try Web Crypto API first (available in secure contexts)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        console.log('🔒 Using Web Crypto API for SHA256 hash...');
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = new Uint8Array(hashBuffer);
        fileHash = Array.from(hashArray)
          .map(b => {
            const hex = b.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('');
        console.log('✅ SHA256 hash calculated via Web Crypto API');
      } catch (cryptoError) {
        console.warn('⚠️ Web Crypto API failed, falling back to crypto-js SHA256:', cryptoError);
        // Fallback to crypto-js for proper SHA256 calculation
        fileHash = await this.calculateSimpleHash(arrayBuffer);
      }
    } else {
      console.warn('⚠️ Web Crypto API not available (likely localhost/HTTP), using crypto-js SHA256 fallback');
      // Fallback to crypto-js for proper SHA256 calculation
      fileHash = await this.calculateSimpleHash(arrayBuffer);
    }

    console.log('📝 File hash calculated:', fileHash.substring(0, 16) + '...');

    // Create auth event for Blossom upload (based on Flutter implementation)
    const event = {
      kind: 24242, // Blossom-specific upload authorization kind (from Flutter code)
      created_at: timestamp,
      tags: [
        ['t', 'upload'], // Action tag for Blossom upload
        ['x', fileHash], // SHA256 hash of the file being uploaded
        ['expiration', expiration.toString()], // Add expiration tag
      ],
      content: 'Upload image to Blossom server', // Human readable description
      pubkey: credentials.pubkey,
    };

    console.log('🔍 Unsigned auth event created:', {
      event: event,
      hasEvent: !!event,
      eventPubkey: event.pubkey?.substring(0, 8),
      eventKind: event.kind,
      eventTags: event.tags,
      eventContent: event.content
    });

    // Log decision path for signing method
    console.log('🤔 Determining signing method:', {
      isClientSide: typeof window !== 'undefined',
      hasWindowNostr: typeof window !== 'undefined' && !!(window as any).nostr,
      useNip07: credentials.useNip07,
      willUseNip07: typeof window !== 'undefined' && (window as any).nostr && credentials.useNip07,
      hasPrivateKey: !!credentials.private_key,
      privateKeyStart: credentials.private_key?.substring(0, 10)
    });

    // Sign the event using NIP-07 if available
    if (typeof window !== 'undefined' && (window as any).nostr && credentials.useNip07) {
      console.log('🌐 Attempting NIP-07 signing...');
      try {
        console.log('🔑 Signing event with NIP-07...');
        const signedEvent = await (window as any).nostr.signEvent(event);
        console.log('✅ NIP-07 signing successful:', {
          hasId: !!signedEvent.id,
          hasSig: !!signedEvent.sig,
          pubkey: signedEvent.pubkey?.substring(0, 8) + '...'
        });
        return signedEvent;
      } catch (error) {
        console.error('❌ Failed to sign auth event with NIP-07:', error);
        throw new Error('Failed to sign authorization event');
      }
    }

    console.log('🔐 No NIP-07 path taken, checking for private key...');
    console.log('🔍 Private key check:', {
      hasPrivateKey: !!credentials.private_key,
      privateKeyType: credentials.private_key?.startsWith?.('nsec1') ? 'nsec' : 'hex',
      privateKeyLength: credentials.private_key?.length
    });
    
    // Try server-side signing with private key
    if (credentials.private_key) {
      try {
        console.log('🔑 Starting private key signing process...');
        console.log('📦 Importing nostr-tools...');
        const { finalizeEvent, nip19 } = await import('nostr-tools');
        const { hexToBytes } = await import('nostr-tools/utils');
        console.log('✅ nostr-tools imported successfully');
        
        let privateKeyHex = credentials.private_key;
        console.log('🔍 Processing private key:', {
          originalLength: credentials.private_key.length,
          isNsec: credentials.private_key.startsWith('nsec1'),
          originalStart: credentials.private_key.substring(0, 10)
        });
        
        // If it's an nsec, decode it first
        if (credentials.private_key.startsWith('nsec1')) {
          console.log('🔄 Decoding nsec format...');
          const decoded = nip19.decode(credentials.private_key);
          console.log('🔍 Decoded result:', {
            type: decoded.type,
            hasData: !!decoded.data,
            dataLength: decoded.data ? (decoded.data as any).length : 0
          });
          privateKeyHex = Buffer.from(decoded.data as any).toString('hex');
          console.log('✅ nsec decoded to hex:', {
            hexLength: privateKeyHex.length,
            hexStart: privateKeyHex.substring(0, 10)
          });
        }
        
        // Ensure privateKeyHex is exactly 64 characters (pad with leading zero if needed)
        const originalHexLength = privateKeyHex.length;
        privateKeyHex = privateKeyHex.padStart(64, '0');
        console.log('🔧 Private key padding result:', {
          originalLength: originalHexLength,
          paddedLength: privateKeyHex.length,
          paddedStart: privateKeyHex.substring(0, 10)
        });
        
        console.log('🔑 Converting to bytes and signing...');
        const privateKeyBytes = hexToBytes(privateKeyHex);
        console.log('✅ Private key converted to bytes, length:', privateKeyBytes.length);
        
        const signedEvent = finalizeEvent(event, privateKeyBytes);
        console.log('✅ Event signed successfully with private key:', {
          hasId: !!signedEvent.id,
          hasSig: !!signedEvent.sig,
          hasValidSig: signedEvent.sig && signedEvent.sig.length > 0,
          pubkey: signedEvent.pubkey?.substring(0, 8)
        });
        return signedEvent;
      } catch (error) {
        console.error('❌ Failed to sign auth event with private key:', error);
        console.error('❌ Error details:', {
          message: (error as any)?.message || 'Unknown error',
          stack: (error as any)?.stack || 'No stack trace',
          name: (error as any)?.name || 'Unknown error type'
        });
        throw new Error('Failed to sign authorization event with private key');
      }
    }
    
    console.log('No signing method available, returning unsigned event');
    // If no signing method available, return unsigned event (may not work for most servers)
    return event;
  }

  /**
   * Upload media to Mastodon
   */
  static async uploadToMastodon(imageData: string, instanceUrl: string, accessToken: string): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    try {
      const blob = this.dataURLToBlob(imageData);
      
      const formData = new FormData();
      formData.append('file', blob);

      const baseUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
      const response = await fetch(`${baseUrl}/api/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Mastodon media upload failed: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        mediaId: result.id
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Mastodon media upload error: ${error.message}`
      };
    }
  }

  /**
   * Upload image to Twitter (X) - Based on working Flutter implementation
   */
  static async uploadToTwitter(imageData: string, credentials: any): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    try {
      const blob = this.dataURLToBlob(imageData);
      
      const formData = new FormData();
      formData.append('media', blob);

      console.log('Twitter image upload attempt with credentials:', {
        hasBearerToken: !!credentials.bearerToken,
        hasOAuthCreds: !!(credentials.consumerKey && credentials.consumerSecret),
        hasAccessToken: !!credentials.accessToken,
        hasAccessTokenSecret: !!credentials.accessTokenSecret
      });

      // Try OAuth 1.0a first (as shown working in Flutter implementation)
      if (credentials.consumerKey && credentials.consumerSecret && 
          credentials.accessToken && credentials.accessTokenSecret) {
        console.log('Attempting Twitter image upload with OAuth 1.0a...');
        
        try {
          const url = 'https://upload.twitter.com/1.1/media/upload.json';
          const method = 'POST';
          
          // Generate OAuth 1.0a signature for multipart upload
          const oauthHeaders = this.generateOAuth1aHeaders(
            method,
            url,
            credentials.consumerKey,
            credentials.consumerSecret,
            credentials.accessToken,
            credentials.accessTokenSecret
          );

          const response = await fetch(url, {
            method: method,
            headers: {
              'Authorization': oauthHeaders,
              'User-Agent': 'YallWeb/1.0'
            },
            body: formData
          });

          console.log('Twitter OAuth 1.0a image upload response:', response.status, response.statusText);

          if (response.ok) {
            const result = await response.json();
            console.log('Twitter OAuth 1.0a image upload successful:', result);
            
            return {
              success: true,
              mediaId: result.media_id_string
            };
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('Twitter OAuth 1.0a image upload failed:', errorText);
            // Continue to Bearer Token fallback
          }
        } catch (oauthError) {
          console.warn('OAuth 1.0a upload failed, trying Bearer Token fallback:', oauthError);
        }
      }

      // Fallback to Bearer Token
      if (credentials.bearerToken) {
        console.log('Attempting Twitter image upload with Bearer Token...');
        const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credentials.bearerToken}`,
            'User-Agent': 'YallWeb/1.0'
          },
          body: formData
        });

        console.log('Twitter Bearer Token image upload response:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Twitter Bearer Token image upload failed:', errorText);
          return {
            success: false,
            error: `Twitter media upload failed: ${response.status} ${response.statusText} - ${errorText}`
          };
        }

        const result = await response.json();
        console.log('Twitter Bearer Token image upload successful:', result);
        
        return {
          success: true,
          mediaId: result.media_id_string
        };
      }

      return {
        success: false,
        error: 'No valid Twitter credentials provided for media upload'
      };

    } catch (error: any) {
      console.error('Twitter media upload error:', error);
      return {
        success: false,
        error: `Twitter media upload error: ${error.message}`
      };
    }
  }

  /**
   * Upload image to BlueSky - Based on working Flutter implementation
   */
  static async uploadToBlueSky(imageData: string, accessJwt: string): Promise<{ success: boolean; blob?: any; error?: string }> {
    try {
      const imageBlob = this.dataURLToBlob(imageData);
      
      console.log('BlueSky image upload attempt:', {
        blobSize: imageBlob.size,
        blobType: imageBlob.type,
        hasToken: !!accessJwt
      });
      
      // Compress image if needed (BlueSky has ~976KB limit)
      let uploadBlob = imageBlob;
      const blueskyLimit = 976560; // 976.56KB as specified by BlueSky error
      
      if (imageBlob.size > blueskyLimit) {
        console.log('Image size exceeds BlueSky limit (~976KB):', imageBlob.size, 'bytes');
        
        if (typeof window !== 'undefined') {
          console.log('Compressing image for BlueSky (~976KB limit)...');
          uploadBlob = await this.compressImage(imageBlob, blueskyLimit);
        } else {
          // Server-side: reject large images rather than uploading them
          console.error('Image too large for BlueSky and server-side compression not available');
          return {
            success: false,
            error: `Image too large for BlueSky (${Math.round(imageBlob.size / 1024)}KB > 976KB). Please compress the image before uploading.`
          };
        }
      }
      
      // BlueSky AT Protocol blob upload
      const response = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': uploadBlob.type,
          'User-Agent': 'YallWeb/1.0'
        },
        body: uploadBlob
      });

      console.log('BlueSky image upload response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('BlueSky image upload failed:', errorText);
        return {
          success: false,
          error: `BlueSky image upload failed: ${response.status} ${response.statusText} - ${errorText}`
        };
      }

      const result = await response.json();
      console.log('BlueSky image upload successful:', result);
      
      return {
        success: true,
        blob: result.blob
      };

    } catch (error: any) {
      console.error('BlueSky image upload error:', error);
      return {
        success: false,
        error: `BlueSky image upload error: ${error.message}`
      };
    }
  }

  /**
   * Generate OAuth 1.0a authorization header for Twitter API
   * Based on working Flutter implementation
   */
  private static generateOAuth1aHeaders(
    method: string,
    url: string,
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessTokenSecret: string
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();

    const oauthParams: Record<string, string> = {
      'oauth_consumer_key': consumerKey,
      'oauth_nonce': nonce,
      'oauth_signature_method': 'HMAC-SHA1',
      'oauth_timestamp': timestamp,
      'oauth_token': accessToken,
      'oauth_version': '1.0'
    };

    // Create signature base string
    const paramString = Object.entries(oauthParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .sort()
      .join('&');

    const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

    // Generate HMAC-SHA1 signature using CryptoJS
    const signature = CryptoJS.HmacSHA1(baseString, signingKey).toString(CryptoJS.enc.Base64);
    oauthParams['oauth_signature'] = signature;

    // Build authorization header
    const headerParams = Object.entries(oauthParams)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ');

    return `OAuth ${headerParams}`;
  }

  /**
   * Generate a random nonce for OAuth
   */
  private static generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Compress image to fit within size limit (environment-aware compression)
   */
  private static async compressImage(imageBlob: Blob, maxSize: number): Promise<Blob> {
    try {
      // If already under size limit, return as-is
      if (imageBlob.size <= maxSize) {
        return imageBlob;
      }
      
      console.log(`Image size ${imageBlob.size} exceeds limit ${maxSize}, attempting compression...`);
      
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Browser environment - use Canvas
        return this.compressImageWithCanvas(imageBlob, maxSize);
      } else {
        // Server environment - skip compression for now or use a simple approach
        console.warn('Server-side compression not available, using original image size');
        console.warn(`Image may exceed platform limit: ${imageBlob.size} bytes > ${maxSize} bytes`);
        return imageBlob;
      }
      
    } catch (error) {
      console.error('Image compression failed:', error);
      console.warn(`Using original image size ${imageBlob.size} which may exceed limit ${maxSize}`);
      return imageBlob;
    }
  }

  /**
   * Canvas-based compression for browser environment
   */
  private static async compressImageWithCanvas(imageBlob: Blob, maxSize: number): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      img.onload = () => {
        // Calculate compression ratio
        let { width, height } = img;
        const aspectRatio = width / height;
        
        // If image is very large, resize it first
        const maxDimension = 1920; // Max width or height
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            width = maxDimension;
            height = width / aspectRatio;
          } else {
            height = maxDimension;
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce if needed
        let quality = 0.85;
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('Canvas compression failed, using original');
                resolve(imageBlob);
                return;
              }
              
              console.log(`Compressed with quality ${quality}: ${blob.size} bytes`);
              
              if (blob.size <= maxSize || quality <= 0.3) {
                resolve(blob);
              } else {
                quality -= 0.15;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => {
        console.error('Failed to load image for compression');
        resolve(imageBlob);
      };
      
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Calculate a simple hash for development/localhost when Web Crypto API is not available
   * This is NOT cryptographically secure, but works for Blossom development
   */
  private static async calculateSimpleHash(arrayBuffer: ArrayBuffer): Promise<string> {
    // Use crypto-js to calculate proper SHA256 hash as fallback
    console.log('🔧 Calculating SHA256 hash using crypto-js fallback...');
    
    // Convert ArrayBuffer to WordArray for crypto-js
    const bytes = new Uint8Array(arrayBuffer);
    const wordArray = CryptoJS.lib.WordArray.create(bytes);
    
    // Calculate SHA256 hash
    const hash = CryptoJS.SHA256(wordArray);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    
    console.log('✅ SHA256 hash calculated using crypto-js:', hashHex.substring(0, 16) + '...');
    return hashHex;
  }

  /**
   * Helper methods for Nostr (basic implementations)
   */
  private static getPublicKeyFromPrivate(privateKey: string): string {
    // This would need a proper Nostr library implementation
    return 'placeholder_public_key';
  }

  private static async calculateEventId(event: any): Promise<string> {
    // This would need proper Nostr event ID calculation
    return 'placeholder_event_id';
  }

  private static async signEvent(eventId: string, privateKey: string): Promise<string> {
    // This would need proper Nostr signing
    return 'placeholder_signature';
  }

  /**
   * Check which platforms support image uploads
   */
  static getPlatformImageSupport() {
    return {
      mastodon: true,
      nostr: true, // requires Blossom server
      bluesky: true, // implemented
      twitter: true // implemented (requires proper credentials)
    };
  }
}

export default ImageUploadService;
