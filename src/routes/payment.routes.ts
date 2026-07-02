import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAdmin } from '../middleware/auth';
import { paymentToggleSchema } from '../validators';
import {
  getEnabledPaymentMethods,
  adminListPaymentMethods,
  togglePaymentMethod,
} from '../controllers/paymentSetting.controller';

const router = Router();

// Public
router.get('/', getEnabledPaymentMethods);

// Admin
router.get('/admin', requireAdmin, adminListPaymentMethods);
router.patch('/admin/:key', requireAdmin, validate(paymentToggleSchema), togglePaymentMethod);

export default router;
