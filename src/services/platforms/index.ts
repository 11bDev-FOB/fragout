import { PlatformRegistry } from './BasePlatformService';
import { MastodonService } from './MastodonService';
import { NostrService } from './NostrService';
import { BlueskyService } from './BlueskyService';
import { TwitterService } from './TwitterService';

// Initialize and register all platform services
export function initializePlatforms(): PlatformRegistry {
  const registry = PlatformRegistry.getInstance();
  
  // Register all available platform services
  registry.registerPlatform(new MastodonService());
  registry.registerPlatform(new NostrService());
  registry.registerPlatform(new BlueskyService());
  registry.registerPlatform(new TwitterService());
  
  return registry;
}

// Export services for direct use
export { MastodonService } from './MastodonService';
export { NostrService } from './NostrService';
export { BlueskyService } from './BlueskyService';
export { TwitterService } from './TwitterService';

// Export base classes and interfaces
export {
  BasePlatformService,
  PlatformRegistry,
  type Platform,
  type PlatformCredentials,
  type TestResult,
  type PostContent,
  type PostResult
} from './BasePlatformService';

// Default export - initialized registry
const platformRegistry = initializePlatforms();
export default platformRegistry;
