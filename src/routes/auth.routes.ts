import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { requireAdmin, requireCustomer } from '../middleware/auth';
import {
  adminLoginSchema,
  customerLoginSchema,
  customerRegisterSchema,
} from '../validators';
import {
  adminLogin,
  adminMe,
  customerLogin,
  customerMe,
  customerRegister,
} from '../controllers/auth.controller';

const router = Router();

// Admin
router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);
router.get('/admin/me', requireAdmin, adminMe);

// Customer
router.post('/customer/register', authLimiter, validate(customerRegisterSchema), customerRegister);
router.post('/customer/login', authLimiter, validate(customerLoginSchema), customerLogin);
router.get('/customer/me', requireCustomer, customerMe);

export default router;
