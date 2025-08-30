// Client-side posting service for browser-specific operations (like NIP-07)
'use client';

import { PostContent, PostResult } from './platforms/BasePlatformService';
import ImageUploadService from './ImageUploadService';

export class ClientPostingService {
  
  /**
   * Handle client-side posting for platforms that require browser APIs
   */
  static async postToNostrNip07(content: PostContent, credentials: Record<string, string>): Promise<PostResult> {
    const { blossom_server, method } = credentials;

    // Verify NIP-07 is available
    if (typeof window === 'undefined' || !(window as any).nostr) {
      return {
        success: false,
        error: 'NIP-07 extension not available'
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

      // Get pubkey from NIP-07
      const eventPubkey = await (window as any).nostr.getPublicKey();

      // Handle image uploads if provided
      if (content.images && content.images.length > 0 && blossom_server) {
        try {
          const imageUrls: string[] = [];
          
          // Prepare credentials for Blossom upload
          const blossomCredentials = {
            pubkey: eventPubkey,
            blossomServer: blossom_server,
            useNip07: true
          };
          
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

      // Sign event with NIP-07
      const signedEvent = await (window as any).nostr.signEvent(event);
      
      // Publish to relays
      const relayList = credentials.relays ? 
        credentials.relays.split(',').map((r: string) => r.trim()) : 
        [
          'wss://relay.damus.io',
          'wss://nos.lol', 
          'wss://relay.nostr.band',
          'wss://nostr-pub.wellorder.net'
        ];
      
      let publishedToCount = 0;
      const publishPromises = relayList.map(async (relayUrl: string) => {
        try {
          const ws = new WebSocket(relayUrl);
          
          await new Promise((resolve, reject) => {
            ws.onopen = () => {
              // Send the event to the relay
              const message = JSON.stringify(['EVENT', signedEvent]);
              ws.send(message);
              publishedToCount++;
              ws.close();
              resolve(true);
            };
            
            ws.onerror = () => {
              console.warn(`Failed to connect to relay: ${relayUrl}`);
              reject(new Error(`Relay connection failed: ${relayUrl}`));
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
              if (ws.readyState !== WebSocket.CLOSED) {
                ws.close();
                reject(new Error(`Timeout connecting to relay: ${relayUrl}`));
              }
            }, 5000);
          });
          
        } catch (error) {
          console.warn(`Failed to publish to relay ${relayUrl}:`, error);
        }
      });
      
      // Wait for all relay attempts (but don't fail if some fail)
      await Promise.allSettled(publishPromises);
      
      if (publishedToCount === 0) {
        return {
          success: false,
          error: 'Failed to publish to any Nostr relays'
        };
      }
      
      console.log(`Published Nostr event to ${publishedToCount}/${relayList.length} relays`);
      
      return {
        success: true,
        postId: signedEvent.id,
        url: `nostr:${signedEvent.id}`
      };

    } catch (error: any) {
      return {
        success: false,
        error: `NIP-07 posting error: ${error.message}`
      };
    }
  }

  /**
   * Check if a platform requires client-side posting
   */
  static requiresClientSidePosting(platform: string, credentials: Record<string, string>): boolean {
    return platform === 'nostr' && credentials.method === 'nip07';
  }
}

export default ClientPostingService;
