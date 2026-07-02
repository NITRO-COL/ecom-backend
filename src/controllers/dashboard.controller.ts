import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    activeProducts,
    totalCustomers,
    revenueAgg,
    statusAgg,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Customer.countDocuments(),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'returned'] } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(8).select('orderNumber grandTotal status paymentMethod createdAt shippingAddress.fullName'),
    Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select('name stock images price'),
  ]);

  const statusBreakdown: Record<string, number> = {};
  statusAgg.forEach((s: { _id: string; count: number }) => (statusBreakdown[s._id] = s.count));

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      totalProducts,
      activeProducts,
      totalCustomers,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      statusBreakdown,
      recentOrders,
      lowStock,
    },
  });
});
