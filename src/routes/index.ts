import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import bannerRoutes from './banner.routes';
import paymentRoutes from './payment.routes';
import customerRoutes from './customer.routes';
import miscRoutes from './misc.routes';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, status: 'ok', service: 'sanwariya-api', time: new Date().toISOString() })
);

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/banners', bannerRoutes);
router.use('/payment-methods', paymentRoutes);
router.use('/customers', customerRoutes);
router.use('/', miscRoutes);

export default router;
