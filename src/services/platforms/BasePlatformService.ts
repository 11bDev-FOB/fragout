// Base interface for all platform services
export interface Platform {
  id: string;
  name: string;
  requiresAuth: boolean;
  connectionTestUrl?: string;
}

export interface PlatformCredentials {
  platform: string;
  credentials: Record<string, string>;
}

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface PostContent {
  text: string;
  images?: string[];
  metadata?: Record<string, any>;
}

export interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export abstract class BasePlatformService {
  protected platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  abstract testConnection(credentials: Record<string, string>): Promise<TestResult>;
  abstract post(content: PostContent, credentials: Record<string, string>): Promise<PostResult>;
  
  public getPlatformInfo(): Platform {
    return this.platform;
  }
}

// Platform registry for managing all platform services
export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private platforms: Map<string, BasePlatformService> = new Map();

  public static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }

  public registerPlatform(service: BasePlatformService): void {
    const platformInfo = service.getPlatformInfo();
    this.platforms.set(platformInfo.id, service);
  }

  public getPlatform(platformId: string): BasePlatformService | undefined {
    return this.platforms.get(platformId);
  }

  public getAllPlatforms(): Platform[] {
    return Array.from(this.platforms.values()).map(service => service.getPlatformInfo());
  }

  public getSupportedPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }
}
