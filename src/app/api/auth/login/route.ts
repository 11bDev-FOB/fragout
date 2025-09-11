import { NextRequest, NextResponse } from 'next/server';
import { UserAuthService } from '@/services';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, twoFactorCode } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const userAuth = new UserAuthService();
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const result = await userAuth.authenticateUser(username, password, ipAddress);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // If 2FA is required
    if (result.requires2FA) {
      if (!twoFactorCode) {
        return NextResponse.json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication code required'
        });
      }

      // Verify 2FA code
      const twoFactorResult = userAuth.verify2FA(result.userId!, twoFactorCode, ipAddress);
      if (!twoFactorResult.success) {
        return NextResponse.json(
          { error: twoFactorResult.error },
          { status: 401 }
        );
      }
    }

    // Create JWT session
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const sessionToken = jwt.sign(
      { 
        userId: result.userId, 
        authType: 'username',
        username: username.trim().toLowerCase()
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      authType: 'username'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
