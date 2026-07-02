import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { signAdminToken, signCustomerToken } from '../utils/jwt';

/* ───────────── Admin ───────────── */

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const admin = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!admin.isActive) throw AppError.forbidden('This admin account is disabled');

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signAdminToken({ id: admin.id, role: 'admin', email: admin.email });

  res.json({
    success: true,
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
});

export const adminMe = asyncHandler(async (req: Request, res: Response) => {
  const admin = await User.findById(req.admin!.id);
  if (!admin) throw AppError.notFound('Admin not found');
  res.json({ success: true, admin });
});

/* ───────────── Customer ───────────── */

export const customerRegister = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body as {
    name: string;
    email: string;
    phone?: string;
    password: string;
  };

  const exists = await Customer.findOne({ email: email.toLowerCase() });
  if (exists) throw AppError.conflict('An account with this email already exists');

  const customer = await Customer.create({ name, email, phone, password });
  const token = signCustomerToken({ id: customer.id, role: 'customer', email: customer.email! });

  res.status(201).json({
    success: true,
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  });
});

export const customerLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');
  if (!customer || !(await customer.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!customer.isActive) throw AppError.forbidden('This account is disabled');

  const token = signCustomerToken({ id: customer.id, role: 'customer', email: customer.email! });

  res.json({
    success: true,
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  });
});

export const customerMe = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.customer!.id);
  if (!customer) throw AppError.notFound('Account not found');
  res.json({ success: true, customer });
});
