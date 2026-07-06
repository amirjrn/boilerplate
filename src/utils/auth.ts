import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ACCESS_TOKEN_EXPIRY, BCRYPT_SALT_SIZE } from '../init/constants';
import { sign as signJWT, verify } from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// User password checks
// ---------------------------------------------------------------------------

async function comparePassword(
  plainPassword: string,
  hashPassword: string,
): Promise<boolean> {
  if (!plainPassword) return false;

  return bcrypt.compare(plainPassword, hashPassword);
}

async function cryptPassword(password: string) {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_SIZE);

  return bcrypt.hash(password, salt);
}

// ---------------------------------------------------------------------------
// Generate & Verify Tokens
// ---------------------------------------------------------------------------

function generateAccessToken(userId: string, secret: string) {
  return signJWT({ sub: userId }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function verifyAccessToken(token: string, secret: string) {
  return verify(token, secret);
}

// Create random refresh token
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export {
  comparePassword,
  cryptPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
};
