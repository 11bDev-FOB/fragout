import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import DatabaseService from './DatabaseService';

export interface User {
  id: string;
  username: string;
  created_at: string;
  last_login?: string;
  failed_attempts: number;
  locked_until?: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  authType: 'nostr' | 'username';
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

class UserAuthService {
  private db: DatabaseService;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly MAX_RATE_LIMIT_ATTEMPTS = 10;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate secure backup codes for 2FA
   */
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(identifier: string, attemptType: string = 'login'): boolean {
    const failedAttempts = this.db.getRecentFailedAttempts(identifier, attemptType);
    return failedAttempts < this.MAX_RATE_LIMIT_ATTEMPTS;
  }

  /**
   * Record authentication attempt
   */
  private recordAttempt(identifier: string, attemptType: string, success: boolean): void {
    this.db.recordAuthAttempt(identifier, attemptType, success);
  }

  /**
   * Validate username format
   */
  public validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }

    if (trimmed.length > 30) {
      return { valid: false, error: 'Username must be no more than 30 characters long' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    if (/^\d+$/.test(trimmed)) {
      return { valid: false, error: 'Username cannot be only numbers' };
    }

    // Reserved usernames
    const reserved = ['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'test', 'user', 'root', 'system'];
    if (reserved.includes(trimmed.toLowerCase())) {
      return { valid: false, error: 'This username is reserved' };
    }

    return { valid: true };
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    if (password.length < 12) {
      return { valid: false, error: 'Password must be at least 12 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password must be no more than 128 characters long' };
    }

    // Check for complexity
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (complexityCount < 3) {
      return { 
        valid: false, 
        error: 'Password must contain at least 3 of: lowercase letter, uppercase letter, number, special character' 
      };
    }

    return { valid: true };
  }

  /**
   * Register a new user
   */
  public async registerUser(username: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Validate input
      const usernameValidation = this.validateUsername(username);
      if (!usernameValidation.valid) {
        return { success: false, error: usernameValidation.error };
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      const trimmedUsername = username.trim().toLowerCase();

      // Check if username already exists
      const existingUser = this.db.getUserByUsername(trimmedUsername);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate user ID
      const userId = this.generateUserId();

      // Create user
      this.db.createUser(trimmedUsername, passwordHash, userId);

      console.log(`✅ User registered: ${trimmedUsername} (${userId})`);
      return { success: true, userId };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  /**
   * Authenticate user with username/password
   */
  public async authenticateUser(username: string, password: string, ipAddress?: string): Promise<{ success: boolean; userId?: string; requires2FA?: boolean; error?: string }> {
    try {
      const trimmedUsername = username.trim().toLowerCase();

      // Rate limiting check
      if (!this.checkRateLimit(ipAddress || trimmedUsername)) {
        this.recordAttempt(ipAddress || trimmedUsername, 'login', false);
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      }

      // Get user
      const user = this.db.getUserByUsername(trimmedUsername);
      if (!user) {
        this.recordAttempt(ipAddress || trimmedUsername, 'login', false);
        return { success: false, error: 'Invalid username or password' };
      }

      // Check if user is locked
      if (this.db.isUserLocked(trimmedUsername)) {
        this.recordAttempt(ipAddress || trimmedUsername, 'login', false);
        return { success: false, error: 'Account is temporarily locked due to too many failed attempts' };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        this.recordAttempt(ipAddress || trimmedUsername, 'login', false);
        this.db.incrementFailedAttempts(trimmedUsername);
        
        // Lock account after max failed attempts
        if (user.failed_attempts + 1 >= this.MAX_FAILED_ATTEMPTS) {
          this.db.lockUser(trimmedUsername, this.LOCKOUT_DURATION_MINUTES);
        }
        
        return { success: false, error: 'Invalid username or password' };
      }

      // Check if 2FA is enabled
      const twoFARecord = this.db.get2FA(user.user_id);
      if (twoFARecord && twoFARecord.enabled) {
        this.recordAttempt(ipAddress || trimmedUsername, 'login', true);
        return { success: true, userId: user.user_id, requires2FA: true };
      }

      // Update last login and reset failed attempts
      this.db.updateUserLastLogin(user.user_id);
      this.recordAttempt(ipAddress || trimmedUsername, 'login', true);

      console.log(`✅ User authenticated: ${trimmedUsername} (${user.user_id})`);
      return { success: true, userId: user.user_id };

    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify 2FA token
   */
  public verify2FA(userId: string, token: string, ipAddress?: string): { success: boolean; error?: string } {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(ipAddress || userId, '2fa')) {
        this.recordAttempt(ipAddress || userId, '2fa', false);
        return { success: false, error: 'Too many failed 2FA attempts. Please try again later.' };
      }

      const twoFARecord = this.db.get2FA(userId);
      if (!twoFARecord || !twoFARecord.enabled) {
        return { success: false, error: '2FA not enabled for this account' };
      }

      // Check if it's a backup code
      if (token.length === 8 && /^[A-F0-9]{8}$/.test(token.toUpperCase())) {
        const success = this.db.useBackupCode(userId, token.toUpperCase());
        this.recordAttempt(ipAddress || userId, '2fa', success);
        
        if (success) {
          this.db.updateUserLastLogin(userId);
          console.log(`✅ 2FA backup code used: ${userId}`);
          return { success: true };
        } else {
          return { success: false, error: 'Invalid backup code' };
        }
      }

      // Verify TOTP token
      const isValid = authenticator.verify({
        token: token.replace(/\s/g, ''), // Remove spaces
        secret: twoFARecord.secret
      });

      this.recordAttempt(ipAddress || userId, '2fa', isValid);

      if (isValid) {
        this.db.updateUserLastLogin(userId);
        console.log(`✅ 2FA verified: ${userId}`);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid 2FA code' };
      }

    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: '2FA verification failed' };
    }
  }

  /**
   * Setup 2FA for a user
   */
  public async setup2FA(userId: string, serviceName: string = 'Yall Web'): Promise<TwoFactorSetup | null> {
    try {
      const user = this.db.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate secret
      const secret = authenticator.generateSecret();

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store in database (not enabled yet)
      this.db.setup2FA(userId, secret, backupCodes);

      // Generate QR code URL
      const otpauth = authenticator.keyuri(user.username, serviceName, secret);
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      console.log(`✅ 2FA setup initiated: ${user.username} (${userId})`);

      return {
        secret,
        qrCodeUrl,
        backupCodes
      };

    } catch (error) {
      console.error('2FA setup error:', error);
      return null;
    }
  }

  /**
   * Enable 2FA after verification
   */
  public enable2FA(userId: string, verificationToken: string): { success: boolean; error?: string } {
    try {
      const twoFARecord = this.db.get2FA(userId);
      if (!twoFARecord) {
        return { success: false, error: '2FA not set up' };
      }

      // Verify the token
      const isValid = authenticator.verify({
        token: verificationToken.replace(/\s/g, ''),
        secret: twoFARecord.secret
      });

      if (!isValid) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Enable 2FA
      this.db.enable2FA(userId);

      console.log(`✅ 2FA enabled: ${userId}`);
      return { success: true };

    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false, error: '2FA enable failed' };
    }
  }

  /**
   * Disable 2FA
   */
  public disable2FA(userId: string): { success: boolean; error?: string } {
    try {
      this.db.disable2FA(userId);
      console.log(`✅ 2FA disabled: ${userId}`);
      return { success: true };

    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false, error: '2FA disable failed' };
    }
  }

  /**
   * Get user's 2FA status
   */
  public get2FAStatus(userId: string): { enabled: boolean; hasBackupCodes: boolean } {
    const twoFARecord = this.db.get2FA(userId);
    
    if (!twoFARecord) {
      return { enabled: false, hasBackupCodes: false };
    }

    const backupCodes = twoFARecord.backup_codes ? JSON.parse(twoFARecord.backup_codes) : [];
    
    return {
      enabled: !!twoFARecord.enabled,
      hasBackupCodes: backupCodes.length > 0
    };
  }

  /**
   * Generate new backup codes for a user
   */
  public generateNewBackupCodes(userId: string): string[] {
    const backupCodes = this.generateBackupCodes();
    const twoFARecord = this.db.get2FA(userId);
    
    if (twoFARecord) {
      // Update with new backup codes but keep existing secret
      this.db.setup2FA(userId, twoFARecord.secret, backupCodes);
    }
    
    console.log(`✅ New backup codes generated for user: ${userId}`);
    return backupCodes;
  }

  /**
   * Get user by ID (safe version without sensitive data)
   */
  public getUser(userId: string): User | null {
    const user = this.db.getUserById(userId);
    if (!user) return null;

    return {
      id: user.user_id,
      username: user.username,
      created_at: user.created_at,
      last_login: user.last_login,
      failed_attempts: user.failed_attempts,
      locked_until: user.locked_until
    };
  }

  /**
   * Check if username exists
   */
  public usernameExists(username: string): boolean {
    return !!this.db.getUserByUsername(username.trim().toLowerCase());
  }
}

export default UserAuthService;
