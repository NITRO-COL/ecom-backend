import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { FilterQuery } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { Order, IOrder, IOrderItem, OrderStatus } from '../models/Order';
import { Product } from '../models/Product';
import { PaymentSetting } from '../models/PaymentSetting';
import { nextSequence } from '../models/Counter';

const FREE_SHIP_OVER = 999;
const FLAT_SHIPPING = 49;

async function buildOrderNumber(): Promise<string> {
  const seq = await nextSequence('order');
  const yy = new Date().getFullYear().toString().slice(-2);
  return `SBH${yy}${String(seq).padStart(5, '0')}`;
}

/* ───────────── Create (guest or registered) ───────────── */

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body as {
    items: { product: string; quantity: number; size?: string; color?: string }[];
    shippingAddress: IOrder['shippingAddress'];
    paymentMethod: 'cod' | 'prepaid';
    notes?: string;
  };

  // 1) Payment method must be enabled by admin.
  const method = await PaymentSetting.findOne({ key: paymentMethod });
  if (!method || !method.isEnabled) {
    throw AppError.badRequest('Selected payment method is currently unavailable');
  }

  // 2) Resolve products from DB and compute prices server-side.
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems: IOrderItem[] = [];
  let itemsTotal = 0;
  let originalTotal = 0;

  for (const line of items) {
    const product = productMap.get(line.product);
    if (!product) throw AppError.badRequest('One or more items are no longer available');
    if (product.stock < line.quantity) {
      throw AppError.badRequest(`"${product.name}" has only ${product.stock} left in stock`);
    }
    const unitPrice =
      product.discountedPrice != null && product.discountedPrice < product.price
        ? product.discountedPrice
        : product.price;
    const lineTotal = unitPrice * line.quantity;

    itemsTotal += lineTotal;
    originalTotal += product.price * line.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      slug: product.slug,
      size: line.size,
      color: line.color,
      unitPrice,
      quantity: line.quantity,
      lineTotal,
    });
  }

  const shippingFee = itemsTotal >= FREE_SHIP_OVER ? 0 : FLAT_SHIPPING;
  const discountTotal = Math.max(0, originalTotal - itemsTotal);
  const grandTotal = itemsTotal + shippingFee;

  // 3) Build order; guests get a secret token to look up their order later.
  const isGuest = !req.customer;
  const guestToken = isGuest ? randomBytes(24).toString('hex') : undefined;

  const order = await Order.create({
    orderNumber: await buildOrderNumber(),
    customer: req.customer?.id ?? null,
    isGuest,
    guestToken,
    contactEmail: shippingAddress.email || req.customer?.email,
    contactPhone: shippingAddress.phone,
    items: orderItems,
    shippingAddress,
    itemsTotal,
    shippingFee,
    discountTotal,
    grandTotal,
    paymentMethod,
    paymentStatus: 'unpaid',
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Order placed', at: new Date() }],
    notes,
  });

  // 4) Decrement stock atomically.
  await Promise.all(
    orderItems.map((i) =>
      Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } })
    )
  );

  res.status(201).json({
    success: true,
    data: order,
    // guestToken returned ONCE so the client can store it for tracking
    ...(guestToken ? { guestToken } : {}),
  });
});

/* ───────────── Customer: my orders ───────────── */

export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ customer: req.customer!.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const myOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.customer!.id });
  if (!order) throw AppError.notFound('Order not found');
  res.json({ success: true, data: order });
});

/* ───────────── Guest order lookup (orderNumber + phone) ───────────── */

export const guestLookup = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber, phone } = req.body as { orderNumber: string; phone: string };
  const order = await Order.findOne({
    orderNumber: orderNumber.toUpperCase().trim(),
    contactPhone: phone.trim(),
  });
  if (!order) throw AppError.notFound('No order found with those details');
  res.json({ success: true, data: order });
});

/* ───────────── Admin ───────────── */

export const adminListOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const { status, paymentStatus, type, search } = req.query as Record<string, string>;

  const filter: FilterQuery<IOrder> = {};
  if (status && status !== 'all') filter.status = status as OrderStatus;
  if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus as IOrder['paymentStatus'];
  if (type === 'guest') filter.isGuest = true;
  if (type === 'registered') filter.isGuest = false;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { contactPhone: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Order.find(filter).populate('customer', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const adminGetOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
  if (!order) throw AppError.notFound('Order not found');
  res.json({ success: true, data: order });
});

export const adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body as { status: OrderStatus; note?: string };
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  order.status = status;
  order.statusHistory.push({ status, note, at: new Date() });

  // Convenience: mark COD as paid when delivered.
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid') {
    order.paymentStatus = 'paid';
  }

  await order.save();
  res.json({ success: true, data: order });
});

export const adminUpdatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { paymentStatus } = req.body as { paymentStatus: IOrder['paymentStatus'] };
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { paymentStatus },
    { new: true }
  );
  if (!order) throw AppError.notFound('Order not found');
  res.json({ success: true, data: order });
});

export const adminPendingOrdersCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Order.countDocuments({ status: 'pending' });
  res.json({ success: true, count });
});
