module.exports = {
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  importJWK: jest.fn(),
  importPKCS8: jest.fn().mockResolvedValue('mock-private-key'),
};
