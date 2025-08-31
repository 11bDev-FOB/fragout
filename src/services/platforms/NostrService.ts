import { BasePlatformService, Platform, TestResult, PostContent, PostResult } from './BasePlatformService';
import ImageUploadService from '../ImageUploadService';
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent, nip19 } from 'nostr-tools';
import { hexToBytes } from 'nostr-tools/utils';
import { Relay } from 'nostr-tools/relay';

export class NostrService extends BasePlatformService {
  constructor() {
    const platform: Platform = {
      id: 'nostr',
      name: 'Nostr',
      requiresAuth: true
    };
    super(platform);
  }

  public async testConnection(credentials: Record<string, string>): Promise<TestResult> {
    const { pubkey, blossom_server, method } = credentials;

    // Handle NIP-07 method
    if (method === 'nip07') {
      if (typeof window !== 'undefined' && (window as any).nostr) {
        try {
          const nip07Pubkey = await (window as any).nostr.getPublicKey();
          
          // Validate blossom server if provided
          if (blossom_server && blossom_server.trim()) {
            try {
              new URL(blossom_server);
            } catch (error) {
              return {
                success: false,
                message: 'Invalid Blossom server URL format'
              };
            }
          }
          
          return {
            success: true,
            message: `Successfully connected via NIP-07 extension${blossom_server ? ' with Blossom server configured' : ''}`,
            data: {
              pubkey: nip07Pubkey,
              method: 'nip07',
              blossom_server
            }
          };
        } catch (error: any) {
          return {
            success: false,
            message: `NIP-07 error: ${error.message}`
          };
        }
      } else {
        return {
          success: false,
          message: 'NIP-07 extension not found'
        };
      }
    }

    // Handle traditional pubkey method
    if (!pubkey) {
      return {
        success: false,
        message: 'Missing required credential: pubkey'
      };
    }

    // Basic validation of pubkey format
    if (!/^[a-fA-F0-9]{64}$/.test(pubkey)) {
      return {
        success: false,
        message: 'Invalid pubkey format. Must be 64 hex characters.'
      };
    }

    // Validate blossom server if provided
    if (blossom_server && blossom_server.trim()) {
      try {
        new URL(blossom_server);
      } catch (error) {
        return {
          success: false,
          message: 'Invalid Blossom server URL format'
        };
      }
    }

    // Check if NIP-07 extension is available (browser context)
    if (typeof window !== 'undefined' && (window as any).nostr) {
      try {
        const nip07Pubkey = await (window as any).nostr.getPublicKey();
        
        if (nip07Pubkey === pubkey) {
          return {
            success: true,
            message: 'Successfully connected via NIP-07 browser extension',
            data: {
              pubkey: nip07Pubkey,
              method: 'nip07'
            }
          };
        } else {
          return {
            success: false,
            message: 'NIP-07 pubkey does not match provided pubkey'
          };
        }
      } catch (error: any) {
        return {
          success: false,
          message: `NIP-07 error: ${error.message}`
        };
      }
    }

    // If no NIP-07, just validate the pubkey format
    return {
      success: true,
      message: 'Pubkey format validated (NIP-07 not available in server context)',
      data: {
        pubkey,
        method: 'direct'
      }
    };
  }

