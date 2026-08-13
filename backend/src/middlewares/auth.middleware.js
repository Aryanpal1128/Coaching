import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication token is required');
  }

  try {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new ApiError(500, 'Server misconfiguration: JWT_ACCESS_SECRET not set');
    }
    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Invalid user account token');
    }

    if (user.isSuspended) {
      throw new ApiError(403, 'Account has been suspended. Please contact admin.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Token expired or invalid: ' + error.message);
  }
});

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'User authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Role [${req.user.role}] is not authorized for this resource.`
        )
      );
    }

    next();
  };
};

