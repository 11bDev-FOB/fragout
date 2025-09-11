import { NextResponse } from 'next/server';
import { AuthService, PostingService } from '@/services';
import { updateUserActivity } from '@/utils/autoDelete';

export async function POST(request: Request) {
  console.log('🔄 POST /api/post - Request received');
  try {
    console.log('📥 Parsing request body...');
    const body = await request.json();
    const { message, platforms, images } = body;
    
    console.log('📝 Post request received:', { 
      platforms, 
      messageLength: message?.length,
      imageCount: images?.length || 0,
      hasImages: !!(images?.length),
      nostrSelected: platforms?.includes('nostr'),
      bodyKeys: Object.keys(body)
    });
    
    // Log image details if present
    if (images?.length > 0) {
      console.log('🖼️ Image details:', {
        count: images.length,
        sizes: images.map((img: string, i: number) => ({
          index: i,
          dataUrlLength: img.length,
          mimeType: img.split(',')[0],
          isValidDataUrl: img.startsWith('data:')
        }))
      });
    } else {
      console.log('📝 No images in request');
    }
    
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      console.log('❌ Authentication failed - no user ID');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('✅ User authenticated:', userId);

    // Update user activity for auto-delete tracking
    updateUserActivity(userId);

    if (!message || !message.trim()) {
      console.log('❌ Empty message provided');
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!platforms || platforms.length === 0) {
      console.log('❌ No platforms selected');
      return NextResponse.json({ error: 'At least one platform must be selected' }, { status: 400 });
    }

    console.log('🚀 Starting post creation with PostingService...');
    const postingService = new PostingService();
    
    // Create and process the post
    const postJob = await postingService.createPost({
      content: {
        text: message.trim(),
        images: images || []
      },
      platforms
    });

    // Return results in the expected format for the frontend
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};

    Object.entries(postJob.results).forEach(([platform, result]) => {
      if (result.success) {
        results[platform] = 'Success';
      } else {
        errors[platform] = result.error || 'Failed to post';
      }
    });

    return NextResponse.json({ results, errors });
    
  } catch (error: any) {
    console.error('❌ POST /api/post - Error occurred:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to process post request' 
    }, { status: 500 });
  }
}
