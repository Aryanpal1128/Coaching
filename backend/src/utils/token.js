import jwt from 'jsonwebtoken';

export const generateTokens = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );

  return { accessToken, refreshToken };
};

export const generateEmailVerificationToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, type: 'VERIFY_EMAIL' },
    process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
    { expiresIn: process.env.JWT_VERIFY_EMAIL_EXPIRATION || '24h' }
  );
};

export const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, type: 'RESET_PASSWORD' },
    process.env.JWT_ACCESS_SECRET || 'fallback_access_secret',
    { expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRATION || '1h' }
  );
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
