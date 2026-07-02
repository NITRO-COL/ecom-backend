import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAdmin, requireCustomer, optionalCustomer } from '../middleware/auth';
import {
  orderCreateSchema,
  orderStatusUpdateSchema,
  paymentStatusUpdateSchema,
  guestLookupSchema,
} from '../validators';
import {
  createOrder,
  myOrders,
  myOrderById,
  guestLookup,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  adminPendingOrdersCount,
} from '../controllers/order.controller';

const router = Router();

// Place order — guest OR logged-in customer (optionalCustomer attaches if token present)
router.post('/', optionalCustomer, validate(orderCreateSchema), createOrder);

// Guest tracking
router.post('/track', validate(guestLookupSchema), guestLookup);

// Customer
router.get('/mine', requireCustomer, myOrders);
router.get('/mine/:id', requireCustomer, myOrderById);

// Admin
router.get('/admin', requireAdmin, adminListOrders);
router.get('/admin/pending-count', requireAdmin, adminPendingOrdersCount);
router.get('/admin/:id', requireAdmin, adminGetOrder);
router.patch('/admin/:id/status', requireAdmin, validate(orderStatusUpdateSchema), adminUpdateOrderStatus);
router.patch('/admin/:id/payment', requireAdmin, validate(paymentStatusUpdateSchema), adminUpdatePaymentStatus);

export default router;
