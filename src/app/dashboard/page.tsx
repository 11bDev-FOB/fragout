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
          // Check if image is too large for BlueSky (976KB limit)
          const blueskyLimit = 976560; // 976.56KB
          let processedFile = file;
          
          if (selected.includes('bluesky') && file.size > blueskyLimit) {
            console.log(`Compressing image for BlueSky: ${file.size} bytes > ${blueskyLimit} bytes`);
            processedFile = await compressImageForBlueSky(file, blueskyLimit);
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
        
        if (response.ok) {
          Object.assign(results, data.results || {});
          Object.assign(errors, data.errors || {});
        } else {
          // Mark all server platforms as failed
          serverPlatforms.forEach(platform => {
            errors[platform] = data.error || 'Server error';
          });
        }
      }

      // Handle client-side posting (NIP-07 Nostr)
      if (clientPlatforms.includes('nostr')) {
        try {
          // First check if user has NIP-07 configured
          const credsResponse = await fetch('/api/credentials/nostr', {
            credentials: 'include'
          });
          
          if (credsResponse.ok) {
            const credsData = await credsResponse.json();
            
            if (credsData.exists && credsData.credentials.method === 'nip07') {
              // Use client-side posting service
              const { ClientPostingService } = await import('@/services/ClientPostingService');
              
              const nostrResult = await ClientPostingService.postToNostrNip07({
                text: message.trim(),
                images: imageData.length > 0 ? imageData : undefined
              }, credsData.credentials);
              
              if (nostrResult.success) {
                results.nostr = 'Success';
              } else {
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
            errors.nostr = 'No Nostr credentials found';
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
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <Navigation currentPage="dashboard" />
      <section className="max-w-2xl mx-auto mt-12 bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl p-10 border border-purple-200 dark:border-gray-700">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-purple-700 dark:text-purple-400 drop-shadow">Compose Post</h1>
        <form onSubmit={handlePost} className="space-y-6">
          <textarea
            className="w-full p-4 border-2 border-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl min-h-[120px] text-lg focus:outline-none focus:border-purple-400 dark:focus:border-purple-500"
            placeholder="What's on your mind?"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          
          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add Images (Optional)
              </label>
              <label className="cursor-pointer bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg transition-colors inline-flex items-center">
                <span className="mr-2">📷</span>
                Choose Images
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
                      alt={`Upload preview ${index + 1}`}
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">ℹ️</span>
                  <p className="text-sm text-yellow-700">
                    <strong>Image Support:</strong> Images will only be posted to platforms that support them (Mastodon, Nostr). 
                    Other platforms will receive text-only posts.
                  </p>
                </div>
              </div>
            )}
            
            {images.length >= 4 && (
              <p className="text-sm text-gray-600 text-center">
                Maximum of 4 images allowed
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {isLoading ? (
              <div className="text-purple-600">Loading platforms...</div>
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
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                          : isSelected
                          ? 'bg-purple-500 text-white border-purple-300 dark:border-purple-600'
                          : 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700'
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                      disabled={!isConfigured}
                      title={
                        !isConfigured 
                          ? `${platform.name} is not set up. Click to configure.` 
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
                        className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full hover:bg-orange-600 transition"
                        title={`Set up ${platform.name}`}
                      >
                        Setup
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {!isLoading && configuredPlatforms.length === 0 && nip07Available && (
            <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-blue-800 mb-2">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-bold text-blue-800 mb-2">NIP-07 Extension Detected</h3>
              <p className="text-blue-700 mb-4">
                Your Nostr browser extension is available! You can post to Nostr using your extension.
                Set up additional platforms to post to multiple networks at once.
              </p>
              <Link
                href="/platform-setup"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Set Up More Platforms
              </Link>
            </div>
          )}
          
          {!isLoading && configuredPlatforms.length === 0 && !nip07Available && (
            <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="text-orange-800 mb-2">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="font-bold text-orange-800 mb-2">No Platforms Configured</h3>
              <p className="text-orange-700 mb-4">
                You need to set up at least one platform before you can post.
              </p>
              <Link
                href="/platform-setup"
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
              >
                Set Up Platforms
              </Link>
            </div>
          )}
          
          <button
            type="submit"
            disabled={selected.length === 0 || !message.trim()}
            className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-transform ${
              selected.length === 0 || !message.trim()
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105'
            }`}
          >
            {selected.length === 0 
              ? 'Select platforms to post' 
              : !message.trim() 
              ? 'Enter a message to post'
              : 'Post'
            }
          </button>
        </form>
        {status && <p className="mt-6 text-center text-purple-700 dark:text-purple-400 font-semibold">{status}</p>}
      </section>
      <Footer />
    </main>
  );
}
