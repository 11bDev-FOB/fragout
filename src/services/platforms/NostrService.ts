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
      eventPubkey = pubkey;

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
        try {
          const imageUrls: string[] = [];
          
          // Prepare credentials for Blossom upload
          const blossomCredentials: any = {
            pubkey: eventPubkey,
            blossomServer: blossom_server,
            useNip07: method === 'nip07'
          };
          
          // Add private key if not using NIP-07
          if (method !== 'nip07' && private_key) {
            blossomCredentials.private_key = private_key;
          }
          
          for (const imageData of content.images) {
            const uploadResult = await ImageUploadService.uploadToBlossom(
              imageData, 
              blossom_server, 
              blossomCredentials
            );
            
            if (uploadResult.success && uploadResult.url) {
              imageUrls.push(uploadResult.url);
              tags.push(['r', uploadResult.url]); // Add image reference tag
            } else {
              console.warn('Failed to upload image to Blossom:', uploadResult.error);
              // Continue with other images or post without this image
            }
          }
          
          // Add image URLs to content
          if (imageUrls.length > 0) {
            eventContent += '\n\n' + imageUrls.join('\n');
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
      if (method === 'nip07' || (typeof window !== 'undefined' && (window as any).nostr)) {
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
