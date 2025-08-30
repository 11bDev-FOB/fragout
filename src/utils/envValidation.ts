/**
 * Environment Variable Validation Utility
 * Validates required environment variables at startup and fails fast if missing
 */

interface RequiredEnvVars {
  JWT_SECRET: string;
  ENCRYPTION_SECRET?: string;
  NODE_ENV?: string;
}

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that all required environment variables are set
 * Throws EnvironmentValidationError if any are missing or invalid
 */
export function validateEnvironment(): RequiredEnvVars {
  const errors: string[] = [];
  
  // Check JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required but not set');
  } else if (jwtSecret === 'replace_with_a_secure_secret') {
    errors.push('JWT_SECRET is still set to default value - change it to a secure random string');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Check ENCRYPTION_SECRET (can fallback to JWT_SECRET but warn)
  const encryptionSecret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!encryptionSecret) {
    errors.push('ENCRYPTION_SECRET or JWT_SECRET is required for data encryption');
  } else if (encryptionSecret === 'default_encryption_key_change_me') {
    errors.push('ENCRYPTION_SECRET is still set to default value');
  }

  // Warn about missing recommended variables
  if (!process.env.NODE_ENV) {
    console.warn('⚠️  NODE_ENV not set, defaulting to development');
  }

  if (errors.length > 0) {
    const errorMessage = [
      '🔴 CRITICAL: Environment validation failed!',
      '',
      'Missing or invalid environment variables:',
      ...errors.map(err => `  - ${err}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See .env.local.example for guidance.'
    ].join('\n');
    
    throw new EnvironmentValidationError(errorMessage);
  }

  // Return validated environment
  return {
    JWT_SECRET: jwtSecret!,
    ENCRYPTION_SECRET: encryptionSecret,
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
}

/**
 * Validates environment on import if in production
 * For development, just logs warnings
 */
export function initializeEnvironment(): void {
  try {
    validateEnvironment();
    console.log('✅ Environment validation passed');
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      if (process.env.NODE_ENV === 'production') {
        console.error(error.message);
        process.exit(1);
      } else {
        console.error('⚠️  Development mode: Environment validation failed but continuing...');
        console.error(error.message);
      }
    } else {
      throw error;
    }
  }
}
