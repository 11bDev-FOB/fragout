import { NextRequest, NextResponse } from 'next/server';
import { UserAuthService } from '@/services';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getSessionFromCookie(): Promise<{ userId: string; authType: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) return null;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;

    const decoded = jwt.verify(sessionCookie.value, jwtSecret) as any;
    return { userId: decoded.userId, authType: decoded.authType };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.authType !== 'username') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userAuth = new UserAuthService();
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const setup = await userAuth.setup2FA(session.userId, username);

    if (!setup) {
      return NextResponse.json(
        { error: '2FA setup failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      secret: setup.secret,
      qrCodeUrl: setup.qrCodeUrl,
      backupCodes: setup.backupCodes
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: '2FA setup failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.authType !== 'username') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, code } = await request.json();
    const userAuth = new UserAuthService();

    if (action === 'enable') {
      if (!code) {
        return NextResponse.json(
          { error: '2FA code is required' },
          { status: 400 }
        );
      }

      const result = userAuth.enable2FA(session.userId, code);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '2FA enabled successfully'
      });
    }

    if (action === 'disable') {
      userAuth.disable2FA(session.userId);
      return NextResponse.json({
        success: true,
        message: '2FA disabled successfully'
      });
    }

    if (action === 'regenerate-codes') {
      const backupCodes = userAuth.generateNewBackupCodes(session.userId);
      return NextResponse.json({
        success: true,
        backupCodes
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('2FA management error:', error);
    return NextResponse.json(
      { error: '2FA management failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.authType !== 'username') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userAuth = new UserAuthService();
    const status = userAuth.get2FAStatus(session.userId);

    return NextResponse.json({
      success: true,
      enabled: status.enabled,
      hasBackupCodes: status.hasBackupCodes
    });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}
