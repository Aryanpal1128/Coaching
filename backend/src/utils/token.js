import jwt from 'jsonwebtoken';

// Validate required JWT secrets at module load time.
// If these are missing the server would silently sign tokens with a known
// fallback string — a critical security vulnerability. Fail fast instead.
const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET environment variable is not set');
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return secret;
};

export const generateTokens = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(
    payload,
    getAccessSecret(),
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    getRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );

  return { accessToken, refreshToken };
};

export const generatePendingOTPToken = (userData, otp) => {
  return jwt.sign(
    {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      otp: otp,
      type: 'PENDING_OTP'
    },
    getAccessSecret(),
    { expiresIn: '15m' }
  );
};

export const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, type: 'RESET_PASSWORD' },
    getAccessSecret(),
    { expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRATION || '1h' }
  );
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