  public async post(content: PostContent, credentials: Record<string, string>): Promise<PostResult> {
    const { pubkey, private_key, relays, blossom_server, method } = credentials;

    // PWA Debug: Log all credentials and environment info
    console.log('🔍 NostrService.post() DEBUG - PWA Environment Check:', {
      isPWA: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
      isWebApp: typeof window !== 'undefined' && (window.navigator as any).standalone === true,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      hasWindowNostr: typeof window !== 'undefined' && !!(window as any).nostr,
      method: method,
      methodType: typeof method,
      hasPubkey: !!pubkey,
      hasPrivateKey: !!private_key,
      privateKeyType: private_key?.startsWith?.('nsec1') ? 'nsec' : private_key ? 'hex' : 'none',
      blossomServer: blossom_server,
      credentialKeys: Object.keys(credentials),
      allCredentials: credentials
    });

    // Get user's relay configuration - use default relays for now
    let userRelays: string[] = relays ? (Array.isArray(relays) ? relays : [relays]) : [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band'
    ];

    // Auto-derive pubkey from private key if missing
    let eventPubkey = pubkey;
    if (!eventPubkey && private_key && method !== 'nip07') {
      try {
        const { getPublicKey } = require('nostr-tools');
        const { nip19 } = require('nostr-tools');
        
        let privateKeyHex = private_key;
        // If it's an nsec, decode it first
        if (private_key.startsWith('nsec1')) {
          const decoded = nip19.decode(private_key);
          privateKeyHex = Buffer.from(decoded.data as Uint8Array).toString('hex');
        }
        
        // Ensure privateKeyHex is exactly 64 characters (pad with leading zero if needed)
        privateKeyHex = privateKeyHex.padStart(64, '0');

        eventPubkey = getPublicKey(Buffer.from(privateKeyHex, 'hex'));
        console.log('Auto-derived pubkey from private key');
      } catch (error) {
        console.error('Failed to derive pubkey from private key:', error);
        return {
          success: false,
          error: 'Invalid private key format'
        };
      }
    }

    // For NIP-07 method, we don't need a stored pubkey
    if (method === 'nip07') {
      if (typeof window === 'undefined' || !(window as any).nostr) {
        return {
          success: false,
          error: 'NIP-07 extension not available'
        };
      }
    } else if (!eventPubkey) {
      return {
        success: false,
        error: 'Missing required credential: pubkey'
      };
    }

    // Check if images are provided but no Blossom server
    if (content.images && content.images.length > 0 && !blossom_server) {
      return {
        success: false,
        error: 'Blossom server is required for image uploads. Please configure a Blossom server in your Nostr settings.'
      };
    }

    try {
      let eventContent = content.text;
      const tags: string[][] = [];
      // Note: eventPubkey already set above (either from pubkey or auto-derived from private_key)

      // Get pubkey from NIP-07 if using that method
      if (method === 'nip07') {
        try {
          eventPubkey = await (window as any).nostr.getPublicKey();
        } catch (error: any) {
          return {
            success: false,
            error: `Failed to get pubkey from NIP-07: ${error.message}`
          };
        }
      }

      // Handle image uploads if provided
      if (content.images && content.images.length > 0 && blossom_server) {
        console.log('🖼️ Starting Nostr image upload process:', {
          imageCount: content.images.length,
          blossomServer: blossom_server,
          method: method,
          hasEventPubkey: !!eventPubkey,
          eventPubkeyStart: eventPubkey?.substring(0, 8),
          hasPrivateKey: !!private_key,
          privateKeyType: private_key?.startsWith?.('nsec1') ? 'nsec' : 'hex',
          isClientSide: typeof window !== 'undefined',
          hasWindowNostr: typeof window !== 'undefined' && !!(window as any).nostr
        });

        try {
          const imageUrls: string[] = [];
          
          // Prepare credentials for Blossom upload
          const blossomCredentials: any = {
            pubkey: eventPubkey,
            useNip07: method === 'nip07'
          };
          
          console.log('🔧 Method determination:', {
            method: method,
            methodType: typeof method,
            isNip07: method === 'nip07',
            isNotNip07: method !== 'nip07',
            hasPrivateKey: !!private_key
          });
          
          // Add private key if not using NIP-07
          if (method !== 'nip07' && private_key) {
            blossomCredentials.private_key = private_key;
            console.log('✅ Private key added to Blossom credentials');
          } else if (method === 'nip07') {
            console.log('✅ Using NIP-07 for Blossom signing');
          } else {
            console.log('⚠️ No private key or NIP-07 available for Blossom signing');
          }
          
          console.log('🔍 Final Blossom credentials debug:', {
            hasPubkey: !!blossomCredentials.pubkey,
            pubkeyStart: blossomCredentials.pubkey?.substring(0, 8),
            pubkeyLength: blossomCredentials.pubkey?.length,
            hasPrivateKey: !!blossomCredentials.private_key,
            privateKeyStart: blossomCredentials.private_key?.substring(0, 10),
            privateKeyLength: blossomCredentials.private_key?.length,
            privateKeyType: blossomCredentials.private_key?.startsWith?.('nsec1') ? 'nsec' : 'hex',
            useNip07: blossomCredentials.useNip07,
            method: method,
            blossomServer: blossom_server,
            credentialKeys: Object.keys(blossomCredentials)
          });
          
          console.log('📤 Uploading images to Blossom server...');
          for (let i = 0; i < content.images.length; i++) {
            const imageData = content.images[i];
            console.log(`📷 Uploading image ${i + 1}/${content.images.length}...`);
            
            const uploadResult = await ImageUploadService.uploadToBlossom(
              imageData, 
              blossom_server, 
              blossomCredentials
            );
            
            console.log(`📷 Image ${i + 1} upload result:`, {
              success: uploadResult.success,
              url: uploadResult.url,
              error: uploadResult.error
            });
            
            if (uploadResult.success && uploadResult.url) {
              imageUrls.push(uploadResult.url);
              tags.push(['r', uploadResult.url]); // Add image reference tag
              console.log(`✅ Image ${i + 1} uploaded successfully: ${uploadResult.url}`);
            } else {
              console.error(`❌ Failed to upload image ${i + 1} to Blossom:`, uploadResult.error);
              // Continue with other images or post without this image
            }
          }
          
          console.log('📤 Image upload summary:', {
            totalImages: content.images.length,
            successfulUploads: imageUrls.length,
            imageUrls: imageUrls
          });
          
          // Add image URLs to content
          if (imageUrls.length > 0) {
            eventContent += '\n\n' + imageUrls.join('\n');
            console.log('✅ Image URLs added to Nostr event content');
          } else {
            console.log('⚠️ No images were successfully uploaded');
          }
          
        } catch (error: any) {
          console.error('Error uploading images to Blossom:', error);
          return {
            success: false,
            error: `Image upload failed: ${error.message}`
          };
        }
      }

      // Create Nostr event
      const event = {
        kind: 1, // Text note
        created_at: Math.floor(Date.now() / 1000),
        tags: tags,
        content: eventContent,
        pubkey: eventPubkey
      };

      // Handle signing based on method
      if (method === 'nip07') {
        try {
          const signedEvent = await (window as any).nostr.signEvent(event);
          
          // Publish to relays
          if (userRelays && userRelays.length > 0) {
            const publishPromises = userRelays.map(async (relayUrl: string) => {
              try {
                const relay = await Relay.connect(relayUrl);
                await relay.publish(signedEvent);
                relay.close();
                return { url: relayUrl, success: true };
              } catch (error: any) {
                console.error(`Failed to publish to relay ${relayUrl}:`, error);
                return { url: relayUrl, success: false, error: error.message };
              }
            });
            
            const results = await Promise.allSettled(publishPromises);
            const successCount = results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length;
            
            if (successCount > 0) {
              console.log(`Published to ${successCount}/${userRelays.length} relays`);
            } else {
              console.warn('Failed to publish to any relays');
            }
          }
          
          return {
            success: true,
            postId: signedEvent.id,
            url: `nostr:${signedEvent.id}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `NIP-07 signing error: ${error.message}`
          };
        }
      }

      // Server-side signing with private key
      if (private_key) {
        try {
          // Normalize private key to 64-char hex
          let signingKeyHex = private_key;
          if (private_key.startsWith('nsec1')) {
            const decoded = nip19.decode(private_key);
            signingKeyHex = Buffer.from(decoded.data as Uint8Array).toString('hex');
          }
          signingKeyHex = signingKeyHex.padStart(64, '0');
          
          const private_keyBytes = hexToBytes(signingKeyHex);
          const signedEvent = finalizeEvent(event, private_keyBytes);
          
          // Publish to relays
          if (userRelays && userRelays.length > 0) {
            const publishPromises = userRelays.map(async (relayUrl: string) => {
              try {
                const relay = await Relay.connect(relayUrl);
                await relay.publish(signedEvent);
                relay.close();
                return { url: relayUrl, success: true };
              } catch (error: any) {
                console.error(`Failed to publish to relay ${relayUrl}:`, error);
                return { url: relayUrl, success: false, error: error.message };
              }
            });
            
            const results = await Promise.allSettled(publishPromises);
            const successCount = results.filter((r: any) => r.status === 'fulfilled' && r.value.success).length;
            
            if (successCount > 0) {
              console.log(`Published to ${successCount}/${userRelays.length} relays`);
            } else {
              console.warn('Failed to publish to any relays');
            }
          }
          
          return {
            success: true,
            postId: signedEvent.id,
            url: `nostr:${signedEvent.id}`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `Signing error: ${error.message}`
          };
        }
      }

      return {
        success: false,
        error: 'Nostr posting requires NIP-07 browser extension or private key'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
