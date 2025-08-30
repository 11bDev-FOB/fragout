import crypto from 'crypto';

class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('🔴 CRITICAL: ENCRYPTION_SECRET or JWT_SECRET environment variable is required in production');
      }
      console.warn('⚠️  WARNING: Using fallback encryption secret in development');
      return 'development_fallback_encryption_key_change_me_in_production';
    })();
    
    // Validate secret strength
    if (secret.length < 32) {
      throw new Error('🔴 CRITICAL: Encryption secret must be at least 32 characters long');
    }
    
    // Create a proper 256-bit (32 byte) key from the secret
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
  }

  public encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(EncryptionService.ALGORITHM, this.encryptionKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  public decrypt(encryptedText: string): string {
    try {
      const [ivHex, encryptedHex] = encryptedText.split(':');
      
      if (!ivHex || !encryptedHex) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(EncryptionService.ALGORITHM, this.encryptionKey, iv);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  public hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  public generateRandomKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default EncryptionService;
