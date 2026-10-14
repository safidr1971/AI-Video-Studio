import { Request, Response, NextFunction } from 'express';
import { verifyToken, VerifiedUser } from '../firebaseAdmin.ts';

declare global {
  namespace Express {
    interface Request {
      user?: VerifiedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Missing Bearer token in Authorization header.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Empty Bearer token.',
    });
    return;
  }

  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid, malformed, or expired Firebase ID token.',
    });
    return;
  }
}
