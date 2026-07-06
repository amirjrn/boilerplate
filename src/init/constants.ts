//------------------------------------------------//
//----------------Authentication------------------//
//------------------------------------------------//
const BCRYPT_SALT_SIZE = 10;
const ACCESS_TOKEN_EXPIRY = '1m';

export { BCRYPT_SALT_SIZE, ACCESS_TOKEN_EXPIRY };

//------------------------------------------------//
//----------------Email/OTP Settings--------------//
//------------------------------------------------//
const EMAIL_SENDER = 'boilerplate@appboilerplate.com';
const OTP_MIN_VALUE = 100000;
const OTP_MAX_VALUE = 1000000;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_RATE_LIMIT_THRESHOLD_SECONDS = 240; // 4 minutes (if TTL > 240, user must wait)
const OTP_REDIS_KEY_PREFIX = 'otp:';
const OTP_TEMPLATE_PATH = '.email/otp.hbs';

export {
  EMAIL_SENDER,
  OTP_MIN_VALUE,
  OTP_MAX_VALUE,
  OTP_EXPIRY_SECONDS,
  OTP_RATE_LIMIT_THRESHOLD_SECONDS,
  OTP_REDIS_KEY_PREFIX,
  OTP_TEMPLATE_PATH,
};

//------------------------------------------------//
//----------------Apple OAuth---------------------//
//------------------------------------------------//
// NOTE: These values should ideally be in environment variables for security
// Consider moving APPLE_KEY_ID, APPLE_CLIENT_ID, and APPLE_TEAM_ID to .env
const APPLE_KEY_ID = 'V7SW4ZQ46G';
const APPLE_CLIENT_ID = 'app.boilerplate.learn';
const APPLE_TEAM_ID = 'A98NTM7WMG';
const APPLE_AUDIENCE = 'https://appleid.apple.com';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_JWT_ALGORITHM = 'ES256';
const APPLE_CLIENT_SECRET_EXPIRY = '5m';
const APPLE_DEFAULT_USER_NAME = 'Apple User';

export {
  APPLE_KEY_ID,
  APPLE_CLIENT_ID,
  APPLE_TEAM_ID,
  APPLE_AUDIENCE,
  APPLE_TOKEN_URL,
  APPLE_JWKS_URL,
  APPLE_JWT_ALGORITHM,
  APPLE_CLIENT_SECRET_EXPIRY,
  APPLE_DEFAULT_USER_NAME,
};

//------------------------------------------------//
//----------------Google OAuth--------------------//
//------------------------------------------------//
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REDIRECT_URI = 'http://localhost:3000/google-oauth'; // For mobile/web apps using authorization code flow
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUER_URLS = [
  'https://accounts.google.com',
  'accounts.google.com',
];

export {
  GOOGLE_TOKEN_URL,
  GOOGLE_REDIRECT_URI,
  GOOGLE_JWKS_URL,
  GOOGLE_ISSUER_URLS,
};

//------------------------------------------------//
//----------------HTTP Headers--------------------//
//------------------------------------------------//
const CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';
const OAUTH_GRANT_TYPE_AUTH_CODE = 'authorization_code';

export { CONTENT_TYPE_FORM_URLENCODED, OAUTH_GRANT_TYPE_AUTH_CODE };

//------------------------------------------------//
//----------------Error Messages------------------//
//------------------------------------------------//
const ERROR_MESSAGES = {
  // OTP/Email errors
  OTP_RATE_LIMIT: 'Please wait 1 minute before requesting a new code.',
  OTP_INVALID: 'Invalid OTP',
  EMAIL_VERIFICATION_FAILED: 'Email verification failed',

  // OAuth errors
  GOOGLE_USER_ID_MISMATCH: 'Google user ID does not match token subject',
  GOOGLE_VERIFICATION_FAILED: 'Google verification failed',
  GOOGLE_TOKEN_EXCHANGE_FAILED: 'Google token exchange failed.',
  GOOGLE_ID_TOKEN_INVALID: 'Google ID token is invalid or expired.',

  APPLE_USER_ID_MISMATCH: 'Apple user ID does not match token subject',
  APPLE_VERIFICATION_FAILED: 'Apple verification failed',
  APPLE_TOKEN_EXCHANGE_FAILED: 'Apple token exchange failed.',
  APPLE_ID_TOKEN_INVALID: 'ID token is invalid or expired.',
  APPLE_CLIENT_SECRET_GENERATION_FAILED: 'Failed to generate client secret.',

  // Token errors
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
  ACCESS_TOKEN_SECRET_NOT_CONFIGURED: 'Access token secret not configured',

  // General errors
  USER_ALREADY_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
};

export { ERROR_MESSAGES };

//------------------------------------------------//
//----------------Success Messages----------------//
//------------------------------------------------//
const SUCCESS_MESSAGES = {
  EMAIL_SENT: 'Email sent successfully',
};

export { SUCCESS_MESSAGES };

//------------------------------------------------//
//----------------Log Messages--------------------//
//------------------------------------------------//
const LOG_MESSAGES = {
  GOOGLE_TOKEN_EXCHANGE_REQUEST: 'Sending token exchange request to Google...',
  GOOGLE_VERIFICATION_SUCCESS: '-> Verification successful for user sub:',
  GOOGLE_VERIFYING_TOKEN:
    '-> Verifying Google ID Token signature and claims...',

  APPLE_TOKEN_EXCHANGE_REQUEST: 'Sending token exchange request to Apple...',
  APPLE_VERIFICATION_SUCCESS: '-> Verification successful for user sub:',
  APPLE_VERIFYING_TOKEN: '-> Verifying ID Token signature and claims...',

  REFRESH_TOKEN_GENERATED: 'Generated new access token and refresh token',
};

export { LOG_MESSAGES };

//------------------------------------------------//
//----------------Email Configuration-------------//
//------------------------------------------------//
const EMAIL_SUBJECT_VERIFICATION = 'Your Verification Code';
const EMAIL_TITLE_VERIFICATION = 'Your Verification Code';

export { EMAIL_SUBJECT_VERIFICATION, EMAIL_TITLE_VERIFICATION };

//------------------------------------------------//
//----------------Cache Configuration-------------//
//------------------------------------------------//
const CACHE_NAMESPACE = 'prisma';
const CACHE_DEFAULT_TTL = 60; // 60 seconds
const CACHE_DEFAULT_STALE_TIME = 10; // 10 seconds
const CACHE_MEMORY_FALLBACK = true;
const CACHE_MEMORY_MAX_ITEMS = 1000;

// Model-specific cache TTLs
const CACHE_MODEL_TTL = {
  User: 300,
  RefreshToken: 0, // Don't cache tokens (security)
  Lesson: 300,
  Achievement: 300,
  Progress: 30,
  Language: 300,
};

// Model-specific stale times
const CACHE_MODEL_STALE_TIME = {
  User: 5,
  Lesson: 60,
};

export {
  CACHE_NAMESPACE,
  CACHE_DEFAULT_TTL,
  CACHE_DEFAULT_STALE_TIME,
  CACHE_MEMORY_FALLBACK,
  CACHE_MEMORY_MAX_ITEMS,
  CACHE_MODEL_TTL,
  CACHE_MODEL_STALE_TIME,
};
