import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';

/* ───────────── Admin: manage customers ───────────── */

export const adminListCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const { search } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const adminGetCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw AppError.notFound('Customer not found');
  const orders = await Order.find({ customer: customer._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { customer, orders } });
});

export const adminToggleCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) throw AppError.notFound('Customer not found');
  customer.isActive = !customer.isActive;
  await customer.save();
  res.json({ success: true, data: customer });
});

/**
 * Guest "customers": guests don't have a Customer record, so we surface them
 * by grouping guest orders by phone number. Lets admin manage them separately.
 */
export const adminListGuests = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query as Record<string, string>;
  const match: Record<string, unknown> = { isGuest: true };
  if (search) {
    match.$or = [
      { contactPhone: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
    ];
  }

  const guests = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$contactPhone',
        name: { $first: '$shippingAddress.fullName' },
        email: { $first: '$contactEmail' },
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: '$grandTotal' },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
    { $sort: { lastOrderAt: -1 } },
    { $limit: 200 },
  ]);

  res.json({ success: true, data: guests });
});

/* ───────────── Customer: own profile + addresses ───────────── */

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone } = req.body as { name?: string; phone?: string };
  const customer = await Customer.findById(req.customer!.id);
  if (!customer) throw AppError.notFound('Account not found');
  if (name) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  await customer.save();
  res.json({ success: true, data: customer });
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.customer!.id);
  if (!customer) throw AppError.notFound('Account not found');
  if (req.body.isDefault) customer.addresses.forEach((a) => (a.isDefault = false));
  customer.addresses.push(req.body);
  await customer.save();
  res.status(201).json({ success: true, data: customer.addresses });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.customer!.id);
  if (!customer) throw AppError.notFound('Account not found');
  customer.addresses = customer.addresses.filter(
    (a) => String((a as unknown as { _id: unknown })._id) !== req.params.addressId
  );
  await customer.save();
  res.json({ success: true, data: customer.addresses });
});
