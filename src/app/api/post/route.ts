import { NextResponse } from 'next/server';
import { AuthService, PostingService } from '@/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, platforms, images } = body;
    
    console.log('Post request received:', { 
      platforms, 
      messageLength: message?.length,
      imageCount: images?.length || 0
    });
    
    const authService = new AuthService();
    const userId = await authService.getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'At least one platform must be selected' }, { status: 400 });
    }

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
    console.error('Post error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process post request' 
    }, { status: 500 });
  }
}
