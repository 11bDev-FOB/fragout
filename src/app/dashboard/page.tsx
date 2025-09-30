'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

const platforms = [
  { id: 'mastodon', name: 'Mastodon' },
  { id: 'bluesky', name: 'BlueSky' },
  { id: 'nostr', name: 'Nostr' },
  { id: 'twitter', name: 'X (Twitter)' },
];

export default function DashboardPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [configuredPlatforms, setConfiguredPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nip07Available, setNip07Available] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Check for NIP-07 availability
  useEffect(() => {
    const checkNip07 = () => {
      setNip07Available(!!(window as any).nostr);
    };
    
    // Check immediately
    checkNip07();
    
    // Also check after a short delay in case extensions load later
    const timer = setTimeout(checkNip07, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch configured platforms on component mount
  useEffect(() => {
    const fetchConfiguredPlatforms = async () => {
      try {
        const response = await fetch('/api/credentials', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const platformIds = data.platforms?.map((p: any) => p.platform) || [];
          setConfiguredPlatforms(platformIds);
        }
      } catch (error) {
        console.error('Error fetching platforms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfiguredPlatforms();
  }, []);

  function togglePlatform(platformId: string) {
    // Check if platform is configured (including NIP-07 for Nostr)
    const isPlatformConfigured = isPlatformAvailable(platformId);
    
    if (!isPlatformConfigured) {
      return;
    }
    
    setSelected(selected.includes(platformId)
      ? selected.filter(x => x !== platformId)
      : [...selected, platformId]);
  }

  function isPlatformAvailable(platformId: string) {
    // For Nostr, consider it available if either stored credentials exist OR NIP-07 is available
    if (platformId === 'nostr') {
      return configuredPlatforms.includes(platformId) || nip07Available;
    }
    // For other platforms, only check stored credentials
    return configuredPlatforms.includes(platformId);
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 4 - images.length); // Limit to 4 total images
    const newImageUrls = newImages.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newImages]);
    setImagePreviewUrls(prev => [...prev, ...newImageUrls]);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviewUrls[index]); // Clean up URL
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }

  // Compress image for BlueSky compatibility using Canvas
  async function compressImageForBlueSky(file: File, maxSize: number): Promise<File> {
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
                resolve(file);
                return;
              }
              
              console.log(`Compressed from ${file.size} to ${blob.size} bytes (quality: ${quality})`);
              
              if (blob.size <= maxSize || quality <= 0.3) {
                // Create new File object with same name and type
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
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
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Strip EXIF metadata from image for privacy (removes GPS data, etc.)
  async function stripEXIFMetadata(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas (this strips EXIF data)
        ctx.drawImage(img, 0, 0);
        
        // Convert back to blob with same quality
        canvas.toBlob((blob) => {
          if (blob) {
            const strippedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`EXIF stripped from ${file.name}: ${file.size} -> ${strippedFile.size} bytes`);
            resolve(strippedFile);
          } else {
            console.warn('Failed to strip EXIF, using original file');
            resolve(file);
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        console.error('Failed to load image for EXIF stripping, using original');
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    if (!message.trim() || selected.length === 0) {
      setStatus('Select platforms and enter a message.');
      return;
    }

    // Check if Nostr is selected with images but no blossom server configured
    if (selected.includes('nostr') && images.length > 0) {
      // We should check if the user has a blossom server configured
      // For now, we'll just show a warning but allow the post
      console.warn('Images selected for Nostr - ensure Blossom server is configured');
    }

    setStatus('Posting...');
    
    try {
      // Convert images to base64 for API transmission
      // Also compress large images for BlueSky compatibility
      const imageData = await Promise.all(
        images.map(async (file) => {
          // Strip EXIF metadata for privacy (especially important for Nostr/Blossom)
          let processedFile = await stripEXIFMetadata(file);
          
          // Check if image is too large for BlueSky (976KB limit)
          const blueskyLimit = 976560; // 976.56KB
          
          if (selected.includes('bluesky') && processedFile.size > blueskyLimit) {
            console.log(`Compressing image for BlueSky: ${processedFile.size} bytes > ${blueskyLimit} bytes`);
            processedFile = await compressImageForBlueSky(processedFile, blueskyLimit);
          }
          
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(processedFile);
          });
        })
      );

      // Separate platforms that need client-side vs server-side posting
      const serverPlatforms = selected.filter(platform => platform !== 'nostr');
      const clientPlatforms = selected.filter(platform => platform === 'nostr');
      
      const results: Record<string, string> = {};
      const errors: Record<string, string> = {};

      // Handle server-side posting (Mastodon, BlueSky, Twitter)
      if (serverPlatforms.length > 0) {
        console.log('🌐 Making server-side post request:', {
          platforms: serverPlatforms,
          messageLength: message.trim().length,
          imageCount: imageData.length,
          hasImages: imageData.length > 0
        });

        const response = await fetch('/api/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message.trim(),
            platforms: serverPlatforms,
            images: imageData.length > 0 ? imageData : undefined
          }),
          credentials: 'include'
        });

        const data = await response.json();
        console.log('🌐 Server-side post response:', {
          ok: response.ok,
          status: response.status,
          data: data
        });
        
        if (response.ok) {
          Object.assign(results, data.results || {});
          Object.assign(errors, data.errors || {});
        } else {
          console.error('❌ Server-side post failed:', data);
          // Mark all server platforms as failed
          serverPlatforms.forEach(platform => {
            errors[platform] = data.error || 'Server error';
          });
        }
      }

      // Handle client-side posting (NIP-07 Nostr)
      if (clientPlatforms.includes('nostr')) {
        console.log('🔑 Starting client-side Nostr post process...');
        try {
          // First check if user has NIP-07 configured
          console.log('🔍 Checking Nostr credentials...');
          const credsResponse = await fetch('/api/credentials/nostr', {
            credentials: 'include'
          });
          
          if (credsResponse.ok) {
            const credsData = await credsResponse.json();
            console.log('✅ Nostr credentials response:', {
              exists: credsData.exists,
              method: credsData.credentials?.method,
              hasBlossomServer: !!credsData.credentials?.blossom_server,
              blossomServer: credsData.credentials?.blossom_server,
              nip07Available: nip07Available
            });
            
            if ((credsData.exists && credsData.credentials.method === 'nip07') || (!credsData.exists && nip07Available)) {
              // Use client-side posting service
              console.log('🚀 Using client-side NIP-07 posting...');
              const { ClientPostingService } = await import('@/services/ClientPostingService');
              
              // Use stored credentials if they exist, otherwise use empty config for pure NIP-07
              const credentials = credsData.exists ? credsData.credentials : { method: 'nip07' };
              console.log('🔑 NIP-07 credentials prepared:', {
                hasCredentials: !!credentials,
                method: credentials.method,
                hasBlossomServer: !!credentials.blossom_server,
                blossomServer: credentials.blossom_server
              });

              const nostrResult = await ClientPostingService.postToNostrNip07({
                text: message.trim(),
                images: imageData.length > 0 ? imageData : undefined
              }, credentials);
              
              console.log('🔑 NIP-07 post result:', nostrResult);
              
              if (nostrResult.success) {
                results.nostr = 'Success';
              } else {
                console.error('❌ NIP-07 post failed:', nostrResult.error);
                errors.nostr = nostrResult.error || 'Failed to post';
              }
            } else {
              // Fall back to server-side posting if not using NIP-07
              const response = await fetch('/api/post', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: message.trim(),
                  platforms: ['nostr'],
                  images: imageData.length > 0 ? imageData : undefined
                }),
                credentials: 'include'
              });

              const data = await response.json();
              
              if (response.ok) {
                Object.assign(results, data.results || {});
                Object.assign(errors, data.errors || {});
              } else {
                errors.nostr = data.error || 'Server error';
              }
            }
          } else {
            errors.nostr = 'No Nostr credentials found. Configure Nostr in Platform Setup to enable posting.';
          }
        } catch (error: any) {
          errors.nostr = `Client posting error: ${error.message}`;
        }
      }

      // Show results
      const successes = Object.keys(results).filter(p => results[p] === 'Success');
      const failures = Object.keys(errors);
      
      let statusMsg = '';
      if (successes.length > 0) {
        statusMsg += `✅ Posted to: ${successes.join(', ')}`;
      }
      if (failures.length > 0) {
        statusMsg += `${statusMsg ? ' | ' : ''}❌ Failed: ${failures.join(', ')}`;
      }
      
      setStatus(statusMsg || 'Post completed');
      setMessage('');
      setSelected([]);
      // Clear images and their preview URLs
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImages([]);
      setImagePreviewUrls([]);

    } catch (e: any) {
      setStatus(`Network error: ${e.message}`);
      console.error('Post error:', e);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-tactical-900 via-tactical-800 to-military-900 dark:from-tactical-950 dark:via-tactical-900 dark:to-military-950">
      <Navigation currentPage="dashboard" />
      
      {/* Auto-Delete OpSec Notice */}
      <div className="max-w-2xl mx-auto mt-6 p-4 bg-military-800/50 dark:bg-military-900/30 rounded-lg border border-lightning-500/40 dark:border-lightning-600/40">
        <p className="text-sm text-lightning-200 dark:text-lightning-100 text-center">
          💡 <strong>OpSec Reminder:</strong> Your account will be automatically deleted after 30 days of inactivity. 
          <Link href="/settings" className="underline hover:text-lightning-300 dark:hover:text-lightning-200 ml-1">
            Manage in Settings
          </Link>
        </p>
      </div>
      
      <section className="max-w-2xl mx-auto mt-6 bg-tactical-800/95 dark:bg-tactical-950/95 rounded-2xl shadow-tactical p-10 border border-lightning-600/30 dark:border-lightning-700/30 backdrop-blur-sm">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-lightning-300 dark:text-lightning-200 drop-shadow">Mission Broadcast</h1>
        <form onSubmit={handlePost} className="space-y-6">
          <textarea
            className="w-full p-4 border-2 border-tactical-600 dark:border-tactical-700 bg-tactical-700 dark:bg-tactical-800 text-tactical-100 rounded-xl min-h-[120px] text-lg focus:outline-none focus:border-lightning-400 dark:focus:border-lightning-500 placeholder-tactical-400"
            placeholder="What's the mission status?"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          
          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-tactical-200 dark:text-tactical-100">
                Add Intel Images (Optional)
              </label>
              <label className="cursor-pointer bg-military-700 dark:bg-military-800 hover:bg-military-600 dark:hover:bg-military-700 text-tactical-100 dark:text-tactical-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center">
                <span className="mr-2">📷</span>
                Upload Intel
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={images.length >= 4}
                />
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Intel preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {images.length > 0 && selected.includes('nostr') && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-orange-600 mr-2">⚠️</span>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>Nostr Image Upload:</strong> Make sure you have configured a Blossom server in your Nostr platform settings for image uploads to work.
                  </p>
                </div>
              </div>
            )}
            
            {images.length > 0 && selected.some(platform => !['mastodon', 'nostr'].includes(platform)) && (
              <div className="bg-military-800/50 border border-lightning-500/40 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-lightning-400 mr-2">ℹ️</span>
                  <p className="text-sm text-tactical-200">
                    <strong>Intel Support:</strong> Images will only be deployed to platforms that support them (Mastodon, Nostr). 
                    Other platforms will receive text-only transmissions.
                  </p>
                </div>
              </div>
            )}
            
            {images.length >= 4 && (
              <p className="text-sm text-tactical-300 text-center">
                Maximum of 4 intel images allowed
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {isLoading ? (
              <div className="text-lightning-400">Loading platforms...</div>
            ) : (
              platforms.map(platform => {
                const isConfigured = isPlatformAvailable(platform.id);
                const isSelected = selected.includes(platform.id);
                const isNip07Nostr = platform.id === 'nostr' && nip07Available && !configuredPlatforms.includes('nostr');
                const supportsImages = ['mastodon', 'nostr'].includes(platform.id);
                
                return (
                  <div key={platform.id} className="relative">
                    <button
                      type="button"
                      className={`px-6 py-2 rounded-xl font-bold shadow border transition ${
                        !isConfigured
                          ? 'bg-tactical-600 dark:bg-tactical-700 text-tactical-400 dark:text-tactical-500 border-tactical-500 dark:border-tactical-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-lightning-500 text-tactical-900 border-lightning-400 dark:border-lightning-600'
                          : 'bg-military-700 dark:bg-military-800 text-tactical-100 dark:text-tactical-50 border-military-600 dark:border-military-700 hover:bg-military-600 dark:hover:bg-military-700'
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                      disabled={!isConfigured}
                      title={
                        !isConfigured 
                          ? `${platform.name} is not deployed. Click to configure.` 
                          : isNip07Nostr 
                          ? `${platform.name} (NIP-07 Extension)${supportsImages ? ' - Supports Images' : ''}`
                          : supportsImages
                          ? `${platform.name} - Supports Images`
                          : platform.name
                      }
                    >
                      {platform.name}
                      {isNip07Nostr && (
                        <span className="ml-2 text-xs">🔗</span>
                      )}
                      {!isConfigured && (
                        <span className="ml-2 text-xs">⚙️</span>
                      )}
                      {isConfigured && supportsImages && images.length > 0 && (
                        <span className="ml-2 text-xs">📷</span>
                      )}
                    </button>
                    {!isConfigured && (
                      <Link
                        href="/platform-setup"
                        className="absolute -top-2 -right-2 bg-lightning-600 text-tactical-900 text-xs px-2 py-1 rounded-full hover:bg-lightning-500 transition"
                        title={`Deploy ${platform.name}`}
                      >
                        Deploy
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {!isLoading && configuredPlatforms.length === 0 && nip07Available && (
            <div className="text-center p-6 bg-military-800/50 dark:bg-military-900/30 border border-lightning-500/40 dark:border-lightning-600/40 rounded-xl">
              <div className="text-lightning-400 dark:text-lightning-300 mb-2">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-bold text-lightning-300 dark:text-lightning-200 mb-2">NIP-07 Extension Detected</h3>
              <p className="text-tactical-200 dark:text-tactical-100 mb-4">
                Your Nostr browser extension is ready for deployment! You can broadcast to Nostr using your extension.
                Deploy additional platforms to coordinate multi-network operations.
              </p>
              <Link
                href="/platform-setup"
                className="inline-block bg-lightning-600 text-tactical-900 px-6 py-2 rounded-lg font-bold hover:bg-lightning-500 dark:hover:bg-lightning-500 transition"
              >
                Deploy More Platforms
              </Link>
            </div>
          )}
          
          {!isLoading && configuredPlatforms.length === 0 && !nip07Available && (
            <div className="text-center p-6 bg-military-800/50 dark:bg-military-900/30 border border-lightning-500/40 dark:border-lightning-600/40 rounded-xl">
              <div className="text-lightning-400 dark:text-lightning-300 mb-2">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="font-bold text-lightning-300 dark:text-lightning-200 mb-2">Platform Deployment Required</h3>
              <p className="text-tactical-200 dark:text-tactical-100 mb-4">
                No platforms are currently deployed. Set up your social media platforms to begin broadcasting operations.
              </p>
              <Link
                href="/platform-setup"
                className="inline-block bg-lightning-600 text-tactical-900 px-6 py-2 rounded-lg font-bold hover:bg-lightning-500 dark:hover:bg-lightning-500 transition"
              >
                Deploy Platforms
              </Link>
            </div>
          )}
          
          <button
            type="submit"
            disabled={selected.length === 0 || !message.trim()}
            className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-transform ${
              selected.length === 0 || !message.trim()
                ? 'bg-tactical-600 dark:bg-tactical-700 text-tactical-400 dark:text-tactical-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-lightning-600 to-lightning-500 text-tactical-900 hover:scale-105 hover:from-lightning-500 hover:to-lightning-400'
            }`}
          >
            {selected.length === 0 
              ? 'Select platforms to broadcast' 
              : !message.trim() 
              ? 'Enter mission update to broadcast'
              : 'Execute Broadcast'
            }
          </button>
        </form>
        {status && <p className="mt-6 text-center text-lightning-300 dark:text-lightning-200 font-semibold">{status}</p>}
      </section>
      <Footer />
    </main>
  );
}
