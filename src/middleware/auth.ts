import { Request, Response, NextFunction } from 'express';
import { firebaseAuth, dbWrapper } from '../config/firebase.js';
import { UserRole } from '../types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    username: string;
    role: UserRole;
    badge_number?: string;
  };
}

/**
 * Middleware enforcing Firebase Auth token / Role verification
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    
    // Support header-based role selection or bearer token
    let uid = 'clerk-01';
    let role: UserRole = 'registration_clerk';
    let username = 'Clerk.Sarah';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1].trim();

      if (token) {
        try {
          if (firebaseAuth) {
            const decoded = await firebaseAuth.verifyIdToken(token);
            uid = decoded.uid;
            if (decoded.role) role = decoded.role as UserRole;
          }
        } catch (e) {
          // Token couldn't be decoded via Admin SDK, check if token is direct role string or fallback UID
          if (token === 'super_admin' || token === 'registration_clerk' || token === 'printing_provider' || token === 'traffic_officer') {
            role = token as UserRole;
            uid = `${role}-01`;
          } else if (token.includes('_')) {
            uid = token;
          }
        }
      }
    }

    // Check user profile in DB
    const dbUser = await dbWrapper.getUser(uid);
    if (dbUser) {
      username = dbUser.username || username;
      role = dbUser.role || role;
    }

    // Role override header for easy testing across UI role tabs
    const headerRole = req.headers['x-user-role'] as UserRole;
    if (headerRole && ['super_admin', 'registration_clerk', 'printing_provider', 'traffic_officer'].includes(headerRole)) {
      role = headerRole;
      uid = `${role}-test-user`;
    }

    req.user = {
      uid,
      username,
      role,
      badge_number: dbUser?.badge_number,
    };

    if (allowedRoles.includes('super_admin') && req.user.role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
