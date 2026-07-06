import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest<T = any> extends FastifyRequest {
  user: {
    sub: string;
    iat: number;
    exp: number;
  };
  body: T;
}
