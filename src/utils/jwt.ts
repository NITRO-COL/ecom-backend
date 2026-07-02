import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type AdminTokenPayload = { id: string; role: 'admin'; email: string };
export type CustomerTokenPayload = { id: string; role: 'customer'; email: string };

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.jwtAdminSecret, {
    expiresIn: env.jwtAdminExpiresIn,
  } as SignOptions);
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.jwtAdminSecret) as AdminTokenPayload;
}

export function signCustomerToken(payload: CustomerTokenPayload): string {
  return jwt.sign(payload, env.jwtCustomerSecret, {
    expiresIn: env.jwtCustomerExpiresIn,
  } as SignOptions);
}

export function verifyCustomerToken(token: string): CustomerTokenPayload {
  return jwt.verify(token, env.jwtCustomerSecret) as CustomerTokenPayload;
}
