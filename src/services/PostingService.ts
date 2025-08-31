import DatabaseService from './DatabaseService';
import EncryptionService from './EncryptionService';
import AuthService from './AuthService';
import platformRegistry, { type PostContent, type PostResult } from './platforms';

export interface PostRequest {
  content: PostContent;
  platforms: string[];
  scheduleTime?: Date;
}

export interface PostJob {
  id: string;
  userId: string;
  content: PostContent;
  platforms: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
  results: Record<string, PostResult>;
  createdAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
}

class PostingService {
  private db: DatabaseService;
  private encryption: EncryptionService;
  private auth: AuthService;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.encryption = new EncryptionService();
    this.auth = new AuthService();
  }

  public async createPost(request: PostRequest): Promise<PostJob> {
    const userId = await this.auth.getUserIdFromToken();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Validate platforms
    const supportedPlatforms = platformRegistry.getSupportedPlatforms();
    const invalidPlatforms = request.platforms.filter(p => !supportedPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      throw new Error(`Unsupported platforms: ${invalidPlatforms.join(', ')}`);
    }

    // Create post job
    const postJob: PostJob = {
      id: crypto.randomUUID(),
      userId,
      content: request.content,
      platforms: request.platforms,
      status: request.scheduleTime ? 'scheduled' : 'pending',
      results: {},
      createdAt: new Date(),
      scheduledFor: request.scheduleTime
    };

    // Store job in database (you'll need to add this to DatabaseService)
    // this.db.createPostJob(postJob);

    // If not scheduled, process immediately
    if (!request.scheduleTime) {
      await this.processPost(postJob);
    }

    return postJob;
  }

  public async processPost(job: PostJob): Promise<PostJob> {
    job.status = 'processing';
    // this.db.updatePostJob(job);

    try {
      const credentials = this.db.getCredentials(job.userId);
      
      for (const platformId of job.platforms) {
        try {
          console.log(`Processing platform: ${platformId}`);
          
          const platformService = platformRegistry.getPlatform(platformId);
          if (!platformService) {
            console.error(`Platform service not found: ${platformId}`);
            job.results[platformId] = {
              success: false,
              error: `Platform service not found: ${platformId}`
            };
            continue;
          }

          // Get platform credentials
          const platformCreds = credentials.find((c: any) => c.platform === platformId);
          if (!platformCreds) {
            console.error(`No credentials found for platform: ${platformId}`);
            job.results[platformId] = {
              success: false,
              error: `No credentials found for platform: ${platformId}`
            };
            continue;
          }

          // Decrypt credentials
          const decryptedCreds = this.encryption.decrypt(platformCreds.credentials);
          const credsObject = JSON.parse(decryptedCreds);
          console.log(`✅ Credentials loaded for ${platformId}, keys:`, Object.keys(credsObject));

          // Special logging for Nostr with images
          if (platformId === 'nostr' && job.content.images && job.content.images.length > 0) {
            console.log('🔍 Nostr image post analysis:', {
              platform: platformId,
              hasBlossomServer: !!credsObject.blossom_server,
              blossomServer: credsObject.blossom_server || 'NOT_SET',
              method: credsObject.method || 'NOT_SET',
              hasPubkey: !!credsObject.pubkey,
              hasPrivateKey: !!credsObject.private_key,
              imageCount: job.content.images.length,
              credKeys: Object.keys(credsObject)
            });

            if (!credsObject.blossom_server) {
              console.error('❌ Nostr image upload will fail: No Blossom server configured');
            }
          }

          // Post to platform
          console.log(`🚀 Posting to ${platformId}...`);
          const result = await platformService.post(job.content, credsObject);
          console.log(`📊 ${platformId} post result:`, {
            success: result.success,
            postId: result.postId,
            url: result.url,
            error: result.error
          });
          job.results[platformId] = result;

          // Record post in database for admin stats
          this.db.recordPost(
            job.userId,
            platformId,
            result.success,
            result.postId,
            job.content.text?.length || 0,
            !!(job.content.images && job.content.images.length > 0),
            result.error
          );

        } catch (error: any) {
          console.error(`Error posting to ${platformId}:`, error);
          const errorResult = {
            success: false,
            error: error.message
          };
          job.results[platformId] = errorResult;

          // Record failed post in database
          this.db.recordPost(
            job.userId,
            platformId,
            false,
            undefined,
            job.content.text?.length || 0,
            !!(job.content.images && job.content.images.length > 0),
            error.message
          );
        }
      }

      // Check if all posts succeeded
      const allSucceeded = Object.values(job.results).every(r => r.success);
      job.status = allSucceeded ? 'completed' : 'failed';
      job.completedAt = new Date();

    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      
      // Mark all platforms as failed
      for (const platformId of job.platforms) {
        if (!job.results[platformId]) {
          job.results[platformId] = {
            success: false,
            error: error.message
          };
        }
      }
    }

    // this.db.updatePostJob(job);
    return job;
  }

  public async getPostHistory(userId: string, limit = 50): Promise<PostJob[]> {
    // TODO: Implement database query for post history
    // return this.db.getPostHistory(userId, limit);
    return [];
  }

  public async getPostStatus(jobId: string, userId: string): Promise<PostJob | null> {
    // TODO: Implement database query for specific post job
    // return this.db.getPostJob(jobId, userId);
    return null;
  }

  public async retryFailedPost(jobId: string, userId: string): Promise<PostJob> {
    // TODO: Implement retry logic
    // const job = await this.getPostStatus(jobId, userId);
    // if (!job) throw new Error('Post job not found');
    // if (job.status !== 'failed') throw new Error('Post is not in failed state');
    
    // Reset failed platform results and retry
    // const failedPlatforms = Object.entries(job.results)
    //   .filter(([_, result]) => !result.success)
    //   .map(([platform]) => platform);
    
    // job.platforms = failedPlatforms;
    // job.status = 'pending';
    // job.results = {};
    
    // return await this.processPost(job);
    throw new Error('Retry functionality not yet implemented');
  }

  public async schedulePost(request: PostRequest, scheduleTime: Date): Promise<PostJob> {
    if (scheduleTime <= new Date()) {
      throw new Error('Schedule time must be in the future');
    }

    return await this.createPost({
      ...request,
      scheduleTime
    });
  }

  // Method to process scheduled posts (would be called by a cron job)
  public async processScheduledPosts(): Promise<void> {
    // TODO: Implement scheduled post processing
    // const scheduledPosts = this.db.getScheduledPosts();
    // const now = new Date();
    
    // for (const post of scheduledPosts) {
    //   if (post.scheduledFor && post.scheduledFor <= now) {
    //     await this.processPost(post);
    //   }
    // }
  }
}

export default PostingService;
