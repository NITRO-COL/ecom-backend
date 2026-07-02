import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, verifyCustomerToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';
import { Customer } from '../models/Customer';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

/** Requires a valid admin JWT and an active admin account. */
export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized('Admin authentication required');

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired admin session');
  }

  const admin = await User.findById(payload.id);
  if (!admin || !admin.isActive) throw AppError.unauthorized('Admin account not found or disabled');

  req.admin = payload;
  next();
});

/** Requires a valid customer JWT. */
export const requireCustomer = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized('Please log in to continue');

    let payload;
    try {
      payload = verifyCustomerToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired session');
    }

    const customer = await Customer.findById(payload.id);
    if (!customer || !customer.isActive) throw AppError.unauthorized('Account not found or disabled');

    req.customer = payload;
    next();
  }
);

/** Attaches the customer if a valid token is present, but never blocks (guest-friendly). */
export const optionalCustomer = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return next();
    try {
      req.customer = verifyCustomerToken(token);
    } catch {
      /* ignore — treat as guest */
    }
    next();
  }
);
